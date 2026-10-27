const { contextBridge, ipcRenderer } = require('electron');

if (window.top === window.self) {
  try {
    contextBridge.exposeInMainWorld('byazenDesktop', {
      electron: true,
      platform: process.platform,
      registerBrowser: () => ipcRenderer.invoke('byazen:register-browser'),
      onOpenUrl: callback => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('byazen:open-url', listener);
        return () => ipcRenderer.removeListener('byazen:open-url', listener);
      },
      openVoiceSettings: () => ipcRenderer.invoke('byazen:open-voice-settings'),
      openLanguageSettings: () => ipcRenderer.invoke('byazen:open-language-settings'),
      listPiperVoices: () => ipcRenderer.invoke('byazen:piper-catalog'),
      downloadPiperVoice: id => ipcRenderer.invoke('byazen:piper-download', id),
      deletePiperVoice: id => ipcRenderer.invoke('byazen:piper-delete', id),
      synthesizePiper: (id, text, rate) => ipcRenderer.invoke('byazen:piper-synthesize', { id, text, rate }),
      onPiperProgress: callback => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('byazen:piper-progress', listener);
        return () => ipcRenderer.removeListener('byazen:piper-progress', listener);
      },
      getWhisperCatalog: () => ipcRenderer.invoke('byazen:whisper-catalog'),
      downloadWhisperModel: () => ipcRenderer.invoke('byazen:whisper-download'),
      deleteWhisperModel: () => ipcRenderer.invoke('byazen:whisper-delete'),
      transcribeWhisper: (audio, language) => ipcRenderer.invoke('byazen:whisper-transcribe', { audio, language }),
      onWhisperProgress: callback => {
        const listener = (_event, data) => callback(data);
        ipcRenderer.on('byazen:whisper-progress', listener);
        return () => ipcRenderer.removeListener('byazen:whisper-progress', listener);
      },
      openSite: (id, url, isPrivate=false) => ipcRenderer.send('byazen:site-open', { id, url, private:!!isPrivate }),
      setActiveSite: (id, bounds) => ipcRenderer.send('byazen:site-active', { id, bounds }),
      closeSite: id => ipcRenderer.send('byazen:site-close', id),
      getPageContext: id => ipcRenderer.invoke('byazen:page-context', id),
      getPageSelection: id => ipcRenderer.invoke('byazen:page-selection', id),
      setPageZoom: (id,factor) => ipcRenderer.invoke('byazen:page-zoom',{id,factor}),
      printPage: id => ipcRenderer.invoke('byazen:page-print',id),
      getPermissionLog: () => ipcRenderer.invoke('byazen:permission-log'),
      clearPermissionLog: () => ipcRenderer.invoke('byazen:permission-log-clear'),
      findPage: (id,text,options={}) => ipcRenderer.invoke('byazen:page-find',{id,text,...options}),
      stopPageFind: id => ipcRenderer.invoke('byazen:page-find-stop',id),
      editPageSelection: (id,command) => ipcRenderer.invoke('byazen:page-edit-command',{id,command}),
      togglePageMute: id => ipcRenderer.invoke('byazen:page-mute',id),
      hardReloadPage: id => ipcRenderer.invoke('byazen:page-hard-reload',id),
      getDownloads: () => ipcRenderer.invoke('byazen:downloads-list'),
      downloadLink: (id,url) => ipcRenderer.invoke('byazen:download-link',{id,url}),
      pauseDownload: id => ipcRenderer.invoke('byazen:downloads-pause',id),
      cancelDownload: id => ipcRenderer.invoke('byazen:downloads-cancel',id),
      resumeDownload: id => ipcRenderer.invoke('byazen:downloads-resume',id),
      openDownloadsFolder: () => ipcRenderer.invoke('byazen:downloads-folder'),
      clearDownloads: () => ipcRenderer.invoke('byazen:downloads-clear'),
      openDownloadedFile: id => ipcRenderer.invoke('byazen:downloads-open',id),
      revealDownloadedFile: id => ipcRenderer.invoke('byazen:downloads-reveal',id),
      onDownloadEvent: callback => {
        const listener = (_event,data) => callback(data);
        ipcRenderer.on('byazen:download-event',listener);
        return () => ipcRenderer.removeListener('byazen:download-event',listener);
      },
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
