const { app, BrowserWindow, WebContentsView, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { registerPiperHandlers } = require('./piper');
const { startServer } = require('../server');

app.setName('ByAzen');

let win = null;
let server = null;
const siteViews = new Map();
const websitePermissionLog=[];
const configuredSiteSessions=new WeakSet();
const downloadRecords=[];
const downloadItems=new Map();
let downloadSequence=0;
let downloadSaveTimer=null;

const PAGE_CONTEXT_SCRIPT = `(() => {
  const visible = el => { const r=el.getBoundingClientRect(), s=getComputedStyle(el); return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'; };
  const label = el => {
    const labels=el.labels?[...el.labels].map(x=>x.innerText).join(' '):'';
    return String(el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.getAttribute('title')||labels||el.name||'').replace(/\\s+/g,' ').trim().slice(0,180);
  };
  const controls=[...document.querySelectorAll('a,button,input,textarea,select,[role="button"],[role="link"],[contenteditable="true"]')]
    .filter(el=>visible(el)&&el.type!=='password'&&el.type!=='hidden')
    .slice(0,90).map(el=>({tag:el.tagName.toLowerCase(),type:el.type||'',label:label(el),placeholder:el.getAttribute('placeholder')||'',disabled:!!el.disabled}));
  return {title:document.title,url:location.href,text:(document.body?.innerText||'').replace(/\\n{3,}/g,'\\n\\n').slice(0,8500),controls};
})()`;

const PAGE_ACTION_SCRIPT = `(() => {
  const a=__BYAZEN_ACTION__;
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
  const label=el=>{const labels=el.labels?[...el.labels].map(x=>x.innerText).join(' '):'';return String(el.innerText||el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.getAttribute('title')||labels||el.name||'').replace(/\\s+/g,' ').trim().slice(0,180)};
  const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\\p{L}\\p{N}]+/gu,' ').trim();
  const match=(els,q)=>{const n=norm(q);if(!n)return null;let best=null,score=0;for(const el of els){if(!visible(el)||el.disabled)continue;const l=norm(label(el));let z=l===n?100:l.startsWith(n)?80:l.includes(n)?60:n.includes(l)&&l.length>2?40:0;if(z>score){best=el;score=z;}}return best;};
  const sensitive=el=>/password|credit|cardnumber|cc-number|cvc|cvv|one-time-code/i.test([el.type,el.name,el.id,el.autocomplete].join(' '));
  const dangerous=s=>/(купить|заказ|оплат|плат[её]ж|удалить|удаление|оформить|подтвердить покуп|отправить сообщ|publish|delete|purchase|buy now|checkout|pay now|place order|submit|send message)/i.test(s||'');
  if(a.type==='read') return {ok:true,tool:'read',snapshot:(()=>{const es=[...document.querySelectorAll('a,button,input,textarea,select,[role="button"],[role="link"]')].filter(el=>visible(el)&&!sensitive(el)).slice(0,90);return {title:document.title,url:location.href,text:(document.body?.innerText||'').slice(0,8500),controls:es.map(el=>({tag:el.tagName.toLowerCase(),type:el.type||'',label:label(el),placeholder:el.getAttribute('placeholder')||''}))};})()};
  if(a.type==='click'){
    const els=[...document.querySelectorAll('a,button,input[type="submit"],input[type="button"],[role="button"],[role="link"]')];const el=match(els,a.target);if(!el)return {ok:false,error:'Не нашла подходящую кнопку или ссылку: '+a.target};const name=label(el)||el.tagName;
    if(dangerous(name)&&!a.confirmed)return {ok:false,confirmationRequired:true,target:name,message:'Это действие может отправить данные, удалить что-либо или оформить покупку.'};
    el.click();return {ok:true,action:'click',target:name};
  }
  if(a.type==='fill'){
    const els=[...document.querySelectorAll('input:not([type="password"]):not([type="hidden"]),textarea,[contenteditable="true"]')].filter(el=>!sensitive(el));const el=match(els,a.target);if(!el)return {ok:false,error:'Не нашла текстовое поле: '+a.target};
    const value=String(a.value||'').slice(0,1200);el.focus();
    if(el.isContentEditable)el.textContent=value;else{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;if(setter)setter.call(el,value);else el.value=value;}
    el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));el.dispatchEvent(new Event('change',{bubbles:true}));return {ok:true,action:'fill',target:label(el)};
  }
  if(a.type==='select'){
    const el=match([...document.querySelectorAll('select')],a.target);if(!el)return {ok:false,error:'Не нашла список: '+a.target};const wanted=norm(a.value);const option=[...el.options].find(o=>norm(o.textContent)===wanted)||[...el.options].find(o=>norm(o.textContent).includes(wanted));if(!option)return {ok:false,error:'В списке не найден вариант: '+a.value};el.value=option.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return {ok:true,action:'select',target:label(el),value:option.textContent.trim()};
  }
  if(a.type==='press'){
    const key=String(a.key||'');const allowed=['Enter','Escape','Tab','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Backspace','Delete','Space'];if(!allowed.includes(key))return {ok:false,error:'Эта клавиша не разрешена'};
    const el=document.activeElement||document.body;
    if(key==='Enter'&&el.form){const submit=el.form.querySelector('button[type="submit"],input[type="submit"]'),name=submit?label(submit):'';if(submit&&dangerous(name)&&!a.confirmed)return {ok:false,confirmationRequired:true,target:name,message:'Enter может подтвердить отправку или покупку.'};if(submit){el.form.requestSubmit(submit);return {ok:true,action:'submit',target:name||'форма'};}}
    const init={key:key==='Space'?' ':key,code:key==='Space'?'Space':key,bubbles:true,cancelable:true};el.dispatchEvent(new KeyboardEvent('keydown',init));el.dispatchEvent(new KeyboardEvent('keyup',init));return {ok:true,action:'press',key};
  }
  if(a.type==='scroll'){
    const direction=a.direction==='up'?-1:1,amount=Math.max(100,Math.min(1200,Number(a.amount)||650));window.scrollBy({top:direction*amount,behavior:'smooth'});return {ok:true,action:'scroll',direction:direction<0?'up':'down',amount};
  }
  return {ok:false,error:'Неизвестное действие страницы'};
})()`;

function pageScript(script, payload) {
  return script.replace('__BYAZEN_ACTION__', () => JSON.stringify(payload));
}

function waitForPageIdle(contents, timeout=7000) {
  if (!contents.isLoading()) return Promise.resolve();
  return new Promise(resolve => {
    const finish=()=>{clearTimeout(timer);contents.removeListener('did-stop-loading',finish);resolve();};
    const timer=setTimeout(finish,timeout);
    contents.once('did-stop-loading',finish);
  });
}

function sendSiteEvent(id, type, data = {}) {
  if (win && !win.isDestroyed()) win.webContents.send('byazen:site-event', { id, type, ...data });
}

function publishDownload(record){
  if(!record.privateOwnerId&&win&&!win.isDestroyed())win.webContents.send('byazen:download-event',{...record});
}
function persistDownloadHistory(immediate=false){
  if(downloadSaveTimer){clearTimeout(downloadSaveTimer);downloadSaveTimer=null;}
  if(!immediate){downloadSaveTimer=setTimeout(()=>persistDownloadHistory(true),300);downloadSaveTimer.unref?.();return;}
  try{
    const file=path.join(app.getPath('userData'),'download-history.json');
    fs.mkdirSync(path.dirname(file),{recursive:true});
    const records=downloadRecords.filter(x=>!x.privateOwnerId).slice(0,100).map(x=>({
      id:x.id,fileName:x.fileName,source:x.source,total:x.total,received:x.received,
      status:['awaiting','downloading','paused'].includes(x.status)?'interrupted':x.status,
      createdAt:x.createdAt,path:x.path||'',error:x.error||'',canResume:false
    }));
    const temporary=`${file}.tmp`;
    fs.writeFileSync(temporary,JSON.stringify(records));
    fs.renameSync(temporary,file);
  }catch{}
}
function loadDownloadHistory(){
  try{
    const file=path.join(app.getPath('userData'),'download-history.json');
    const records=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!Array.isArray(records))return;
    for(const item of records.slice(0,100).reverse()){
      if(!item||!Number.isSafeInteger(item.id)||typeof item.fileName!=='string')continue;
      const status=['completed','cancelled','failed','interrupted','blocked'].includes(item.status)?item.status:'interrupted';
      const record={id:item.id,fileName:item.fileName.slice(0,160),source:typeof item.source==='string'?item.source.slice(0,512):'',total:Number(item.total)||0,received:Number(item.received)||0,status,createdAt:Number(item.createdAt)||Date.now(),path:typeof item.path==='string'?item.path:'',error:typeof item.error==='string'?item.error.slice(0,200):'',canResume:false};
      if(record.status==='completed'&&record.path&&!fs.existsSync(record.path)){record.status='failed';record.error='Сохранённый файл не найден';record.path='';}
      downloadRecords.unshift(record);downloadSequence=Math.max(downloadSequence,record.id);
    }
  }catch{}
}
function patchDownload(record,changes){Object.assign(record,changes);if(!record.privateOwnerId)persistDownloadHistory();publishDownload(record);}
function safeDownloadFilename(value){
  let name=String(value||'download').replace(/\\/g,'/').split('/').pop().replace(/[<>:"|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').replace(/^\.+/,'').slice(0,160);
  if(!name||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name))name=`_${name||'download'}`;
  return name;
}
function watchDownload(item,record){
  item.on('updated',(_event,state)=>{
    const received=item.getReceivedBytes(),canResume=state==='interrupted'&&typeof item.canResume==='function'&&item.canResume();
    record.canResume=!!canResume;
    patchDownload(record,{status:state==='interrupted'?'interrupted':item.isPaused()?'paused':'downloading',received,total:item.getTotalBytes()});
  });
  item.on('done',(_event,state)=>{
    const received=item.getReceivedBytes(),canResume=state==='interrupted'&&typeof item.canResume==='function'&&item.canResume();
    const status=state==='completed'?'completed':state==='cancelled'?'cancelled':state==='interrupted'?'interrupted':'failed';
    patchDownload(record,{status,received,total:item.getTotalBytes(),canResume:!!canResume});
    if(status!=='interrupted'||!canResume)downloadItems.delete(record.id);
  });
}
function configureSiteSession(session,isPrivate=false,privateOwnerId=null){
  if(configuredSiteSessions.has(session))return;
  configuredSiteSessions.add(session);
  session.on('will-download',(event,item)=>{
    let source;
    try{source=new URL(item.getURL());}catch{item.cancel();return;}
    if(!['http:','https:'].includes(source.protocol)){item.cancel();return;}
    const fileName=safeDownloadFilename(item.getFilename());
    const record={id:++downloadSequence,fileName,source:source.origin,total:item.getTotalBytes(),received:item.getReceivedBytes(),status:'awaiting',createdAt:Date.now(),path:'',canResume:false,...(isPrivate?{privateOwnerId}: {})};
    downloadRecords.unshift(record);if(!privateOwnerId)persistDownloadHistory();while(downloadRecords.length>100){const index=downloadRecords.findIndex(x=>!['awaiting','downloading'].includes(x.status));if(index<0)break;const [removed]=downloadRecords.splice(index,1);downloadItems.delete(removed.id);}downloadItems.set(record.id,item);publishDownload(record);
    if(!win||win.isDestroyed()){patchDownload(record,{status:'cancelled'});downloadItems.delete(record.id);item.cancel();return;}
    item.pause();
    const dangerous=/\.(exe|msi|msix|appx|bat|cmd|com|scr|cpl|hta|ps1|vbs|js|reg)$/i.test(fileName);
    const approve=dangerous?dialog.showMessageBox(win,{type:'warning',buttons:['Продолжить','Отмена'],defaultId:1,cancelId:1,noLink:true,title:'Потенциально опасный файл',message:`Сайт предлагает загрузить «${fileName}».`,detail:'Исполняемые файлы могут повредить компьютер. Продолжайте только если доверяете источнику.'}).then(result=>result.response===0):Promise.resolve(true);
    approve.then(async allowed=>{
      if(!allowed||item.isCanceled()){patchDownload(record,{status:'cancelled'});downloadItems.delete(record.id);return item.cancel();}
      if(!win||win.isDestroyed()||item.isCanceled()){patchDownload(record,{status:'cancelled'});downloadItems.delete(record.id);return item.cancel();}
      const choice=await dialog.showSaveDialog(win,{title:'Сохранить загрузку',defaultPath:path.join(app.getPath('downloads'),fileName),buttonLabel:'Сохранить'});
      if(choice.canceled||!choice.filePath||item.isCanceled()){patchDownload(record,{status:'cancelled'});downloadItems.delete(record.id);return item.cancel();}
      item.setSavePath(choice.filePath);record.path=choice.filePath;watchDownload(item,record);patchDownload(record,{status:'downloading',path:choice.filePath,total:item.getTotalBytes()});item.resume();
    }).catch(error=>{patchDownload(record,{status:'failed',error:String(error.message||error).slice(0,160)});downloadItems.delete(record.id);item.cancel();});
  });
  session.setPermissionRequestHandler((requester,permission,callback,details)=>{
    let origin='unknown';try{origin=new URL(details?.requestingUrl||requester.getURL()).origin;}catch{}
    websitePermissionLog.unshift({origin,permission,time:Date.now()});
    if(websitePermissionLog.length>100)websitePermissionLog.length=100;
    callback(false);
  });
  session.setPermissionCheckHandler(()=>false);
}

function createSiteView(id,isPrivate=false) {
  const view = new WebContentsView({
    webPreferences: {
      partition: isPrivate?`byazen-private-${id}`:'persist:byazen-sites',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.contentView.addChildView(view);
  view.byazenPrivate=!!isPrivate;
  view.setVisible(false);
  const guest = view.webContents;
  configureSiteSession(guest.session,isPrivate,isPrivate?id:null);
  guest.on('before-input-event',(event,input)=>{
    if(input.type!=='keyDown')return;
    const key=String(input.key||'').toLowerCase(),ctrl=!!(input.control||input.meta),shift=!!input.shift,alt=!!input.alt;
    let shortcut='';
    if(ctrl&&shift&&key==='r')shortcut='hard-reload';
    else if(ctrl&&shift&&key==='n')shortcut='private-tab';
    else if(ctrl&&shift&&key==='p')shortcut='feature-studio';
    else if(ctrl&&shift&&key==='j')shortcut='downloads';
    else if(ctrl&&key==='f')shortcut='find';
    else if(ctrl&&key==='t')shortcut='new-tab';
    else if(ctrl&&key==='w')shortcut='close-tab';
    else if(ctrl&&key==='l')shortcut='focus-address';
    else if(ctrl&&key==='tab')shortcut=shift?'previous-tab':'next-tab';
    else if(ctrl&&key==='r')shortcut='reload';
    else if(ctrl&&key==='0')shortcut='zoom-reset';
    else if(ctrl&&(key==='+'||key==='='))shortcut='zoom-in';
    else if(ctrl&&key==='-')shortcut='zoom-out';
    else if(alt&&key==='arrowleft')shortcut='back';
    else if(alt&&key==='arrowright')shortcut='forward';
    if(shortcut){event.preventDefault();sendSiteEvent(id,'shortcut',{key:shortcut});}
  });
  guest.on('found-in-page',(_event,result)=>sendSiteEvent(id,'find-result',result));
  guest.on('update-target-url',(_event,url)=>sendSiteEvent(id,'link-hover',{url:String(url||'').slice(0,2048)}));
  guest.on('context-menu',(event,params)=>{
    event.preventDefault();
    sendSiteEvent(id,'page-context-menu',{x:Number(params.x)||0,y:Number(params.y)||0,linkURL:String(params.linkURL||'').slice(0,2048),srcURL:String(params.srcURL||'').slice(0,2048),mediaType:String(params.mediaType||''),selectionText:String(params.selectionText||'').slice(0,1000),isEditable:!!params.isEditable});
  });

  const openOutsidePrivateSession=url=>{
    if(isPrivate){const insecure=/^http:\/\//i.test(url),choice=dialog.showMessageBoxSync(win,{type:'warning',buttons:['Отмена','Открыть'],defaultId:0,cancelId:0,title:insecure?'Незащищённое соединение':'Переход из приватной вкладки',message:insecure?'Эта ссылка откроется вне приватной сессии ByAzen и передаст данные по незашифрованному HTTP-соединению. Продолжить?':'Эта ссылка откроется во внешнем приложении вне приватной сессии ByAzen. Продолжить?'});if(choice!==1)return;}
    shell.openExternal(url).catch(()=>{});
  };
  guest.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) openOutsidePrivateSession(url);
    return { action: 'deny' };
  });
  guest.on('will-navigate', (event, url) => {
    if (!/^https?:\/\//i.test(url) && url !== 'about:blank') {
      event.preventDefault();
      if (/^(mailto:|tel:)/i.test(url)) openOutsidePrivateSession(url);
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
  const privateMode=payload.private===true;
  let view=siteViews.get(id);
  if(view&&view.byazenPrivate!==privateMode){const oldSession=view.byazenPrivate?view.webContents.session:null;win.contentView.removeChildView(view);view.webContents.close();siteViews.delete(id);if(oldSession){oldSession.clearStorageData().catch(()=>{});oldSession.clearCache().catch(()=>{});}view=null;}
  view=view||createSiteView(id,privateMode);
  view.webContents.loadURL(url).catch(error => {
    sendSiteEvent(id, 'failure', { errorDescription: error.message, url });
  });
});


function trustedUi(event) { return !!(win && !win.isDestroyed() && event.sender === win.webContents); }
registerPiperHandlers(ipcMain, { app, isTrusted: trustedUi, getWindow: () => win, resourcesPath: process.resourcesPath });
ipcMain.handle('byazen:open-voice-settings',event=>{
  if(!trustedUi(event)||process.platform!=='win32')return {ok:false};
  try{shell.openExternal('ms-settings:speech').catch(()=>{});return {ok:true};}catch{return {ok:false};}
});
ipcMain.handle('byazen:open-language-settings',event=>{
  if(!trustedUi(event)||process.platform!=='win32')return {ok:false};
  try{shell.openExternal('ms-settings:regionlanguage').catch(()=>{});return {ok:true};}catch{return {ok:false};}
});
ipcMain.handle('byazen:permission-log',event=>trustedUi(event)?websitePermissionLog.slice(0,100):[]);
ipcMain.handle('byazen:permission-log-clear',event=>{if(!trustedUi(event))return false;websitePermissionLog.length=0;return true;});
ipcMain.handle('byazen:downloads-list',event=>trustedUi(event)?downloadRecords.filter(x=>!x.privateOwnerId).map(x=>({...x})):[]);
ipcMain.handle('byazen:download-link',(event,payload={})=>{if(!trustedUi(event))return {ok:false};const id=Number(payload.id),url=String(payload.url||'');const contents=pageView(id);if(!contents||url.length>4096||!/^https?:\/\//i.test(url))return {ok:false};try{contents.downloadURL(url);return {ok:true};}catch{return {ok:false};}});
ipcMain.handle('byazen:downloads-pause',(event,id)=>{if(!trustedUi(event))return {ok:false};const numeric=Number(id),item=downloadItems.get(numeric),record=downloadRecords.find(x=>x.id===numeric);if(!item||!record||record.status!=='downloading')return {ok:false};try{item.pause();patchDownload(record,{status:'paused'});return {ok:true};}catch{return {ok:false};}});
ipcMain.handle('byazen:downloads-resume',(event,id)=>{if(!trustedUi(event))return {ok:false};const numeric=Number(id),item=downloadItems.get(numeric),record=downloadRecords.find(x=>x.id===numeric);if(!item||!record||!['interrupted','paused'].includes(record.status))return {ok:false};if(record.status==='interrupted'&&(typeof item.canResume!=='function'||!item.canResume()))return {ok:false};try{record.canResume=false;patchDownload(record,{status:'downloading'});item.resume();return {ok:true};}catch{return {ok:false};}});
ipcMain.handle('byazen:downloads-folder',async event=>{if(!trustedUi(event))return {ok:false};try{const error=await shell.openPath(app.getPath('downloads'));return {ok:!error,error:error||''};}catch{return {ok:false};}});
ipcMain.handle('byazen:downloads-cancel',(event,id)=>{if(!trustedUi(event))return {ok:false};const numeric=Number(id),item=downloadItems.get(numeric),record=downloadRecords.find(x=>x.id===numeric);if(!item||item.isCanceled())return {ok:false};item.cancel();if(record)patchDownload(record,{status:'cancelled'});downloadItems.delete(numeric);return {ok:true};});
ipcMain.handle('byazen:downloads-clear',event=>{if(!trustedUi(event))return false;for(let i=downloadRecords.length-1;i>=0;i--){const item=downloadRecords[i];if(!['awaiting','downloading','paused'].includes(item.status)&&!(item.status==='interrupted'&&item.canResume))downloadRecords.splice(i,1);}persistDownloadHistory(true);return true;});
ipcMain.handle('byazen:downloads-open',async(event,id)=>{if(!trustedUi(event))return {ok:false};const item=downloadRecords.find(x=>x.id===Number(id));if(!item||item.status!=='completed'||!item.path)return {ok:false};try{const error=await shell.openPath(item.path);return {ok:!error,error:error||''};}catch{return {ok:false,error:'Не удалось открыть файл'};}});
ipcMain.handle('byazen:downloads-reveal',(event,id)=>{if(!trustedUi(event))return {ok:false};const item=downloadRecords.find(x=>x.id===Number(id));if(!item||item.status!=='completed'||!item.path)return {ok:false};try{shell.showItemInFolder(item.path);return {ok:true};}catch{return {ok:false};}});
function pageView(id) {
  const view=siteViews.get(Number(id));
  if(!view||view.webContents.isDestroyed()) return null;
  try { if(!/^https?:$/.test(new URL(view.webContents.getURL()).protocol)) return null; } catch { return null; }
  return view.webContents;
}

ipcMain.handle('byazen:page-context', async (event, idValue) => {
  if(!trustedUi(event)) return {error:'Недоверенный источник'};
  const contents=pageView(idValue);
  if(!contents) return {error:'Нет активной веб-страницы'};
  try {
    await waitForPageIdle(contents,5000);
    const page=await contents.executeJavaScript(PAGE_CONTEXT_SCRIPT);
    return {url:contents.getURL(),title:contents.getTitle(),...page};
  } catch(error) { return {error:'Не удалось прочитать страницу: '+String(error.message||error).slice(0,180)}; }
});

ipcMain.handle('byazen:page-selection', async (event,idValue)=>{
  if(!trustedUi(event))return '';
  const contents=pageView(idValue);if(!contents)return '';
  try{return String(await contents.executeJavaScript('String(window.getSelection()?.toString()||"").trim()')).slice(0,3000);}catch{return '';}
});
ipcMain.handle('byazen:page-zoom', async (event,payload={})=>{
  if(!trustedUi(event))return {ok:false};
  const contents=pageView(payload.id);if(!contents)return {ok:false};
  const factor=Math.max(.5,Math.min(2,Number(payload.factor)||1));
  try{contents.setZoomFactor(factor);return {ok:true,factor};}catch{return {ok:false};}
});
ipcMain.handle('byazen:page-hard-reload',(event,idValue)=>{if(!trustedUi(event))return {ok:false};const contents=pageView(idValue);if(!contents)return {ok:false};try{contents.reloadIgnoringCache();return {ok:true};}catch{return {ok:false};}});
ipcMain.handle('byazen:page-mute',async(event,idValue)=>{
  if(!trustedUi(event))return {ok:false};const contents=pageView(idValue);if(!contents)return {ok:false};
  try{const muted=!contents.isAudioMuted();contents.setAudioMuted(muted);return {ok:true,muted};}catch{return {ok:false};}
});
ipcMain.handle('byazen:page-find',async(event,payload={})=>{
  if(!trustedUi(event))return {ok:false};const contents=pageView(payload.id);if(!contents)return {ok:false};
  const text=String(payload.text||'').trim().slice(0,300);
  if(!text){try{contents.stopFindInPage('clearSelection');}catch{}return {ok:true,requestId:0};}
  try{return {ok:true,requestId:contents.findInPage(text,{forward:payload.forward!==false,findNext:payload.findNext===true,matchCase:false})};}catch{return {ok:false};}
});
ipcMain.handle('byazen:page-find-stop',(event,idValue)=>{if(!trustedUi(event))return false;const contents=pageView(idValue);if(!contents)return false;try{contents.stopFindInPage('clearSelection');return true;}catch{return false;}});
ipcMain.handle('byazen:page-edit-command',(event,payload={})=>{if(!trustedUi(event)||!['copy','cut','paste'].includes(payload.command))return {ok:false};const contents=pageView(payload.id);if(!contents)return {ok:false};try{contents[payload.command]();return {ok:true};}catch{return {ok:false};}});

ipcMain.handle('byazen:page-print', async (event,idValue)=>{
  if(!trustedUi(event))return {ok:false,error:'Недоверенный источник'};
  const contents=pageView(idValue);if(!contents)return {ok:false,error:'Нет веб-страницы для печати'};
  return new Promise(resolve=>contents.print({},(success,failureReason)=>resolve({ok:success,error:failureReason||''})));
});

ipcMain.handle('byazen:page-action', async (event, payload = {}) => {
  if(!trustedUi(event)) return {ok:false,error:'Недоверенный источник'};
  const contents=pageView(payload.id);
  if(!contents) return {ok:false,error:'Нет активной веб-страницы'};
  const input=payload.action||{};
  const allowed=new Set(['read','click','fill','select','press','scroll']);
  if(!allowed.has(input.type)) return {ok:false,error:'Неизвестное действие страницы'};
  const action={type:input.type,confirmed:input.confirmed===true};
  if(['click','fill','select'].includes(action.type)) action.target=String(input.target||'').trim().slice(0,160);
  if(action.type==='fill'||action.type==='select') action.value=String(input.value||'').slice(0,1200);
  if(action.type==='press') {
    action.key=String(input.key||'');
    if(!['Enter','Escape','Tab','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Backspace','Delete','Space'].includes(action.key)) return {ok:false,error:'Эта клавиша не разрешена'};
  }
  if(action.type==='scroll') {
    action.direction=input.direction==='up'?'up':'down';
    action.amount=Math.max(100,Math.min(1200,Number(input.amount)||650));
  }
  try {
    if(action.type==='read') {
      await waitForPageIdle(contents,5000);
      const page=await contents.executeJavaScript(PAGE_CONTEXT_SCRIPT);
      return {ok:true,tool:'read',snapshot:{url:contents.getURL(),title:contents.getTitle(),...page}};
    }
    if(['click','press'].includes(action.type)) await new Promise(resolve=>setTimeout(resolve,180));
    const result=await contents.executeJavaScript(pageScript(PAGE_ACTION_SCRIPT,action));
    if(result?.confirmationRequired||!result?.ok) return result;
    if(['click','press'].includes(action.type)) await waitForPageIdle(contents,6500);
    return result;
  } catch(error) { return {ok:false,error:'Действие страницы не выполнено: '+String(error.message||error).slice(0,180)}; }
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
  const privateSession=view.byazenPrivate?view.webContents.session:null;
  if(view.byazenPrivate)for(let i=downloadRecords.length-1;i>=0;i--)if(downloadRecords[i].privateOwnerId===id){const record=downloadRecords[i],item=downloadItems.get(record.id);if(item&&!item.isCanceled())item.cancel();downloadItems.delete(record.id);downloadRecords.splice(i,1);persistDownloadHistory();}
  win.contentView.removeChildView(view);
  view.webContents.close();
  siteViews.delete(id);
  if(privateSession){privateSession.clearStorageData().catch(()=>{});privateSession.clearCache().catch(()=>{});}
});

// Один запущенный экземпляр
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.on('before-quit',()=>persistDownloadHistory(true));

  app.whenReady().then(async () => {
    loadDownloadHistory();
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

    // Mic permission is granted only to the trusted app renderer, never to website tabs.
    // The main renderer is locked to the local UI by the will-navigate handler below.
    win.webContents.session.setPermissionRequestHandler((requester, permission, callback) => {
      callback(requester === win.webContents && permission === 'media');
    });
    win.webContents.session.setPermissionCheckHandler((requester, permission) => {
      return requester === win.webContents && permission === 'media';
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

    let allowWindowClose=false,closeConfirmationPending=false;
    win.on('close', event=>{
      if(allowWindowClose)return;
      event.preventDefault();
      if(closeConfirmationPending)return;
      closeConfirmationPending=true;
      Promise.race([
        win.webContents.executeJavaScript('typeof tabs !== "undefined" ? tabs.length : 2'),
        new Promise(resolve=>setTimeout(()=>resolve(2),1200))
      ]).then(async count=>{
        if(count>1){
          const answer=await dialog.showMessageBox(win,{type:'question',buttons:['Закрыть окно','Отмена'],defaultId:1,cancelId:1,noLink:true,title:'Закрыть ByAzen?',message:`Открыто вкладок: ${count}. Закрыть браузер?`,detail:'Сессия вкладок будет сохранена и восстановлена при следующем запуске.'});
          if(answer.response!==0)return;
        }
        try{if(win&&!win.isDestroyed())await win.webContents.executeJavaScript('window.__byazenPrepareToClose?.()');}catch{}
        allowWindowClose=true;
        if(win&&!win.isDestroyed())win.close();
      }).catch(async()=>{
        if(!win||win.isDestroyed())return;
        try{const answer=await dialog.showMessageBox(win,{type:'question',buttons:['Закрыть окно','Отмена'],defaultId:1,cancelId:1,title:'Закрыть ByAzen?',message:'Закрыть окно браузера?',detail:'Сессия будет сохранена.'});if(answer.response===0){allowWindowClose=true;win.close();}}catch{}
      }).finally(()=>{closeConfirmationPending=false;});
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
