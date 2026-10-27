const { contextBridge, ipcRenderer } = require('electron');

if (window.top === window.self) {
  try {
    contextBridge.exposeInMainWorld('byazenDesktop', {
      electron: true,
      platform: process.platform,
      openSite: (id, url) => ipcRenderer.send('byazen:site-open', { id, url }),
      setActiveSite: (id, bounds) => ipcRenderer.send('byazen:site-active', { id, bounds }),
      closeSite: id => ipcRenderer.send('byazen:site-close', id),
      getPageContext: id => ipcRenderer.invoke('byazen:page-context', id),
      getPageSelection: id => ipcRenderer.invoke('byazen:page-selection', id),
      setPageZoom: (id,factor) => ipcRenderer.invoke('byazen:page-zoom',{id,factor}),
      printPage: id => ipcRenderer.invoke('byazen:page-print',id),
      performPageAction: (id, action) => ipcRenderer.invoke('byazen:page-action', { id, action }),
      onSiteEvent: callback => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('byazen:site-event', listener);
        return () => ipcRenderer.removeListener('byazen:site-event', listener);
      }
    });
  } catch {}
  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('electron');
  });
}
