const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const { startServer } = require('../server');

app.setName('ByAzen');

let win = null;
let server = null;

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
    win.on('closed', () => { win = null; });

    await win.loadURL(`http://127.0.0.1:${port}/`);
  });

  app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
  });
}
