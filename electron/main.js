const { app, BrowserWindow, WebContentsView, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { startServer } = require('../server');

app.setName('ByAzen');

let win = null;
let server = null;
const siteViews = new Map();

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


function trustedUi(event) { return !!(win && !win.isDestroyed() && event.sender === win.webContents); }
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

    win.once('ready-to-show', () => win.show());
    win.on('closed', () => { win = null; siteViews.clear(); });

    await win.loadURL(`http://127.0.0.1:${port}/`);
  });

  app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
  });
}
