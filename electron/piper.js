'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const { randomUUID, createHash } = require('crypto');

// Curated Russian Piper packs hosted by the official rhasspy/piper-voices
// repository. We intentionally do not accept arbitrary URLs from the renderer.
const VOICES = [
  {
    id: 'ru_RU-denis-medium', name: 'Денис', quality: 'medium', sizeBytes: 63201294,
    sha256: '15fab56e11a097858ee115545d0f697fc2a316c41a291a5362349fb870411b0a',
    license: 'CC0 (датасет указан в карточке модели)',
    modelCard: 'https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/ru/ru_RU/denis/medium/MODEL_CARD',
    base: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/denis/medium/'
  },
  {
    id: 'ru_RU-dmitri-medium', name: 'Дмитрий', quality: 'medium', sizeBytes: 63201294,
    sha256: 'f073356ebc4bd0f80c5af58df2953a5988bd5bdab1eb38635ce960b071fbefcb',
    license: 'CC0 (датасет указан в карточке модели)',
    modelCard: 'https://huggingface.co/rhasspy/piper-voices/blob/v1.0.0/ru/ru_RU/dmitri/medium/MODEL_CARD',
    base: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/dmitri/medium/'
  }
];
const VOICE_BY_ID = new Map(VOICES.map(voice => [voice.id, voice]));
const activeDownloads = new Set();

function isTrustedHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'huggingface.co' || host.endsWith('.huggingface.co') || host === 'hf.co' || host.endsWith('.hf.co');
}

function safeVoiceDirectory(app) {
  const root = path.join(app.getPath('userData'), 'piper-voices');
  fs.mkdirSync(root, { recursive: true });
  return root;
}

function voicePaths(app, id) {
  const voice = VOICE_BY_ID.get(id);
  if (!voice) return null;
  const root = safeVoiceDirectory(app);
  return {
    root,
    model: path.join(root, `${voice.id}.onnx`),
    config: path.join(root, `${voice.id}.onnx.json`)
  };
}

function listVoices(app) {
  return VOICES.map(voice => {
    const files = voicePaths(app, voice.id);
    return { ...voice, installed: fs.existsSync(files.model) && fs.existsSync(files.config) };
  });
}

function fileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.once('error', reject);
    stream.once('end', () => resolve(hash.digest('hex')));
  });
}

function requestToFile(rawUrl, destination, maxBytes, onProgress, redirects = 0) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(rawUrl); } catch { return reject(new Error('Некорректная ссылка загрузки')); }
    if (url.protocol !== 'https:' || !isTrustedHost(url.hostname)) return reject(new Error('Загрузка разрешена только с Hugging Face'));
    if (redirects > 5) return reject(new Error('Слишком много перенаправлений'));

    const request = https.get(url, { headers: { 'User-Agent': 'ByAzen/1.0 voice-pack-installer' } }, response => {
      const code = Number(response.statusCode || 0);
      if ([301, 302, 303, 307, 308].includes(code)) {
        const next = response.headers.location;
        response.resume();
        if (!next) return reject(new Error('Сервер вернул пустое перенаправление'));
        let target;
        try { target = new URL(next, url); } catch { return reject(new Error('Некорректное перенаправление')); }
        if (target.protocol !== 'https:' || !isTrustedHost(target.hostname)) return reject(new Error('Ссылка перенаправляет за пределы доверенного источника'));
        return resolve(requestToFile(target.href, destination, maxBytes, onProgress, redirects + 1));
      }
      if (code !== 200) { response.resume(); return reject(new Error(`Hugging Face вернул HTTP ${code || 'ошибку'}`)); }
      const length = Number(response.headers['content-length'] || 0);
      if (length > maxBytes) { response.destroy(); return reject(new Error('Файл превышает допустимый размер')); }

      const output = fs.createWriteStream(destination, { flags: 'wx' });
      let received = 0;
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        output.destroy();
        response.destroy();
        fs.promises.rm(destination, { force: true }).finally(() => reject(error));
      };
      output.on('error', fail);
      response.on('error', fail);
      response.on('data', chunk => {
        received += chunk.length;
        if (received > maxBytes) return fail(new Error('Загрузка остановлена: файл превысил лимит'));
        onProgress?.(received, length);
      });
      response.pipe(output);
      output.on('finish', () => {
        if (settled) return;
        settled = true;
        output.close(() => resolve({ bytes: received, contentLength: length }));
      });
    });
    request.setTimeout(45000, () => request.destroy(new Error('Истекло время ожидания загрузки')));
    request.on('error', error => {
      fs.promises.rm(destination, { force: true }).finally(() => reject(error));
    });
  });
}

function sendProgress(getWindow, data) {
  const win = getWindow();
  if (win && !win.isDestroyed()) win.webContents.send('byazen:piper-progress', data);
}

