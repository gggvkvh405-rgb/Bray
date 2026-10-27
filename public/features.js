/* ByAzen feature studio: projects, saved web fragments, playful modes and AI tools. */
(()=>{
'use strict';
const esc=s=>escapeHtml(String(s??''));
const readArray=(key,max=300)=>{const value=store.get(key,[]);return Array.isArray(value)?value.filter(Boolean).slice(0,max):[];};
let projects=readArray('researchProjects',50),fragments=readArray('webFragments',200),hiddenDeskIds=new Set(),deskMode=false;
let funConfig=Object.assign({dailyTheme:false,cursorBubbles:false,tabFarewell:false,pet:'🦝',costume:'',persona:'friendly'},store.get('funConfig',{})||{});
const saveFun=()=>store.set('funConfig',funConfig);
const style=document.createElement('style');
style.textContent=`
#byazenFeatureBtn{font-size:9.5px}
#byazenFeatureDock{max-width:660px;width:100%;margin:24px auto 0;padding:13px;border:1px solid var(--border);border-radius:15px;background:rgba(255,255,255,.025)}
.byazen-dock-title{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-3);margin:0 0 10px 3px}
.byazen-dock-actions{display:flex;flex-wrap:wrap;gap:7px}
.byazen-dock-actions .btn{font-size:10.5px;padding:7px 10px}
.byazen-modal{max-width:740px;max-height:82vh;display:flex;flex-direction:column}
.byazen-modal .modal-body{overflow:auto}
.byazen-card{padding:12px;border:1px solid var(--border);background:rgba(255,255,255,.025);border-radius:12px;margin:8px 0}
.byazen-card h3{font-size:13px;margin:0 0 5px;color:var(--text)}
.byazen-card p{font-size:11px;line-height:1.5;color:var(--text-3);margin:4px 0 9px}
.byazen-card-actions{display:flex;flex-wrap:wrap;gap:7px}
.byazen-card-actions .btn{font-size:10.5px}
.byazen-list{display:grid;gap:7px;margin-top:8px}
.byazen-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid var(--border);border-radius:9px;background:rgba(255,255,255,.02)}
.byazen-item .byazen-item-main{flex:1;min-width:0}.byazen-item b{font-size:11.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.byazen-item small{display:block;color:var(--text-3);font-size:10px;overflow-wrap:anywhere}
.byazen-item .btn{font-size:10px;padding:6px 8px;flex:none}
.byazen-progress{height:6px;border-radius:5px;background:#26262c;overflow:hidden;margin:8px 0}.byazen-progress i{display:block;height:100%;width:0;background:var(--accent);transition:width .3s}
.byazen-pet{display:flex;align-items:center;justify-content:center;gap:8px;margin:14px auto 0;width:max-content;max-width:100%;padding:8px 13px;border:1px solid var(--border);border-radius:99px;background:rgba(255,255,255,.025);color:var(--text-3);font-size:11px;cursor:pointer}
.byazen-pet .face{font-size:22px;filter:drop-shadow(0 3px 6px #0008);transition:transform .25s}.byazen-pet:hover .face{transform:rotate(-10deg) scale(1.12)}
.tab[data-costume]:not([data-costume=""])::before{content:attr(data-costume);font-size:13px;margin-right:5px}.pin-btn[data-costume]:not([data-costume=""]){position:relative}.pin-btn[data-costume]:not([data-costume=""])::after{content:attr(data-costume);position:absolute;right:-2px;bottom:-4px;font-size:9px}
.byazen-desk-hidden{display:none!important}
.byazen-source-link{color:#a5b4fc;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
#byazenSnow{position:fixed;inset:0;z-index:320;background:rgba(4,8,18,.72);display:none;place-items:center;backdrop-filter:blur(4px)}#byazenSnow.show{display:grid}
.byazen-globe{width:min(390px,84vw);aspect-ratio:1;border-radius:50%;border:8px solid #cbd5e1;background:radial-gradient(circle at 32% 25%,#ffffff38,transparent 30%),linear-gradient(145deg,#173453,#1b163c);box-shadow:0 24px 90px #000a,inset 0 0 38px #a5f3fc38;position:relative;overflow:hidden;cursor:grab;touch-action:none}
.byazen-globe.shake{animation:byazenShake .55s ease-in-out}.byazen-flake{position:absolute;top:-12px;color:#fff;font-size:12px;text-shadow:0 0 6px white;animation:byazenFall 3s linear infinite;pointer-events:none}
@keyframes byazenFall{to{transform:translateY(430px) rotate(240deg);opacity:.3}}@keyframes byazenShake{25%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}75%{transform:rotate(-4deg)}}
#byazenCursorLayer{position:fixed;inset:0;pointer-events:none;z-index:500;overflow:hidden}.byazen-bubble{position:absolute;width:8px;height:8px;border:1px solid #c4b5fd;border-radius:50%;animation:byazenPop .65s ease-out forwards}@keyframes byazenPop{to{transform:translateY(-22px) scale(2.2);opacity:0}}
#byazenEaster{position:fixed;inset:0;z-index:499;pointer-events:none;display:none;background:radial-gradient(circle at 50% 50%,#5b21b655,transparent 55%)}#byazenEaster.show{display:block;animation:byazenEaster .7s alternate 4}@keyframes byazenEaster{to{filter:hue-rotate(170deg);opacity:.2}}
#toast.byazen-farewell{animation:byazenFarewell 1.1s ease-out}@keyframes byazenFarewell{0%{transform:translate(-50%,12px) scale(.8);opacity:0}20%{transform:translate(-50%,0) scale(1.03);opacity:1}100%{transform:translate(-40%,-35px) scale(.86);opacity:0}}
#byazenGame{min-height:140px;border-radius:12px;background:linear-gradient(140deg,#151d2b,#24173b);position:relative;overflow:hidden;margin:10px 0;padding:10px;color:#ddd}
#byazenGameTarget{position:absolute;left:46%;top:48%;font-size:28px;border:0;background:none;cursor:pointer;transition:left .18s,top .18s}
.ai-quick .byazen-ai-quick{border-color:#6d5ce7;color:#d6ccff}
@media(prefers-reduced-motion:reduce){.byazen-flake,.byazen-pet .face,#byazenEaster.show{animation:none!important}}
`;
document.head.appendChild(style);
const dock=document.createElement('section');dock.id='byazenFeatureDock';dock.innerHTML=`<div class="byazen-dock-title">Рабочий стол ByAzen</div><div class="byazen-dock-actions"><button class="btn" data-feature="desk">Свернуть лишние вкладки</button><button class="btn" data-feature="project-save">Снимок проекта</button><button class="btn" data-feature="projects">Продолжить проект</button><button class="btn" data-feature="fragments">Сохранённые фрагменты</button><button class="btn" data-feature="roulette">🎲 Случайная закладка</button><button class="btn" data-feature="studio">Фан-режимы</button></div></section>`;
$('#shortcuts').insertAdjacentElement('afterend',dock);
const pet=document.createElement('button');pet.type='button';pet.className='byazen-pet';pet.id='byazenPet';pet.title='Погладить питомца';
pet.innerHTML=`<span class="face">${esc(funConfig.pet)}</span><span class="pet-copy">Питомец · ${tabs.length} вкладок</span>`;
$('#greeting').insertAdjacentElement('afterend',pet);
pet.onclick=()=>{const animals=['🦝','🐉','🐸','🦊','🐙','🦖','🦉'];let i=animals.indexOf(funConfig.pet);funConfig.pet=animals[(i+1+animals.length)%animals.length];saveFun();pet.querySelector('.face').textContent=funConfig.pet;pet.querySelector('.pet-copy').textContent=`Питомец · ${tabs.length} вкладок`;toast('Питомец доволен. Наверное.');};
const featureBtn=document.createElement('button');featureBtn.className='quick-btn hide-collapsed';featureBtn.id='byazenFeatureBtn';featureBtn.title='Рабочий стол, заметки и забавные режимы';featureBtn.innerHTML='<svg><use href="#i-spark"/></svg><span class="hide-collapsed">Мастерская</span>';
$('#assistantBtn').insertAdjacentElement('afterend',featureBtn);
const modal=document.createElement('div');modal.className='modal-overlay';modal.id='byazenStudio';modal.innerHTML=`<section class="modal byazen-modal" role="dialog" aria-modal="true" aria-labelledby="byazenStudioTitle"><div class="modal-head"><div><h2 id="byazenStudioTitle">Мастерская ByAzen</h2><div class="ai-status">Проекты, фрагменты и безобидные глупости</div></div><button class="icon-btn" data-feature-close title="Закрыть">×</button></div><div class="modal-body" id="byazenStudioBody"></div></section>`;
document.body.append(modal);
const snow=document.createElement('div');snow.id='byazenSnow';snow.innerHTML='<div class="byazen-globe" id="byazenGlobe" role="button" tabindex="0" aria-label="Встряхнуть снежный шар"></div>';document.body.append(snow);
const cursorLayer=document.createElement('div');cursorLayer.id='byazenCursorLayer';document.body.append(cursorLayer);
const easter=document.createElement('div');easter.id='byazenEaster';document.body.append(easter);
modal.addEventListener('mousedown',e=>{if(e.target===modal)closeModal('byazenStudio');});
modal.querySelector('[data-feature-close]').onclick=()=>closeModal('byazenStudio');
function openStudio(){renderStudio();openModal('byazenStudio');}
window.ByAzenStudio={open:openStudio,toggleDesk,saveProjectSnapshot,openRandomBookmark};
featureBtn.onclick=openStudio;
function applyDailyTheme(){
  document.body.classList.remove('byazen-daily-theme');
  if(!funConfig.dailyTheme){document.documentElement.style.setProperty('--bg','#0A0A0C');document.documentElement.style.setProperty('--accent',settings.accent||'#FAFAFA');return;}
  const themes=[['#13192a','#b6c7ff'],['#20152b','#e9b4ff'],['#102421','#a8f0d2'],['#2a1b13','#ffd0a6'],['#171f2a','#c6e6ff']];
  const day=Math.floor(Date.now()/86400000),[bg,accent]=themes[day%themes.length];
  document.body.classList.add('byazen-daily-theme');document.documentElement.style.setProperty('--bg',bg);document.documentElement.style.setProperty('--accent',accent);
}
applyDailyTheme();
function applyDesk(){
  tabs.forEach(tab=>{for(const el of document.querySelectorAll(`[data-id="${tab.id}"]`)){el.classList.toggle('byazen-desk-hidden',deskMode&&!hiddenDeskIds.has(tab.id)&&tab.id!==activeId);}});
  const button=dock.querySelector('[data-feature="desk"]');if(button)button.textContent=deskMode?'Показать все вкладки':'Свернуть лишние вкладки';
}
const baseRenderTabs=renderTabs;
renderTabs=function(...args){baseRenderTabs(...args);for(const tab of tabs){const costume=tab.costume||funConfig.costume||'';const el=document.querySelector(`#tabs [data-id="${tab.id}"]`),pin=document.querySelector(`#pinned [data-id="${tab.id}"]`);if(el)el.dataset.costume=costume;if(pin)pin.dataset.costume=costume;}applyDesk();const p=document.querySelector('#byazenPet .pet-copy');if(p)p.textContent=`Питомец · ${tabs.length} вкладок`;};
function toggleDesk(){
  if(deskMode){deskMode=false;hiddenDeskIds.clear();applyDesk();toast('Все вкладки снова на виду');return;}
  const active=activeTab();if(!active){toast('Нет активной вкладки');return;}
  const visible=tabs.filter(t=>active.group?t.group===active.group:t.id===active.id);hiddenDeskIds=new Set(visible.map(t=>t.id));deskMode=true;applyDesk();toast(`Рабочий стол: оставила ${visible.length} вкладок`);
}
async function saveProjectSnapshot(){
  const candidates=tabs.filter(t=>!t.private&&!isInternal(t.url)&&/^https?:\/\//i.test(t.url)).slice(0,50);
  if(!candidates.length){toast('Откройте страницы проекта и попробуйте снова');return;}
  const name=(prompt('Название проекта:','Новый проект')||'').trim().slice(0,72);if(!name)return;
  const goal=(prompt('Что вы хотели выяснить? (необязательно)','')||'').trim().slice(0,500);
  const chatMessages=aiHistory.filter(m=>m.role==='assistant'&&typeof m.content==='string'&&!m.content.includes('browser_action_results')).slice(-2);
  const includeChat=chatMessages.length>0&&confirm('Добавить в снимок краткие последние ответы ИИ? Они могут содержать ваши личные заметки.');
  let summary=includeChat?chatMessages.map(m=>m.content).join('\n').slice(0,1800):'';
  if(nativeWebview&&store.get('aiPageActionsAllowed',true)!==false){
    toast('Собираю локальную сводку проекта…');
    try{const contexts=await collectOpenContexts(5);const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:aiModel||'qwen2.5:3b',persona:funConfig.persona,messages:[{role:'user',content:`Составь краткую записку для продолжения проекта завтра. Цель: ${goal||name}. Структура: что изучаем; что видно из источников; следующий разумный шаг. Используй только контекст источников, не выполняй никаких действий.`}],pageContext:{comparisonPages:contexts}}),signal:AbortSignal.timeout(30000)});const data=await response.json();if(response.ok&&data.reply)summary=String(data.reply).slice(0,1800);}catch{}
  }
  const snapshot={id:`p${Date.now()}`,name,goal,summary:summary||'Продолжите исследование с сохранённых вкладок.',tabs:candidates.map(t=>({url:t.url,title:t.title,group:t.group||'',pinned:!!t.pinned})),createdAt:Date.now()};
  projects.unshift(snapshot);projects=projects.slice(0,50);store.set('researchProjects',projects);renderStudio();toast(`Снимок «${name}» сохранён · ${snapshot.tabs.length} страниц`);
}
function resumeProject(id){
  const project=projects.find(p=>p.id===id);if(!project)return;
  const urls=Array.isArray(project.tabs)?project.tabs.filter(t=>t&&/^https?:\/\//i.test(t.url)).slice(0,20):[];
  if(urls.length>5&&!confirm(`Открыть ${urls.length} вкладок проекта «${project.name}»?`))return;
  closeModal('byazenStudio');let last=null;urls.forEach(item=>last=createTab(item.url,{title:item.title,group:item.group||'',pinned:!!item.pinned,activate:false}));if(last)activateTab(last.id);
  openAssistant();const continuation=`Продолжаем проект «${project.name}».\n${project.goal?`Цель: ${project.goal}\n`:''}${project.summary||''}`;aiHistory.push({role:'assistant',content:continuation});addAiMessage('system',continuation);
}
function renderProjects(){
  const rows=projects.map(p=>`<div class="byazen-item"><span class="byazen-item-main"><b>${esc(p.name)}</b><small>${p.tabs?.length||0} страниц · ${esc(p.goal||p.summary||'Без заметки')}</small></span><button class="btn" data-resume-project="${esc(p.id)}">Продолжить</button><button class="btn" data-delete-project="${esc(p.id)}">Удалить</button></div>`).join('');
  return `<div class="byazen-card"><h3>Снимки проекта</h3><p>Сохраняются открытые обычные вкладки, цель и краткая заметка. Приватные вкладки намеренно исключены.</p><div class="byazen-card-actions"><button class="btn primary" data-action="save-project">Сохранить текущее состояние</button><button class="btn" data-action="guide-pages">Собрать инструкцию из открытых страниц</button></div>${rows?`<div class="byazen-list">${rows}</div>`:'<p>Пока нет сохранённых проектов.</p>'}</div>`;
}
function renderFragments(){
  const rows=fragments.map(f=>`<div class="byazen-item"><span class="byazen-item-main"><b>${esc(f.title||'Фрагмент')}</b><small>${esc(f.text)}<br>${esc(f.url||'')} · ${new Date(f.savedAt||Date.now()).toLocaleString('ru-RU')}</small></span><button class="btn" data-open-fragment="${esc(f.id)}">Источник</button><button class="btn" data-copy-fragment="${esc(f.id)}">Копировать</button><button class="btn" data-delete-fragment="${esc(f.id)}">×</button></div>`).join('');
  return `<div class="byazen-card"><h3>Сохранённые фрагменты</h3><p>Добавляйте выделенные цитаты из контекстного меню страницы. Рядом сохраняется источник.</p>${rows?`<div class="byazen-list">${rows}</div>`:'<p>Фрагментов пока нет.</p>'}<div class="byazen-card-actions"><button class="btn danger" data-action="clear-fragments">Очистить сборник</button></div></div>`;
}
function renderArchaeology(){
  const list=closedTabs.map((t,i)=>`<div class="byazen-item"><span class="byazen-item-main"><b>${esc(t.title||hostOf(t.url)||'Сайт из прошлого')}</b><small>${esc(t.url)} · ${new Date(t.closedAt||Date.now()).toLocaleDateString('ru-RU')}</small></span><button class="btn" data-dig-tab="${i}">Раскопать</button></div>`).join('');
  return `<div class="byazen-card"><h3>Археология вкладок 🏺</h3><p>Недавно закрытые страницы. Восстановление не сохраняет пароли и сайтные данные отдельно.</p>${list?`<div class="byazen-list">${list}</div>`:'<p>Раскопки пока не нашли ничего. Закройте обычную вкладку — и она появится здесь.</p>'}</div>`;
}
function renderFun(){
  const costumes=['','🧢','👑','🚀','🦖','🧙','🐾'];
  return `<div class="byazen-card"><h3>Несерьёзные настройки</h3><p>Все эффекты локальные и необязательные. Ничего не отправляется наружу.</p>
    <label class="set-row"><span class="tx"><b>Случайная тема дня</b><span>Автоматически меняет оформление; выключено по умолчанию</span></span><input type="checkbox" id="funDailyTheme" ${funConfig.dailyTheme?'checked':''}></label>
    <label class="set-row"><span class="tx"><b>Пузырьки за курсором</b><span>Декоративный след; уважает системный режим уменьшения анимации</span></span><input type="checkbox" id="funCursor" ${funConfig.cursorBubbles?'checked':''}></label>
    <label class="set-row"><span class="tx"><b>Прощальный тост вкладке</b><span>Добрая фраза при закрытии вкладки</span></span><input type="checkbox" id="funFarewell" ${funConfig.tabFarewell?'checked':''}></label>
    <div class="set-row"><span class="tx"><b>Общий костюм вкладок</b><span>Украшение по умолчанию для вкладок без личного костюма</span></span><select class="field" id="funCostume">${costumes.map(c=>`<option value="${c}" ${c===funConfig.costume?'selected':''}>${c||'Без костюма'}</option>`).join('')}</select></div>
    <div class="set-row"><span class="tx"><b>Зоопарк вкладок · наряд активной</b><span>Выберите зверя или персонажа только для текущей вкладки</span></span><select class="field" id="tabZooCostume"><option value="">По умолчанию</option><option>🦝</option><option>🐉</option><option>🐸</option><option>🦊</option><option>🐙</option><option>🦖</option><option>🦉</option><option>🧢</option><option>👑</option><option>🚀</option><option>🧙</option></select></div>
    <div class="byazen-card-actions"><button class="btn" data-action="apply-zoo-costume">Нарядить активную вкладку</button><button class="btn" data-action="random-zoo">Случайные костюмы всем</button></div>
    <div class="byazen-card-actions"><button class="btn" data-action="roulette">🎲 Рулетка закладок</button><button class="btn" data-action="snow">❄️ Снежный шар</button><button class="btn" data-action="pet">Сменить питомца</button><button class="btn" data-action="game" ${tabs.some(t=>t.loading)?'':'disabled'} title="Появляется, пока загружается вкладка">Мини-игра загрузки</button><button class="btn" data-action="theme-toggle">Тайный режим BYAZEN</button></div>
    <div id="byazenGame" hidden><b>Поймай звезду, пока загружается страница</b><div id="byazenGameScore">Очки: 0 · 15 секунд</div><button id="byazenGameTarget" aria-label="Поймать звезду">⭐</button></div>
  </div>`;
}
function renderStudio(section='all'){
  const body=$('#byazenStudioBody');
  body.innerHTML=`${renderProjects()}${renderFragments()}${renderArchaeology()}${renderFun()}`;
  body.querySelector('[data-action="save-project"]').onclick=saveProjectSnapshot;
  body.querySelector('[data-action="guide-pages"]').onclick=makeInstructionFromPages;
  body.querySelector('[data-action="clear-fragments"]').onclick=()=>{if(confirm('Удалить все сохранённые фрагменты?')){fragments=[];store.set('webFragments',fragments);renderStudio();}};
  body.querySelectorAll('[data-resume-project]').forEach(b=>b.onclick=()=>resumeProject(b.dataset.resumeProject));
  body.querySelectorAll('[data-delete-project]').forEach(b=>b.onclick=()=>{projects=projects.filter(p=>p.id!==b.dataset.deleteProject);store.set('researchProjects',projects);renderStudio();});
  body.querySelectorAll('[data-open-fragment]').forEach(b=>b.onclick=()=>{const f=fragments.find(x=>x.id===b.dataset.openFragment);if(f?.url)createTab(f.url);});
  body.querySelectorAll('[data-copy-fragment]').forEach(b=>b.onclick=()=>{const f=fragments.find(x=>x.id===b.dataset.copyFragment);if(f)copyPlainText(`${f.text}\nИсточник: ${f.url}`);});
  body.querySelectorAll('[data-delete-fragment]').forEach(b=>b.onclick=()=>{fragments=fragments.filter(x=>x.id!==b.dataset.deleteFragment);store.set('webFragments',fragments);renderStudio();});
  body.querySelectorAll('[data-dig-tab]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.digTab),item=closedTabs.splice(i,1)[0];store.set('closedTabs',closedTabs);if(item)createTab(item.url,{title:item.title,group:item.group||'',pinned:!!item.pinned});renderStudio();});
  body.querySelectorAll('[data-action="roulette"]').forEach(b=>b.onclick=openRandomBookmark);
  body.querySelector('[data-action="pet"]').onclick=()=>{const faces=['🦝','🐉','🐸','🦊','🐙','🦖','🦉'];funConfig.pet=faces[(faces.indexOf(funConfig.pet)+1)%faces.length];saveFun();pet.querySelector('.face').textContent=funConfig.pet;renderStudio();};
  body.querySelector('[data-action="snow"]').onclick=()=>{closeModal('byazenStudio');openSnowGlobe();};
  body.querySelector('[data-action="theme-toggle"]').onclick=()=>{easter.classList.add('show');setTimeout(()=>easter.classList.remove('show'),3000);toast('Секретный режим активирован. Почти ничего не изменилось.');};
  body.querySelector('#funDailyTheme').onchange=e=>{funConfig.dailyTheme=e.target.checked;saveFun();applyDailyTheme();};
  body.querySelector('#funCursor').onchange=e=>{funConfig.cursorBubbles=e.target.checked;saveFun();};
  body.querySelector('#funFarewell').onchange=e=>{funConfig.tabFarewell=e.target.checked;saveFun();};
  body.querySelector('#funCostume').onchange=e=>{funConfig.costume=e.target.value;saveFun();renderTabs();};
  body.querySelector('[data-action="apply-zoo-costume"]').onclick=()=>{const tab=activeTab();if(!tab)return toast('Нет активной вкладки');tab.costume=body.querySelector('#tabZooCostume').value;renderTabs();persistTabs();toast(tab.costume?`${tab.costume} назначен вкладке`:'Костюм вкладки сброшен');};
  body.querySelector('[data-action="random-zoo"]').onclick=()=>{const animals=['🦝','🐉','🐸','🦊','🐙','🦖','🦉'];tabs.forEach(t=>t.costume=animals[Math.floor(Math.random()*animals.length)]);renderTabs();persistTabs();toast('Зоопарк вкладок сформирован');};
  body.querySelector('[data-action="game"]').onclick=()=>startLoadingMiniGame(body);
}
function openRandomBookmark(){
  if(!bookmarks.length){toast('Сначала добавьте закладки — рулетке не из чего выбирать');return;}
  const item=bookmarks[Math.floor(Math.random()*bookmarks.length)];
  if(confirm(`🎲 Рулетка выбрала «${item.title||hostOf(item.url)}». Открыть?`))navigateActive(item.url);
}
function openSnowGlobe(){
  snow.classList.add('show');if(nativeWebview)window.byazenDesktop.setActiveSite(null);const globe=$('#byazenGlobe');globe.innerHTML=`<div style="position:absolute;bottom:14%;left:28%;font-size:56px">${esc(funConfig.pet)}</div><div style="position:absolute;bottom:8%;left:43%;font-size:28px">🎄</div>`;
  for(let i=0;i<36;i++){const flake=document.createElement('span');flake.className='byazen-flake';flake.textContent=Math.random()>.5?'❄':'·';flake.style.left=Math.random()*100+'%';flake.style.animationDelay=(-Math.random()*3)+'s';flake.style.animationDuration=(2+Math.random()*3)+'s';globe.append(flake);}
  const shake=()=>{globe.classList.remove('shake');void globe.offsetWidth;globe.classList.add('shake');};
  globe.onclick=shake;
  const closeSnow=()=>{snow.classList.remove('show');globe.innerHTML='';if(nativeWebview)syncNativeBounds();};
  snow.onclick=e=>{if(e.target===snow)closeSnow();};
  globe.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeSnow();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();shake();}};
  globe.title='Нажмите, чтобы встряхнуть; щёлкните снаружи, чтобы закрыть';
}
function startLoadingMiniGame(body){
  const game=body.querySelector('#byazenGame');game.hidden=false;let score=0,remaining=15;const target=game.querySelector('#byazenGameTarget'),label=game.querySelector('#byazenGameScore');
  const move=()=>{target.style.left=Math.random()*78+10+'%';target.style.top=Math.random()*55+34+'%';};
  target.onclick=()=>{if(remaining<=0)return;score++;label.textContent=`Очки: ${score} · ${remaining} секунд`;move();};move();
  const interval=setInterval(()=>{remaining--;label.textContent=remaining>0?`Очки: ${score} · ${remaining} секунд`:`Финиш! Очки: ${score} · загрузчик вами гордится`;if(remaining<=0){clearInterval(interval);target.disabled=true;}},1000);
}
function saveFragment(state){
  if(state.private&&!confirm('Сохранить текст и адрес приватной страницы в обычный сборник фрагментов?'))return;
  const text=String(state.selection||'').trim().slice(0,3000);if(!text)return toast('Выделите текст страницы, чтобы сохранить фрагмент');
  const tab=tabs.find(t=>t.id===state.tabId);
  fragments.unshift({id:`f${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:tab?.title||'Страница',url:state.url||tab?.url||'',text,savedAt:Date.now()});fragments=fragments.slice(0,200);store.set('webFragments',fragments);toast('Фрагмент сохранён вместе с источником');
}
const baseShowPageContextMenu=showPageContextMenu;
showPageContextMenu=function(data,tab){
  baseShowPageContextMenu(data,tab);
  const menu=$('#pageCtx');if(!menu.classList.contains('show')||!pageContextState?.selection)return;
  const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.dataset.pageAction='save-fragment';button.innerHTML='<svg><use href="#i-bookmark"/></svg>Сохранить фрагмент';
  button.onclick=()=>runPageContextAction('save-fragment');menu.append(button);
};
const baseRunPageContextAction=runPageContextAction;
runPageContextAction=async function(action){
  if(action==='save-fragment'){const state=pageContextState;if(!state)return;closePageContextMenu();saveFragment(state);return;}
  return baseRunPageContextAction(action);
};
const baseCloseTab=closeTab;
closeTab=function(id){const t=tabs.find(x=>x.id===id);const result=baseCloseTab(id);if(t&&funConfig.tabFarewell){toast(t.private?'Приватная вкладка тихо закрылась.':`${funConfig.pet} машет вслед вкладке «${String(t.title||'').slice(0,36)}»`);const note=$('#toast');note.classList.remove('byazen-farewell');void note.offsetWidth;note.classList.add('byazen-farewell');setTimeout(()=>note.classList.remove('byazen-farewell'),1200);}return result;};
const basePersistTabs=persistTabs;
persistTabs=function(){basePersistTabs();const normal=tabs.filter(t=>!t.private).slice(-20);store.set('tabCostumes',normal.map(t=>({url:t.url,title:t.title,costume:t.costume||''})));};
const savedCostumes=readArray('tabCostumes',20);tabs.filter(t=>!t.private).forEach(t=>{const m=savedCostumes.find(x=>x.url===t.url&&x.title===t.title);if(m)t.costume=m.costume||'';});renderTabs();
function toggleDailyThemeFromKey(){funConfig.dailyTheme=!funConfig.dailyTheme;saveFun();applyDailyTheme();toast(funConfig.dailyTheme?'Тема дня включена':'Тема дня выключена');}
let secretKeys='';document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(snow.classList.contains('show')){snow.classList.remove('show');$('#byazenGlobe').innerHTML='';if(nativeWebview)syncNativeBounds();return;}
    for(const id of ['byazenStudio','aiModelManagerModal','aiVoiceManagerModal'])if($(`#${id}`)?.classList.contains('show')){closeModal(id);return;}
  }
  if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(e.key.length===1){secretKeys=(secretKeys+e.key.toUpperCase()).slice(-7);if(secretKeys==='BYAZEN!'){ easter.classList.add('show');setTimeout(()=>easter.classList.remove('show'),3000);secretKeys='';}}
  if(!e.defaultPrevented&&e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='p'){e.preventDefault();openStudio();}
});
let lastBubble=0;document.addEventListener('pointermove',e=>{
  if(!funConfig.cursorBubbles||e.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const now=performance.now();if(now-lastBubble<90)return;lastBubble=now;
  const bubble=document.createElement('i');bubble.className='byazen-bubble';bubble.style.left=(e.clientX-4)+'px';bubble.style.top=(e.clientY-4)+'px';cursorLayer.append(bubble);setTimeout(()=>bubble.remove(),700);
});
setInterval(()=>{
  const due=bookmarks.filter(b=>b.remindAt&&!b.remindedAt&&Date.parse(b.remindAt)<=Date.now());
  if(!due.length)return;
  for(const item of due){item.remindedAt=Date.now();toast(`Напоминание: ${item.title||hostOf(item.url)}`);}
  store.set('bookmarks',bookmarks);
},30000);
function installBookmarkReminderField(){
  if($('#bookmarkRemindAt'))return;
  const host=$('#bookmarkNote').parentElement;const wrap=document.createElement('div');wrap.innerHTML='<label class="fl" for="bookmarkRemindAt">Напомнить в выбранное время</label><input class="field" id="bookmarkRemindAt" type="datetime-local"><p style="font-size:10px;color:var(--text-3);margin:5px 0 0">Причину напоминания можно написать в заметке выше.</p>';host.insertAdjacentElement('afterend',wrap);
}
installBookmarkReminderField();
$('#panelBody').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]');if(!edit)return;const row=edit.closest('.panel-item'),item=bookmarks.find(b=>b.url===row?.dataset.url);setTimeout(()=>{const input=$('#bookmarkRemindAt');if(input&&item?.remindAt){const date=new Date(item.remindAt);input.value=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}else if(input)input.value='';},0);});
$('#saveBookmarkDetails').addEventListener('click',()=>{const item=bookmarks.find(b=>b.url===editingBookmarkUrl);if(!item)return;const value=$('#bookmarkRemindAt')?.value||'';item.remindAt=value?new Date(value).toISOString():'';delete item.remindedAt;store.set('bookmarks',bookmarks);});
const baseRenderBookmarkPanel=renderPanel;
renderPanel=function(filter){baseRenderBookmarkPanel(filter);if(panelMode!=='bookmarks')return;$$('#panelBody .panel-item').forEach(row=>{const item=bookmarks[Number(row.dataset.index)],meta=row.querySelector('.dom');if(item?.remindAt&&meta)meta.textContent+=` · ⏰ ${new Date(item.remindAt).toLocaleString('ru-RU')}`;});};
if(typeof BACKUP_KEYS!=='undefined')for(const key of ['researchProjects','webFragments','funConfig','tabCostumes'])if(!BACKUP_KEYS.includes(key))BACKUP_KEYS.push(key);
const baseValidBackupValue=validBackupValue;
validBackupValue=function(key,value){
  if(key==='researchProjects')return Array.isArray(value)&&value.length<=50&&value.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=72&&Array.isArray(p.tabs)&&p.tabs.length<=50&&p.tabs.every(t=>t&&typeof t.url==='string'&&/^https?:\/\//i.test(t.url)));
  if(key==='webFragments')return Array.isArray(value)&&value.length<=200&&value.every(f=>f&&typeof f.id==='string'&&typeof f.text==='string'&&f.text.length<=3000&&typeof f.url==='string');
  if(key==='funConfig')return value&&typeof value==='object'&&!Array.isArray(value)&&['dailyTheme','cursorBubbles','tabFarewell'].every(k=>typeof value[k]==='boolean')&&typeof value.pet==='string'&&typeof value.costume==='string'&&['friendly','pirate','robot','comedian'].includes(value.persona);
  if(key==='tabCostumes')return Array.isArray(value)&&value.length<=20&&value.every(t=>t&&typeof t.url==='string'&&typeof t.costume==='string');
  return baseValidBackupValue(key,value);
};
async function collectOpenContexts(limit=5){
  if(store.get('aiPageActionsAllowed',true)===false)throw new Error('Сначала разрешите чтение контекста страницы в настройках ByAzen.');
  if(!nativeWebview)throw new Error('Сбор материалов с нескольких сайтов доступен в настольной версии.');
  const pages=tabs.filter(t=>!t.private&&!isInternal(t.url)&&/^https?:\/\//i.test(t.url)).slice(0,limit);
  if(!pages.length)throw new Error('Откройте обычные веб-страницы сначала.');
  const contexts=await Promise.all(pages.map(async t=>{const page=await window.byazenDesktop.getPageContext(t.id);return page&&!page.error?{title:page.title||t.title,url:page.url||t.url,text:String(page.text||'').slice(0,4500)}:null;}));
  return contexts.filter(Boolean);
}
async function askAiWithContexts(promptText,contexts){
  aiCompareContexts=contexts;openAssistant();await sendAiMessage(promptText);
}
async function makeInstructionFromPages(){
  try{const contexts=await collectOpenContexts(5);await askAiWithContexts('Составь практическую пошаговую инструкцию по материалам открытых страниц. Для каждого важного шага укажи заголовок и URL источника; отделяй проверенные сведения от предположений. Не выполняй действия в браузере, только подготовь план.',contexts);}
  catch(e){toast(e.message||'Не удалось собрать материалы');}
}
async function debateOpenPages(){
  try{const contexts=await collectOpenContexts(2);if(contexts.length<2)throw new Error('Для дуэли нужны две открытые страницы.');await askAiWithContexts('Устрой добродушный суд двух открытых страниц: кратко изложи аргументы каждой, укажи точные заголовки и URL, затем вынеси шуточный вердикт. Не выдумывай факты и разделяй юмор с выводами.',contexts);}
  catch(e){toast(e.message||'Не удалось сравнить страницы');}
}
async function awardPopup(){
  const tab=activeTab();if(!tab||isInternal(tab.url))return toast('Откройте страницу, достойную премии');
  openAssistant();await sendAiMessage('Вручи этой странице одну смешную, доброжелательную премию за её интерфейс или содержание. Объясни одной-двумя фразами, за что награда; не придумывай факты о владельцах сайта.');
}
async function summarizeAiChat(){
  const messages=aiHistory.filter(m=>['user','assistant'].includes(m.role)).slice(-30);
  if(messages.length<2)return toast('Сначала поговорите с ИИ — пока нечего конспектировать');
  const transcript=messages.map(m=>`${m.role==='user'?'Пользователь':'ИИ'}: ${m.content}`).join('\n').slice(-2200);
  openAssistant();await sendAiMessage(`Сделай краткую сводку диалога по транскрипту ниже: тема, что уже выяснили, важные решения и следующий шаг. Не добавляй фактов, которых не было.\n\nТРАНСКРИПТ:\n${transcript}`);
}
async function debateInstructions(){
  const contexts=await collectOpenContexts(5);await askAiWithContexts('Сравни материалы и составь последовательность действий с источниками. Отметь спорные места и чего не хватает.',contexts);
}
function addAiButton(label,handler){const button=document.createElement('button');button.className='byazen-ai-quick';button.textContent=label;button.onclick=handler;$('.ai-quick').append(button);}
addAiButton('Инструкция из вкладок',makeInstructionFromPages);
addAiButton('⚖️ Суд страниц',debateOpenPages);
addAiButton('🏆 Премия попапам',awardPopup);
addAiButton('Сводка диалога',summarizeAiChat);
addAiButton('Источники ответа',()=>sendAiMessage('Ответь по открытой странице с краткой цитатой-доказательством и названием/URL источника. Если подтвердить ответ по содержимому нельзя, прямо скажи об этом.'));
const oldAddAiMessage=addAiMessage;
addAiMessage=function(role,text){
  const el=oldAddAiMessage(role,text);
  if(role==='assistant'&&/^https?:\/\//i.test(String(text))||role==='assistant'&&String(text).includes('https://')){
    const safe=esc(text).replace(/(https?:\/\/[^\s<]+)/g,raw=>{const clean=raw.replace(/[),.;!?]+$/,'');const suffix=raw.slice(clean.length);return `<a class="byazen-source-link" href="${clean}" data-ai-url="${clean}">${clean}</a>${suffix}`;});
    el.innerHTML=safe;el.querySelectorAll('[data-ai-url]').forEach(a=>a.onclick=e=>{e.preventDefault();const url=a.dataset.aiUrl;if(/^https?:\/\//i.test(url))openContextUrl(url,!!activeTab()?.private);});
  }
  return el;
};
const aiModelBar=$('.ai-modelbar');
const modelManagerButton=document.createElement('button');modelManagerButton.className='btn';modelManagerButton.id='aiModelManager';modelManagerButton.textContent='Модели…';aiModelBar.insertBefore(modelManagerButton,aiModelBar.querySelector('.spacer'));
const personaLabel=document.createElement('label');personaLabel.textContent='Стиль ИИ';personaLabel.htmlFor='aiPersona';const personaSelect=document.createElement('select');personaSelect.className='field';personaSelect.id='aiPersona';personaSelect.innerHTML='<option value="friendly">Дружелюбный</option><option value="pirate">Пират 🏴‍☠️</option><option value="robot">Робот 🤖</option><option value="comedian">Шутник 🎭</option>';personaSelect.value=funConfig.persona;aiModelBar.insertBefore(personaLabel,aiModelBar.querySelector('.spacer'));aiModelBar.insertBefore(personaSelect,aiModelBar.querySelector('.spacer'));personaSelect.onchange=()=>{funConfig.persona=personaSelect.value;saveFun();};
const voiceButton=document.createElement('button');voiceButton.className='btn';voiceButton.id='aiVoiceLibraryBtn';voiceButton.textContent='Голоса…';$('#aiVoiceTest').insertAdjacentElement('afterend',voiceButton);
const manager=document.createElement('div');manager.className='modal-overlay';manager.id='aiModelManagerModal';manager.innerHTML='<section class="modal byazen-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Модели ИИ</h2><div class="ai-status">Загрузка выполняется через установленную Ollama</div></div><button class="icon-btn" data-manager-close>×</button></div><div class="modal-body" id="aiModelCatalog"><p>Загружаю список…</p></div></section>';document.body.append(manager);
const voiceManager=document.createElement('div');voiceManager.className='modal-overlay';voiceManager.id='aiVoiceManagerModal';voiceManager.innerHTML='<section class="modal byazen-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Библиотека голосов</h2><div class="ai-status">Системные голоса и онлайн-озвучивание</div></div><button class="icon-btn" data-voice-close>×</button></div><div class="modal-body"><div class="byazen-card"><h3>Голоса Windows</h3><p>Можно установить дополнительные речевые голоса через официальные настройки Windows, затем вернуться и обновить список. Установленные голоса Windows доступны из обычного списка «Голос».</p><div class="byazen-card-actions"><button class="btn primary" id="openWindowsVoiceSettings">Открыть настройки речи</button><button class="btn" id="openWindowsLanguageSettings">Добавить языковой пакет</button><button class="btn" id="refreshWindowsVoices">Обновить список голосов</button><button class="btn" id="testChosenVoice">Прослушать выбранный голос</button></div><p id="voiceLibraryStatus"></p></div><div class="byazen-card"><h3>Онлайн-нейроголоса</h3><p>Светлана, Дмитрий и Дарья не скачиваются на устройство: для синтеза нужен интернет, а текст передаётся Microsoft Edge TTS. Выбрать их можно в списке голосов.</p><div class="byazen-card-actions"><button class="btn" data-edge-voice="edge:ru-RU-SvetlanaNeural">Светлана</button><button class="btn" data-edge-voice="edge:ru-RU-DmitryNeural">Дмитрий</button><button class="btn" data-edge-voice="edge:ru-RU-DariyaNeural">Дарья</button></div></div><div class="byazen-card"><h3>Важно</h3><p>ByAzen не запускает загруженные голосовые файлы и не устанавливает неизвестные исполняемые компоненты. Для офлайн-озвучивания используются голосовые пакеты, установленные самой Windows.</p></div></div></section>';document.body.append(voiceManager);
const closeManager=manager.querySelector('[data-manager-close]');closeManager.onclick=()=>closeModal(manager.id);manager.addEventListener('mousedown',e=>{if(e.target===manager)closeModal(manager.id);});
voiceManager.querySelector('[data-voice-close]').onclick=()=>closeModal(voiceManager.id);voiceManager.addEventListener('mousedown',e=>{if(e.target===voiceManager)closeModal(voiceManager.id);});
let pullController=null;
async function renderModelCatalog(){
  const host=$('#aiModelCatalog');host.innerHTML='<p>Проверяю Ollama…</p>';
  try{
    const response=await fetch('/api/ollama/models'),data=await response.json(),installed=new Set((data.models||[]).map(m=>m.name));
    host.innerHTML=`<p>${data.available?'Установленные модели находятся на этом компьютере. Выберите более крупную модель для потенциально качественных ответов.':'Ollama недоступна: установите и запустите её, чтобы загружать локальные модели.'}</p>${(data.catalog||[]).map(m=>`<div class="byazen-card"><h3>${esc(m.label)} ${installed.has(m.name)?'· установлена':''}</h3><p>${esc(m.description)}<br>Загрузка: ${esc(m.size)} · память: ${esc(m.ram)} · профиль: ${esc(m.tier)}</p><div class="byazen-card-actions">${installed.has(m.name)?`<button class="btn primary" data-use-model="${esc(m.name)}">Использовать</button><button class="btn danger" data-delete-model="${esc(m.name)}">Удалить</button>`:`<button class="btn primary" data-pull-model="${esc(m.name)}" ${data.available?'':'disabled'}>Скачать модель</button>`}</div><div class="byazen-progress" data-progress="${esc(m.name)}" hidden><i></i></div><small data-progress-label="${esc(m.name)}"></small></div>`).join('')}`;
    host.querySelectorAll('[data-use-model]').forEach(b=>b.onclick=()=>{aiModel=b.dataset.useModel;$('#aiModel').value=aiModel;$('#aiModel').dispatchEvent(new Event('change'));closeModal(manager.id);toast(`Выбрана модель ${aiModel}`);});
    host.querySelectorAll('[data-delete-model]').forEach(b=>b.onclick=async()=>{if(!confirm(`Удалить локальную модель ${b.dataset.deleteModel}? Это освободит место на диске.`))return;const r=await fetch('/api/ollama/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:b.dataset.deleteModel})});const d=await r.json();toast(r.ok?'Модель удалена':d.error||'Не удалось удалить');renderModelCatalog();refreshAiModels();});
    host.querySelectorAll('[data-pull-model]').forEach(b=>b.onclick=()=>downloadModel(b.dataset.pullModel));
  }catch{host.innerHTML='<div class="byazen-card"><h3>Не удалось получить каталог</h3><p>Проверьте, что ByAzen и Ollama доступны локально.</p><button class="btn" id="retryModelCatalog">Повторить</button></div>';host.querySelector('#retryModelCatalog').onclick=renderModelCatalog;}
}
async function downloadModel(name){
  const progress=$(`[data-progress="${name}"]`),label=$(`[data-progress-label="${name}"]`),button=$(`[data-pull-model="${name}"]`);if(!progress||!button)return;
  pullController=new AbortController();button.disabled=true;button.textContent='Загрузка…';progress.hidden=false;label.textContent='Подключаюсь к Ollama…';
  try{
    const response=await fetch('/api/ollama/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name}),signal:pullController.signal});
    if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'Не удалось начать загрузку');}
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',latest='Загружаю…';
    while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();for(const line of lines){if(!line.trim())continue;try{const item=JSON.parse(line);latest=item.status||latest;if(item.total&&item.completed){const pct=Math.floor(item.completed/item.total*100);progress.querySelector('i').style.width=pct+'%';latest+=` · ${pct}%`;}label.textContent=latest;}catch{}}}
    label.textContent='Установка завершена';await renderModelCatalog();await refreshAiModels();aiModel=name;$('#aiModel').value=name;$('#aiModel').dispatchEvent(new Event('change'));toast(`Модель ${name} скачана и выбрана`);
  }catch(e){label.textContent=e.name==='AbortError'?'Загрузка остановлена':e.message||'Ошибка загрузки';button.disabled=false;button.textContent='Повторить загрузку';}
  finally{pullController=null;}
}
manager.querySelector('.modal-head').insertAdjacentHTML('beforeend','<button class="btn" id="cancelModelPull" hidden>Отменить загрузку</button>');
manager.querySelector('#cancelModelPull').onclick=()=>pullController?.abort();
// Toggle the cancel button while a stream is active.
const originalDownloadModel=downloadModel;
downloadModel=async function(name){const c=$('#cancelModelPull');c.hidden=false;try{return await originalDownloadModel(name);}finally{c.hidden=true;}};
modelManagerButton.onclick=()=>{openModal(manager.id);renderModelCatalog();};
voiceButton.onclick=()=>openModal(voiceManager.id);
voiceManager.querySelector('#refreshWindowsVoices').onclick=()=>{refreshAiVoices();$('#voiceLibraryStatus').textContent='Список системных голосов обновлён.';};
voiceManager.querySelector('#testChosenVoice').onclick=()=>speakAi('Здравствуйте! Проверяю выбранный голос ByAzen.');
voiceManager.querySelectorAll('[data-edge-voice]').forEach(b=>b.onclick=()=>{$('#aiVoice').value=b.dataset.edgeVoice;$('#aiVoice').dispatchEvent(new Event('change'));updateAiVoiceStatus();});
voiceManager.querySelector('#openWindowsVoiceSettings').onclick=async()=>{
  if(nativeWebview&&window.byazenDesktop.platform==='win32'&&window.byazenDesktop.openVoiceSettings){const result=await window.byazenDesktop.openVoiceSettings();$('#voiceLibraryStatus').textContent=result?.ok?'Открыл настройки Windows → Речь. Установите голос, вернитесь сюда и нажмите «Обновить список голосов».':'Не удалось открыть настройки Windows.';}
  else $('#voiceLibraryStatus').textContent='В Windows откройте Параметры → Время и язык → Речь → Голоса. Установите пакет речи, затем обновите список.';
};
voiceManager.querySelector('#openWindowsLanguageSettings').onclick=async()=>{
  if(nativeWebview&&window.byazenDesktop.platform==='win32'&&window.byazenDesktop.openLanguageSettings){const result=await window.byazenDesktop.openLanguageSettings();$('#voiceLibraryStatus').textContent=result?.ok?'В настройках Windows выберите язык → Параметры языка → скачайте компонент «Речь». Вернитесь в ByAzen и обновите список.':'Не удалось открыть настройки языка Windows.';}
  else $('#voiceLibraryStatus').textContent='В Windows откройте Параметры → Время и язык → Язык и регион, добавьте язык и установите компонент «Речь». Затем обновите список голосов.';
};
function renderStudioClick(e){
  const button=e.target.closest('[data-feature]');if(!button)return;
  const action=button.dataset.feature;
  if(action==='desk')toggleDesk();else if(action==='project-save')saveProjectSnapshot();else if(action==='projects')openStudio();else if(action==='fragments')openStudio();else if(action==='roulette')openRandomBookmark();else if(action==='studio')openStudio();
}
dock.addEventListener('click',renderStudioClick);
featureBtn.onclick=openStudio;
// Add opt-in bookmark reminder time to the existing bookmark editor and include feature data in backups.
function backupFeatureDefaults(){
  const extra={researchProjects:projects,webFragments:fragments,funConfig,tabCostumes:store.get('tabCostumes',[])};
  return extra;
}
const originalExportBackup=$('#exportBackup').onclick;
$('#exportBackup').onclick=function(){for(const [key,value]of Object.entries(backupFeatureDefaults()))store.set(key,value);return originalExportBackup?.call(this);};
const originalImportBackup=$('#importBackup').onclick;
if(originalImportBackup)$('#importBackup').onclick=originalImportBackup;
// Keyboard shortcut for the feature studio is handled here; the core handler remains untouched.
})();
