const { contextBridge } = require('electron');

// Только верхний фрейм (сам интерфейс), не сайты во вкладках
if (window.top === window.self) {
  try {
    contextBridge.exposeInMainWorld('byazenDesktop', {
      electron: true,
      platform: process.platform
    });
  } catch {}
  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('electron');
  });
}