async function downloadVoice(app, getWindow, id) {
  const voice = VOICE_BY_ID.get(id);
  if (!voice) throw new Error('Голос отсутствует в доверенном каталоге');
  if (activeDownloads.has(id)) throw new Error('Этот голос уже загружается');
  activeDownloads.add(id);
  const files = voicePaths(app, id);
  const token = randomUUID();
  const targets = [
    { name: `${id}.onnx`, path: files.model, max: 100 * 1024 * 1024, expected: voice.sizeBytes },
    { name: `${id}.onnx.json`, path: files.config, max: 256 * 1024, expected: 0 }
  ];
  try {
    await fs.promises.rm(files.model, { force: true });
    await fs.promises.rm(files.config, { force: true });
    for (let index = 0; index < targets.length; index++) {
      const file = targets[index];
      const partial = `${file.path}.${token}.part`;
      sendProgress(getWindow, { id, status: 'downloading', file: file.name, fileIndex: index + 1, fileCount: targets.length, received: 0, total: file.expected });
      let lastProgressAt = 0;
      try {
        const result = await requestToFile(`${voice.base}${file.name}?download=true`, partial, file.max, (received, total) => {
          const now = Date.now();
          if (now - lastProgressAt >= 250) {
            lastProgressAt = now;
            sendProgress(getWindow, { id, status: 'downloading', file: file.name, fileIndex: index + 1, fileCount: targets.length, received, total: total || file.expected });
          }
        });
        if (file.name.endsWith('.onnx')) {
          if (result.bytes < 10 * 1024 * 1024) throw new Error('Файл модели слишком мал и выглядит повреждённым');
          const digest = await fileSha256(partial);
          if (digest !== voice.sha256) throw new Error('Проверка целостности голоса не пройдена; файл удалён');
        } else {
          const config = JSON.parse(await fs.promises.readFile(partial, 'utf8'));
          if (!config || typeof config !== 'object' || !config.audio || !config.espeak) throw new Error('Конфигурация Piper недействительна');
        }
        await fs.promises.rename(partial, file.path);
      } catch (error) {
        await fs.promises.rm(partial, { force: true }).catch(() => {});
        throw error;
      }
    }
    sendProgress(getWindow, { id, status: 'installed' });
    return { ok: true, voices: listVoices(app) };
  } catch (error) {
    await fs.promises.rm(files.model, { force: true }).catch(() => {});
    await fs.promises.rm(files.config, { force: true }).catch(() => {});
    sendProgress(getWindow, { id, status: 'error', error: String(error.message || error).slice(0, 240) });
    return { ok: false, error: String(error.message || error).slice(0, 240) };
  } finally {
    activeDownloads.delete(id);
  }
}

function findPiperExecutable(resourcesPath, app) {
  const roots = [
    path.join(resourcesPath || '', 'piper', 'piper', 'piper.exe'),
    path.join(resourcesPath || '', 'piper', 'piper.exe'),
    path.join(app.getAppPath(), 'resources', 'piper', 'piper', 'piper.exe'),
    path.join(__dirname, '..', 'resources', 'piper', 'piper', 'piper.exe')
  ];
  return roots.find(file => fs.existsSync(file)) || roots[0];
}

async function synthesize(app, resourcesPath, id, text, rate) {
  const voice = VOICE_BY_ID.get(id);
  const files = voicePaths(app, id);
  if (!voice || !files || !fs.existsSync(files.model) || !fs.existsSync(files.config)) return { ok: false, error: 'Сначала скачайте этот голос в каталоге' };
  const executable = findPiperExecutable(resourcesPath, app);
  if (!fs.existsSync(executable)) return { ok: false, error: 'В этой сборке не найден голосовой движок Piper' };
  const normalized = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 3000);
  if (!normalized) return { ok: false, error: 'Нет текста для озвучивания' };

  const work = await fs.promises.mkdtemp(path.join(app.getPath('temp'), 'byazen-piper-'));
  const output = path.join(work, 'speech.wav');
  try {
    const speed = Math.max(0.8, Math.min(1.2, Number(rate) || 1));
    await new Promise((resolve, reject) => {
      const child = spawn(executable, ['--model', files.model, '--config', files.config, '--output_file', output, '--length-scale', String(1 / speed)], {
        windowsHide: true,
        cwd: path.dirname(executable),
        env: { ...process.env, PYTHONUTF8: '1' },
        stdio: ['pipe', 'ignore', 'pipe']
      });
      let stderr = '';
      const timeout = setTimeout(() => child.kill(), 120000);
      child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-2000); });
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('close', code => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(stderr.includes('timed out') ? 'Озвучивание заняло слишком много времени' : `Piper завершился с ошибкой${stderr ? `: ${stderr.trim().slice(-500)}` : ''}`));
      });
      child.stdin.end(normalized + '\n', 'utf8');
    });
    const stat = await fs.promises.stat(output);
    if (!stat.isFile() || stat.size < 44 || stat.size > 50 * 1024 * 1024) throw new Error('Piper создал аудиофайл неверного размера');
    const wav = await fs.promises.readFile(output);
    if (wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Piper создал некорректный WAV-файл');
    return { ok: true, audio: new Uint8Array(wav) };
  } catch (error) {
    return { ok: false, error: String(error.message || error).slice(0, 500) };
  } finally {
    await fs.promises.rm(work, { recursive: true, force: true }).catch(() => {});
  }
}

function registerPiperHandlers(ipcMain, { app, isTrusted, getWindow, resourcesPath }) {
  ipcMain.handle('byazen:piper-catalog', event => isTrusted(event) ? listVoices(app) : []);
  ipcMain.handle('byazen:piper-download', async (event, id) => {
    if (!isTrusted(event)) return { ok: false, error: 'Недоверенный источник' };
    try { return await downloadVoice(app, getWindow, String(id || '')); }
    catch (error) { return { ok: false, error: String(error.message || error).slice(0, 240) }; }
  });
  ipcMain.handle('byazen:piper-delete', async (event, id) => {
    if (!isTrusted(event)) return { ok: false };
    const files = voicePaths(app, String(id || ''));
    if (!files) return { ok: false };
    await Promise.all([fs.promises.rm(files.model, { force: true }), fs.promises.rm(files.config, { force: true })]);
    return { ok: true, voices: listVoices(app) };
  });
  ipcMain.handle('byazen:piper-synthesize', async (event, payload = {}) => {
    if (!isTrusted(event)) return { ok: false, error: 'Недоверенный источник' };
    return synthesize(app, resourcesPath, String(payload.id || ''), payload.text, payload.rate);
  });
}

module.exports = { registerPiperHandlers, VOICES };
