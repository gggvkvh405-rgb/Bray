'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { pipeline } = require('node:stream/promises');
const { Transform } = require('node:stream');
const { spawn } = require('node:child_process');

const MODEL = Object.freeze({
  id: 'base',
  name: 'Whisper Base · русский и другие языки',
  file: 'ggml-base.bin',
  sizeBytes: 147951465,
  sha256: '60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe',
  url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin?download=true',
  license: 'MIT',
  source: 'https://huggingface.co/ggerganov/whisper.cpp/blob/main/ggml-base.bin'
});
const MAX_AUDIO_SECONDS = 30;
const MAX_AUDIO_BYTES = 16000 * 2 * MAX_AUDIO_SECONDS;
let activeDownload = false;
let verifiedStamp = '';

function modelPath(app) {
  return path.join(app.getPath('userData'), 'whisper-models', MODEL.file);
}

function sendProgress(getWindow, data) {
  const window = getWindow();
  if (window && !window.isDestroyed()) window.webContents.send('byazen:whisper-progress', data);
}

function digestFile(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(file);
    input.on('error', reject);
    input.on('data', chunk => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

async function isModelInstalled(app, verify = true) {
  const file = modelPath(app);
  try {
    const stat = await fs.promises.stat(file);
    if (!stat.isFile() || stat.size !== MODEL.sizeBytes) return false;
    if (!verify) return true;
    const stamp = `${file}:${stat.size}:${stat.mtimeMs}`;
    if (verifiedStamp === stamp) return true;
    if (await digestFile(file) !== MODEL.sha256) return false;
    verifiedStamp = stamp;
    return true;
  } catch { return false; }
}

async function modelCatalog(app, platform = process.platform) {
  return {
    available: platform === 'win32',
    model: {
      id: MODEL.id,
      name: MODEL.name,
      file: MODEL.file,
      sizeBytes: MODEL.sizeBytes,
      license: MODEL.license,
      source: MODEL.source,
      installed: platform === 'win32' && await isModelInstalled(app)
    }
  };
}

function approvedHost(hostname) {
  return hostname === 'huggingface.co' || hostname.endsWith('.huggingface.co') || hostname === 'hf.co' || hostname.endsWith('.hf.co');
}

async function requestToFile(rawUrl, destination, onProgress, redirects = 0) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || !approvedHost(url.hostname)) throw new Error('Источник модели перенаправил на недоверенный домен');
  if (redirects > 6) throw new Error('Слишком много перенаправлений при загрузке модели');

  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'ByAzen-Offline-Whisper/1.0' } }, async response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location;
        response.resume();
        if (!location) return reject(new Error('Сервер модели вернул пустое перенаправление'));
        try { resolve(await requestToFile(new URL(location, url).toString(), destination, onProgress, redirects + 1)); }
        catch (error) { reject(error); }
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Сервер модели вернул HTTP ${response.statusCode}`));
        return;
      }
      const declared = Number(response.headers['content-length']) || 0;
      if (declared > MODEL.sizeBytes) {
        response.destroy();
        reject(new Error('Размер модели превышает ожидаемый предел'));
        return;
      }
      let received = 0;
      const limiter = new Transform({
        transform(chunk, _encoding, callback) {
          received += chunk.length;
          if (received > MODEL.sizeBytes) return callback(new Error('Размер модели превышает ожидаемый предел'));
          onProgress(received, declared || MODEL.sizeBytes);
          callback(null, chunk);
        }
      });
      try {
        await pipeline(response, limiter, fs.createWriteStream(destination, { flags: 'wx' }));
        if (received !== MODEL.sizeBytes) throw new Error(`Размер загруженной модели отличается от ожидаемого (${received} байт)`);
        resolve({ bytes: received });
      } catch (error) { reject(error); }
    });
    request.setTimeout(120000, () => request.destroy(new Error('Загрузка модели прервалась по таймауту')));
    request.once('error', reject);
  });
}

async function downloadModel(app, getWindow) {
  if (process.platform !== 'win32') return { ok: false, error: 'Офлайн Whisper runtime доступен в сборке Windows.' };
  if (activeDownload) return { ok: false, error: 'Загрузка модели уже выполняется.' };
  activeDownload = true;
  const destination = modelPath(app);
  const partial = `${destination}.${crypto.randomBytes(8).toString('hex')}.part`;
  try {
    if (await isModelInstalled(app)) return { ok: true, model: (await modelCatalog(app)).model };
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    sendProgress(getWindow, { id: MODEL.id, status: 'downloading', received: 0, total: MODEL.sizeBytes });
    let lastProgressAt = 0;
    await requestToFile(MODEL.url, partial, (received, total) => {
      const now = Date.now();
      if (now - lastProgressAt >= 200) {
        lastProgressAt = now;
        sendProgress(getWindow, { id: MODEL.id, status: 'downloading', received, total });
      }
    });
    const digest = await digestFile(partial);
    if (digest !== MODEL.sha256) throw new Error('SHA-256 модели не совпал с опубликованным значением; файл удалён');
    await fs.promises.rm(destination, { force: true });
    await fs.promises.rename(partial, destination);
    const stat = await fs.promises.stat(destination);
    verifiedStamp = `${destination}:${stat.size}:${stat.mtimeMs}`;
    sendProgress(getWindow, { id: MODEL.id, status: 'installed', received: MODEL.sizeBytes, total: MODEL.sizeBytes });
    return { ok: true, model: (await modelCatalog(app)).model };
  } catch (error) {
    await fs.promises.rm(partial, { force: true }).catch(() => {});
    sendProgress(getWindow, { id: MODEL.id, status: 'error', error: String(error.message || error).slice(0, 240) });
    return { ok: false, error: String(error.message || error).slice(0, 240) };
  } finally { activeDownload = false; }
}

function findExecutable(resourcesPath, app) {
  const candidates = [
    path.join(resourcesPath || '', 'whisper', 'whisper-cli.exe'),
    path.join(app.getAppPath(), 'resources', 'whisper', 'whisper-cli.exe'),
    path.join(__dirname, '..', 'resources', 'whisper', 'whisper-cli.exe')
  ];
  return candidates.find(file => fs.existsSync(file)) || candidates[0];
}

function makeWav(pcm) {
  const wav = Buffer.allocUnsafe(44 + pcm.length);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + pcm.length, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22); wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
}

async function transcribe(app, resourcesPath, payload = {}) {
  if (process.platform !== 'win32') return { ok: false, error: 'Офлайн-распознавание доступно в сборке Windows.' };
  if (!(await isModelInstalled(app))) return { ok: false, error: 'Сначала скачайте офлайн-модель Whisper в настройках речи.' };
  const input = payload.audio;
  let pcm;
  if (input instanceof ArrayBuffer) pcm = Buffer.from(input);
  else if (ArrayBuffer.isView(input)) pcm = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  else if (Buffer.isBuffer(input)) pcm = input;
  else return { ok: false, error: 'Аудиоданные имеют неверный формат.' };
  if (pcm.length < 3200 || pcm.length > MAX_AUDIO_BYTES || pcm.length % 2 !== 0) {
    return { ok: false, error: `Запись должна длиться от 0,1 до ${MAX_AUDIO_SECONDS} секунд.` };
  }

  const executable = findExecutable(resourcesPath, app);
  if (!fs.existsSync(executable)) return { ok: false, error: 'В этой сборке не найден движок whisper.cpp.' };
  const work = await fs.promises.mkdtemp(path.join(app.getPath('temp'), 'byazen-whisper-'));
  const wavPath = path.join(work, 'speech.wav');
  try {
    await fs.promises.writeFile(wavPath, makeWav(pcm));
    const language = String(payload.language || '').toLowerCase().startsWith('en') ? 'en' : 'ru';
    const output = await new Promise((resolve, reject) => {
      const child = spawn(executable, ['-m', modelPath(app), '-f', wavPath, '-l', language, '-nt', '-np', '-t', '2', '-ng'], {
        windowsHide: true,
        cwd: path.dirname(executable),
        env: { ...process.env, OMP_NUM_THREADS: '2' },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      let stdout = '', stderr = '';
      const timeout = setTimeout(() => child.kill(), 120000);
      child.stdout.on('data', chunk => { stdout = (stdout + chunk.toString('utf8')).slice(-12000); });
      child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString('utf8')).slice(-4000); });
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('close', code => {
        clearTimeout(timeout);
        if (code === 0) resolve(stdout);
        else reject(new Error(stderr.trim().slice(-700) || `Whisper завершился с кодом ${code}`));
      });
    });
    const text = String(output).replace(/\u001b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').trim().slice(0, 4000);
    if (!text) return { ok: false, error: 'Речь не распознана. Попробуйте говорить ближе к микрофону.' };
    return { ok: true, text };
  } catch (error) {
    return { ok: false, error: String(error.message || error).slice(0, 700) };
  } finally { await fs.promises.rm(work, { recursive: true, force: true }).catch(() => {}); }
}

function registerWhisperHandlers(ipcMain, { app, isTrusted, getWindow, resourcesPath }) {
  ipcMain.handle('byazen:whisper-catalog', event => isTrusted(event) ? modelCatalog(app) : { available: false, model: null });
  ipcMain.handle('byazen:whisper-download', async event => {
    if (!isTrusted(event)) return { ok: false, error: 'Недоверенный источник' };
    return downloadModel(app, getWindow);
  });
  ipcMain.handle('byazen:whisper-delete', async event => {
    if (!isTrusted(event)) return { ok: false };
    await fs.promises.rm(modelPath(app), { force: true });
    verifiedStamp = '';
    return { ok: true, catalog: await modelCatalog(app) };
  });
  ipcMain.handle('byazen:whisper-transcribe', async (event, payload = {}) => {
    if (!isTrusted(event)) return { ok: false, error: 'Недоверенный источник' };
    return transcribe(app, resourcesPath, payload);
  });
}

module.exports = { MODEL, MAX_AUDIO_SECONDS, registerWhisperHandlers, modelCatalog, makeWav };
