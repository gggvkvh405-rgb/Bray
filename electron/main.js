const { app, BrowserWindow, WebContentsView, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('../server');

app.setName('ByAzen');

let win = null;
let server = null;
const siteViews = new Map();

function sendSiteEvent(id, type, data = {}) {
  if (win && !win.isDestroyed()) win.webContents.send('byazen:site-event', { id, type, ...data });
}

function createSiteView(id) {
  const view = new WebContentsView({
    webPreferences: {
      partition: 'persist:byazen-sites',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.contentView.addChildView(view);
  view.setVisible(false);
  const guest = view.webContents;

  guest.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  guest.on('will-navigate', (event, url) => {
    if (!/^https?:\/\//i.test(url) && url !== 'about:blank') {
      event.preventDefault();
      if (/^(mailto:|tel:)/i.test(url)) shell.openExternal(url);
    }
  });
  guest.on('did-navigate', (_event, url) => sendSiteEvent(id, 'navigate', { url }));
  guest.on('did-navigate-in-page', (_event, url, isMainFrame) => {
    if (isMainFrame) sendSiteEvent(id, 'navigate', { url });
  });
  guest.on('page-title-updated', (_event, title) => sendSiteEvent(id, 'title', { title }));
  guest.on('did-start-loading', () => sendSiteEvent(id, 'loading', { loading: true }));
  guest.on('did-stop-loading', () => sendSiteEvent(id, 'loading', { loading: false }));
  guest.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) {
      sendSiteEvent(id, 'failure', { errorCode, errorDescription, url: validatedURL });
    }
  });

  siteViews.set(id, view);
  return view;
}

ipcMain.on('byazen:site-open', (event, payload = {}) => {
  if (!win || event.sender !== win.webContents) return;
  const id = Number(payload.id);
  const url = String(payload.url || '');
  if (!Number.isSafeInteger(id) || !/^https?:\/\//i.test(url)) return;
  const view = siteViews.get(id) || createSiteView(id);
  view.webContents.loadURL(url).catch(error => {
    sendSiteEvent(id, 'failure', { errorDescription: error.message, url });
  });
});

ipcMain.on('byazen:site-active', (event, payload = {}) => {
  if (!win || event.sender !== win.webContents) return;
  const activeId = payload.id == null ? null : Number(payload.id);
  for (const [id, view] of siteViews) {
    const active = id === activeId;
    view.setVisible(active);
    if (active) {
      const b = payload.bounds || {};
      const [contentWidth, contentHeight] = win.getContentSize();
      const x = Math.max(0, Math.round(Number(b.x) || 0));
      const y = Math.max(0, Math.round(Number(b.y) || 0));
      const width = Math.max(1, Math.min(Math.round(Number(b.width) || 1), contentWidth - x));
      const height = Math.max(1, Math.min(Math.round(Number(b.height) || 1), contentHeight - y));
      view.setBounds({ x, y, width, height });
    }
  }
});

ipcMain.on('byazen:site-close', (event, idValue) => {
  if (!win || event.sender !== win.webContents) return;
  const id = Number(idValue);
  const view = siteViews.get(id);
  if (!view) return;
  win.contentView.removeChildView(view);
  view.webContents.close();
  siteViews.delete(id);
});

// Один запущенный экземпляр
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);

    // Локальный сервер ByAzen на свободном порту
    server = await startServer(0, '127.0.0.1');
    const port = server.address().port;

    win = new BrowserWindow({
      width: 1460,
      height: 920,
      minWidth: 1000,
      minHeight: 640,
      show: false,
      backgroundColor: '#09090B',
      icon: path.join(__dirname, '..', 'public', 'icon.png'),
      title: 'ByAzen',
      autoHideMenuBar: true,
      ...(process.platform === 'win32' ? {
        titleBarStyle: 'hidden',
        titleBarOverlay: { color: '#09090B', symbolColor: '#A1A1AA', height: 34 }
      } : {}),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    // Кнопка ↗ и target=_blank — в системный браузер, не в новое окно Electron
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });

    // Верхний фрейм никогда не уходит с локального приложения
    win.webContents.on('will-navigate', (e, url) => {
      if (!url.startsWith(`http://127.0.0.1:${port}`)) {
        e.preventDefault();
        if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      }
    });

    win.once('ready-to-show', () => win.show());
    win.on('closed', () => { win = null; siteViews.clear(); });

    await win.loadURL(`http://127.0.0.1:${port}/`);
  });

  app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
  });
}
