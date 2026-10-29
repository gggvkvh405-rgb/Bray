/* ByAzen feature studio: projects, saved web fragments, playful modes and AI tools. */
(()=>{
'use strict';
const esc=s=>escapeHtml(String(s??''));
const readArray=(key,max=300)=>{const value=store.get(key,[]);return Array.isArray(value)?value.filter(Boolean).slice(0,max):[];};
let projects=readArray('researchProjects',50),fragments=readArray('webFragments',200),hiddenDeskIds=new Set(),deskMode=false;
const PETS=[
  {id:'raccoon',name:'Рокки',mood:'Любит новые вкладки',copy:'Тихий хранитель ссылок'},
  {id:'dragon',name:'Финик',mood:'Охраняет идеи',copy:'Маленький дракон больших планов'},
  {id:'frog',name:'Квася',mood:'Прыгает к хорошим находкам',copy:'Главный эксперт по лягушачьему отдыху'},
  {id:'fox',name:'Рыжик',mood:'Ищет короткий путь',copy:'Проводник по вашим вкладкам'},
  {id:'octopus',name:'Осьминожка',mood:'Помнит все страницы',copy:'Восемь лапок — порядок в браузере'},
  {id:'dinosaur',name:'Топтыжка',mood:'Добрый и доисторический',copy:'Охраняет закладки от метеоритов'},
  {id:'owl',name:'Букля',mood:'Не спит над важной статьёй',copy:'Мудрый спутник ночных чтений'},
  {id:'panda',name:'Панда Пон',mood:'Мастер уютных пауз',copy:'Хрустит бамбуком между задачами'},
  {id:'penguin',name:'Пиксель',mood:'Скользит по ссылкам',copy:'Полярный исследователь интернета'},
  {id:'cat',name:'Плюша',mood:'Проверяет каждый уголок',copy:'Кошачий инспектор новых вкладок'},
  {id:'capybara',name:'Капи',mood:'Считает дедлайны поводом прилечь',copy:'Специалист по спокойному скроллу'},
  {id:'axolotl',name:'Луми',mood:'Улыбается даже полосе загрузки',copy:'Аксолотль, который всегда на позитиве'},
  {id:'alien',name:'Плюх',mood:'Ищет разумные вкладки',copy:'Пришелец с планеты «Ещё пять минут»'}
];
const LEGACY_PETS=new Map([
  [String.fromCodePoint(0x1f99d),'raccoon'],[String.fromCodePoint(0x1f409),'dragon'],
  [String.fromCodePoint(0x1f438),'frog'],[String.fromCodePoint(0x1f98a),'fox'],
  [String.fromCodePoint(0x1f419),'octopus'],[String.fromCodePoint(0x1f996),'dinosaur'],
  [String.fromCodePoint(0x1f989),'owl'],[String.fromCodePoint(0x1f43c),'panda'],
  [String.fromCodePoint(0x1f427),'penguin'],[String.fromCodePoint(0x1f408),'cat']
]);
const COSTUME_LABELS={cap:'Кепка',crown:'Корона',rocket:'Ракета',dinosaur:'Динозавр',wizard:'Волшебник',paw:'Лапка',spark:'Искра',moon:'Луна'};
const LEGACY_COSTUMES=new Map([
  [String.fromCodePoint(0x1f9e2),'cap'],[String.fromCodePoint(0x1f451),'crown'],
  [String.fromCodePoint(0x1f680),'rocket'],[String.fromCodePoint(0x1f996),'dinosaur'],
  [String.fromCodePoint(0x1f9d9),'wizard'],[String.fromCodePoint(0x1f43e),'paw'],
  [String.fromCodePoint(0x2728),'spark'],[String.fromCodePoint(0x1f319),'moon']
]);
const normalizeCostume=value=>{const id=LEGACY_COSTUMES.get(String(value||''))||String(value||'');return Object.hasOwn(COSTUME_LABELS,id)||PETS.some(p=>p.id===id)?id:'';};
const loadedFun=store.get('funConfig',{})||{};
let funConfig=Object.assign({dailyTheme:false,cursorBubbles:false,tabFarewell:false,petId:'raccoon',costume:'',persona:'friendly'},loadedFun);
if(!loadedFun.petId&&loadedFun.pet)funConfig.petId=LEGACY_PETS.get(loadedFun.pet)||'raccoon';
delete funConfig.pet;
funConfig.petId=PETS.some(item=>item.id===funConfig.petId)?funConfig.petId:'raccoon';
funConfig.costume=normalizeCostume(funConfig.costume);
const saveFun=()=>store.set('funConfig',funConfig);
if(loadedFun.pet||loadedFun.petId!==funConfig.petId)saveFun();
const currentPet=()=>PETS.find(item=>item.id===funConfig.petId)||PETS[0];
const iconSvg=(id,className='byazen-icon')=>`<svg class="${className}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const icon=(id,className='byazen-icon')=>iconSvg(id,className);
const PET_ART={
  raccoon:'<path fill="#64748b" d="M12 21 8 10 17 5l8 5 14 0 8-5 9 5-4 11v15a17 17 0 0 1-34 0z"/><path fill="#334155" d="M14 29q8-9 18 0-8 10-18 0Zm18 0q10-9 18 0-8 10-18 0Z"/><ellipse cx="23" cy="29" rx="2" ry="2.7" fill="#f8fafc"/><ellipse cx="41" cy="29" rx="2" ry="2.7" fill="#f8fafc"/><path fill="#e2e8f0" d="M26 37q6-6 12 0l-6 7z"/><path fill="none" stroke="#1e293b" stroke-width="3" d="M23 44q9 8 18 0"/>',
  dragon:'<path fill="#7c3aed" d="m17 18-6-12 14 6 7-5 7 5 14-6-6 14 3 9-3 13a16 16 0 0 1-32 0l-3-13z"/><path fill="#a78bfa" d="m14 39-8 9 12-2m32-7 8 9-12-2"/><circle cx="24" cy="31" r="3" fill="#fff"/><circle cx="40" cy="31" r="3" fill="#fff"/><circle cx="24" cy="31" r="1.4" fill="#312e81"/><circle cx="40" cy="31" r="1.4" fill="#312e81"/><path fill="#c4b5fd" d="M27 39q5-4 10 0l-5 5z"/><path fill="none" stroke="#4c1d95" stroke-width="2.5" d="M28 47q4 3 8 0"/>',
  frog:'<path fill="#22c55e" d="M8 24a12 12 0 0 1 22-7 12 12 0 0 1 4 0 12 12 0 0 1 22 7v15a24 20 0 0 1-48 0z"/><ellipse cx="20" cy="22" rx="7" ry="8" fill="#4ade80"/><ellipse cx="44" cy="22" rx="7" ry="8" fill="#4ade80"/><circle cx="20" cy="22" r="2.5" fill="#14532d"/><circle cx="44" cy="22" r="2.5" fill="#14532d"/><ellipse cx="32" cy="37" rx="8" ry="5" fill="#bbf7d0"/><path fill="none" stroke="#166534" stroke-width="2.5" d="M24 42q8 8 16 0"/>',
  fox:'<path fill="#f97316" d="m8 8 17 7 7-3 7 3 17-7-3 21v12a21 19 0 0 1-42 0V29z"/><path fill="#fed7aa" d="M13 34q8-8 17 2 9-10 21-2v8q-8 16-21 4Q17 58 13 42z"/><circle cx="23" cy="31" r="2.4" fill="#431407"/><circle cx="42" cy="31" r="2.4" fill="#431407"/><path fill="#7c2d12" d="m27 39 5-3 5 3-5 4z"/><path fill="none" stroke="#7c2d12" stroke-width="2" d="M28 45q4 3 8 0"/>',
  octopus:'<path fill="#a855f7" d="M10 40q-7 9-3 15 4 4 11-2l4-5 3 9q3 6 8 2l1-9 6 8q5 4 8-2l-2-11 8 4q6 2 7-4l-5-10a20 18 0 1 0-46 5z"/><ellipse cx="32" cy="29" rx="19" ry="18" fill="#c084fc"/><circle cx="24" cy="29" r="3" fill="#fff"/><circle cx="40" cy="29" r="3" fill="#fff"/><circle cx="24" cy="29" r="1.4" fill="#581c87"/><circle cx="40" cy="29" r="1.4" fill="#581c87"/><path fill="none" stroke="#6b21a8" stroke-width="2" d="M28 38q4 3 8 0"/>',
  dinosaur:'<path fill="#16a34a" d="m12 22 7-7 6 6 6-9 6 9 6-6 7 8 5 11-4 10a19 17 0 0 1-38 0l-4-10z"/><path fill="#86efac" d="M18 39q10-6 28 0l-4 12H23z"/><circle cx="24" cy="32" r="2.6" fill="#fff"/><circle cx="42" cy="32" r="2.6" fill="#fff"/><circle cx="24" cy="32" r="1.2" fill="#14532d"/><circle cx="42" cy="32" r="1.2" fill="#14532d"/><path fill="none" stroke="#166534" stroke-width="2" d="M28 44q4 3 8 0"/>',
  owl:'<path fill="#92400e" d="m10 22 4-15 11 9 7-3 7 3 11-9 4 15v21a22 20 0 0 1-44 0z"/><ellipse cx="23" cy="31" rx="10" ry="11" fill="#fde68a"/><ellipse cx="41" cy="31" rx="10" ry="11" fill="#fde68a"/><circle cx="23" cy="31" r="4" fill="#fff"/><circle cx="41" cy="31" r="4" fill="#fff"/><circle cx="23" cy="31" r="2" fill="#451a03"/><circle cx="41" cy="31" r="2" fill="#451a03"/><path fill="#f59e0b" d="m28 39 4-5 4 5-4 5z"/><path fill="#b45309" d="M19 48q13-11 26 0v5H19z"/>',
  panda:'<circle cx="17" cy="18" r="9" fill="#18181b"/><circle cx="47" cy="18" r="9" fill="#18181b"/><circle cx="32" cy="35" r="24" fill="#f4f4f5"/><ellipse cx="22" cy="31" rx="7" ry="9" transform="rotate(25 22 31)" fill="#27272a"/><ellipse cx="42" cy="31" rx="7" ry="9" transform="rotate(-25 42 31)" fill="#27272a"/><circle cx="23" cy="31" r="2" fill="#fff"/><circle cx="41" cy="31" r="2" fill="#fff"/><ellipse cx="32" cy="40" rx="4" ry="3" fill="#27272a"/><path fill="none" stroke="#27272a" stroke-width="2" d="M28 45q4 4 8 0"/>',
  penguin:'<ellipse cx="32" cy="36" rx="22" ry="26" fill="#1e293b"/><ellipse cx="32" cy="42" rx="15" ry="17" fill="#f8fafc"/><circle cx="25" cy="29" r="3" fill="#fff"/><circle cx="39" cy="29" r="3" fill="#fff"/><circle cx="25" cy="29" r="1.4" fill="#0f172a"/><circle cx="39" cy="29" r="1.4" fill="#0f172a"/><path fill="#f59e0b" d="m27 35 5-3 5 3-5 4z"/><path fill="#fb923c" d="M20 57q6-5 12 0-5 4-12 0m12 0q6-5 12 0-6 4-12 0"/>',
  cat:'<path fill="#fda4af" d="M10 28 13 8l15 11h8L51 8l3 20v15a22 19 0 0 1-44 0z"/><path fill="#fb7185" d="m17 26 2-11 9 7m19 4-2-11-9 7"/><ellipse cx="23" cy="33" rx="2.7" ry="3.5" fill="#0f172a"/><ellipse cx="41" cy="33" rx="2.7" ry="3.5" fill="#0f172a"/><path fill="#be123c" d="m28 41 4-3 4 3-4 3z"/><path fill="none" stroke="#9f1239" stroke-width="2" d="M28 46q4 3 8 0M20 42l-8-2m8 5-8 2m32-5 8-2m-8 5 8 2"/>',
  capybara:'<ellipse cx="32" cy="39" rx="23" ry="18" fill="#a16207"/><ellipse cx="18" cy="25" rx="7" ry="9" fill="#854d0e"/><ellipse cx="46" cy="25" rx="7" ry="9" fill="#854d0e"/><ellipse cx="32" cy="34" rx="19" ry="16" fill="#d6a35f"/><ellipse cx="24" cy="31" rx="2.4" ry="3" fill="#292524"/><ellipse cx="40" cy="31" rx="2.4" ry="3" fill="#292524"/><ellipse cx="32" cy="41" rx="8" ry="5" fill="#f2d2a2"/><ellipse cx="32" cy="39" rx="3.2" ry="2.2" fill="#292524"/><path fill="none" stroke="#78350f" stroke-width="2" d="M28 46q4 3 8 0"/><path fill="#fbbf24" d="M48 51h11v8H48z"/><path fill="#fef3c7" d="M50 47h8v5h-8z"/>',
  axolotl:'<path fill="#fb7185" d="M14 28 4 17l4-7 11 13m31 5 10-11-4-7-11 13"/><path fill="#fda4af" d="M12 30q0-18 20-18t20 18v13a20 17 0 0 1-40 0z"/><path fill="#fbcfe8" d="M17 26 9 18l5-2 8 9m25 1 8-8-5-2-8 9"/><circle cx="24" cy="32" r="3" fill="#1f2937"/><circle cx="40" cy="32" r="3" fill="#1f2937"/><path fill="#be123c" d="m28 39 4-2 4 2-4 3z"/><path fill="none" stroke="#9f1239" stroke-width="2" d="M27 45q5 4 10 0"/><circle cx="18" cy="38" r="3" fill="#fb7185"/><circle cx="46" cy="38" r="3" fill="#fb7185"/>',
  alien:'<path fill="#84cc16" d="M12 21 3 14l2 16 9 2m38-11 9-7-2 16-9 2"/><ellipse cx="32" cy="35" rx="22" ry="24" fill="#a3e635"/><path fill="#65a30d" d="M29 13q-2-9 5-9 6 0 3 7l-2 5"/><circle cx="24" cy="34" r="7" fill="#1e1b4b"/><circle cx="40" cy="34" r="7" fill="#1e1b4b"/><circle cx="22" cy="32" r="2" fill="#fff"/><circle cx="38" cy="32" r="2" fill="#fff"/><path fill="none" stroke="#3f6212" stroke-width="2.5" d="M27 47q5-5 10 0"/><circle cx="32" cy="8" r="2" fill="#f0abfc"/>'
};
const PET_BANTER={
  raccoon:['Я не мусорщик. Я архивирую вкусные ссылки.','Открыл ещё вкладку? Я ничего не видел.'],dragon:['Осторожно: я грею только идеи, не ноутбук.','Мой план захвата мира начинается с закладки.'],frog:['Прыг-прыг. До дедлайна тоже можно допрыгать.','Я проверил лужу. Там ещё один хороший сайт.'],fox:['Я не потерялся. Это вкладки опять разбежались.','Хитрый план: сначала чай, потом ещё один поиск.'],octopus:['Восемь лапок — и всё равно не могу закрыть лишние вкладки.','Я держу восемь дел. Девятое придержишь ты?'],dinosaur:['Я пережил метеорит. Переживу и этот список дел.','Маленькие шаги. Большие тапки.'],owl:['Ночной режим? Я и так не собиралась спать.','Мудрость приходит после второй чашки чая.'],panda:['Пауза на бамбук внесена в календарь.','Я не ленюсь. Я загружаю спокойствие.'],penguin:['Скольжу к ответу. Иногда боком.','На этом сайте прохладно. Надень вкладку.'],cat:['Я не сломала страницу. Я проверила её лапой.','Если я села на клавиатуру — это исследование.'],capybara:['Вкладок много. Паники — ноль.','Я пришла полежать на вашем списке дел.'],axolotl:['Улыбка загружена. Остальное подождёт.','Я не зависла, я красиво плыву.'],alien:['На моей планете это называется «ещё одну вкладку».','Пришёл с миром. И с очень странной историей поиска.']
};
function petArt(id,className='pet-illustration'){return `<svg class="${className}" viewBox="0 0 64 64" aria-hidden="true">${PET_ART[id]||PET_ART.raccoon}</svg>`;}

const style=document.createElement('style');
style.textContent=`
#byazenFeatureBtn{font-size:9.5px}.byazen-icon{width:15px;height:15px;display:inline-block;flex:none;vertical-align:middle}.byazen-globe-pet svg{width:100%;height:100%}.byazen-ai-quick{display:inline-flex;align-items:center;gap:7px}.byazen-ai-quick svg{width:14px;height:14px}
#byazenFeatureDock{max-width:700px;width:100%;margin:24px auto 0;padding:15px;border:1px solid rgba(167,139,250,.18);border-radius:18px;background:linear-gradient(135deg,rgba(139,92,246,.07),rgba(255,255,255,.018) 54%,rgba(56,189,248,.045));box-shadow:0 12px 34px rgba(0,0,0,.15);backdrop-filter:blur(12px)}
.byazen-dock-title{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-3);margin:0 0 11px 3px}.byazen-dock-title svg{width:13px;height:13px;color:#c4b5fd}
.byazen-dock-actions{display:flex;flex-wrap:wrap;gap:8px}
.byazen-dock-actions .btn{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08)}.byazen-dock-actions .btn svg{width:14px;height:14px;color:#c4b5fd}
.byazen-modal{max-width:780px;max-height:84vh;display:flex;flex-direction:column}
.byazen-modal .modal-body{overflow:auto;gap:14px}
.byazen-card{position:relative;overflow:hidden;padding:16px;border:1px solid rgba(255,255,255,.085);background:linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.018));border-radius:16px;margin:0;box-shadow:0 10px 28px rgba(0,0,0,.12)}
.byazen-card h3{font-size:14px;margin:0 0 5px;color:var(--text)}
.byazen-card p{font-size:11.5px;line-height:1.55;color:var(--text-3);margin:5px 0 11px}
.byazen-card-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.byazen-card-actions .btn{font-size:10.5px;border-radius:10px}
.byazen-list{display:grid;gap:8px;margin-top:10px}
.byazen-item{display:flex;align-items:center;gap:9px;padding:10px 11px;border:1px solid rgba(255,255,255,.075);border-radius:11px;background:rgba(255,255,255,.025)}
.byazen-item .byazen-item-main{flex:1;min-width:0}.byazen-item b{font-size:11.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.byazen-item small{display:block;color:var(--text-3);font-size:10px;overflow-wrap:anywhere}
.byazen-item .btn{font-size:10px;padding:6px 8px;flex:none}
.byazen-progress{height:6px;border-radius:5px;background:#26262c;overflow:hidden;margin:8px 0}.byazen-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a78bfa,#67e8f9);transition:width .3s}
.byazen-pet{width:min(430px,calc(100% - 20px));min-height:82px;display:grid;grid-template-columns:62px minmax(0,1fr) 34px;align-items:center;gap:13px;margin:18px auto 0;padding:10px 14px;border:1px solid rgba(196,181,253,.2);border-radius:22px;background:linear-gradient(120deg,rgba(109,40,217,.16),rgba(255,255,255,.035) 55%,rgba(56,189,248,.09));box-shadow:0 15px 40px rgba(0,0,0,.2),inset 0 1px rgba(255,255,255,.06);color:var(--text);text-align:left;backdrop-filter:blur(12px)}
.byazen-pet-orb{position:relative;width:62px;height:62px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);border-radius:20px;background:radial-gradient(circle at 34% 24%,#fff6,transparent 34%),linear-gradient(145deg,rgba(167,139,250,.32),rgba(34,211,238,.16));box-shadow:inset 0 1px 8px #ffffff12,0 6px 16px #0004;cursor:pointer;overflow:hidden}
.byazen-pet-orb::after{content:'';position:absolute;width:90px;height:90px;border:1px solid rgba(255,255,255,.12);border-radius:50%;transform:translate(22px,20px);pointer-events:none}
.byazen-pet .face{position:relative;z-index:1;width:46px;height:46px;display:block;filter:drop-shadow(0 4px 5px #0007);animation:byazenPetIdle 2.8s ease-in-out infinite}.byazen-pet-orb.pet-bounce .face{animation:byazenPetHappy .65s cubic-bezier(.2,.8,.2,1)}.byazen-pet-illustration{width:100%;height:100%;overflow:visible}
.byazen-pet .pet-spark{position:absolute;z-index:2;right:8px;top:7px;width:12px;height:12px;color:#fef3c7;animation:byazenSpark 2.2s ease-in-out infinite}
.byazen-pet-info{min-width:0;display:grid;gap:3px}
.byazen-pet-label{font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:#c4b5fd;font-weight:650}
.byazen-pet-name{font-size:14px;font-weight:650;letter-spacing:-.02em}
.byazen-pet .pet-copy{font-size:10px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.byazen-pet-mood{justify-self:start;margin-top:2px;padding:3px 7px;border:1px solid rgba(196,181,253,.12);border-radius:999px;background:rgba(167,139,250,.08);color:#d7caff;font-size:9px}
.byazen-pet-change{width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.04);color:var(--text-2);cursor:pointer;transition:transform .2s,background .2s}.byazen-pet-change svg{width:15px;height:15px}
.byazen-pet-change:hover{transform:rotate(35deg);background:rgba(255,255,255,.1)}
.byazen-pet-heart{position:absolute;z-index:5;left:50%;top:18%;width:16px;height:16px;color:#f0abfc;pointer-events:none;animation:byazenPetHeart .9s ease-out forwards}.byazen-pet-heart svg{width:100%;height:100%}
@keyframes byazenPetIdle{0%,100%{transform:translateY(1px) rotate(-2deg)}50%{transform:translateY(-4px) rotate(2deg)}}
@keyframes byazenPetHappy{0%{transform:scale(1) rotate(0)}30%{transform:scale(1.22) rotate(-10deg)}65%{transform:scale(.9) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
@keyframes byazenSpark{0%,100%{opacity:.45;transform:scale(.8) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(35deg)}}
@keyframes byazenPetHeart{to{transform:translate(10px,-35px) scale(1.35);opacity:0}}
.byazen-tab-costume{width:20px;height:20px;display:inline-grid;place-items:center;flex:none;margin-right:6px;border:1px solid rgba(196,181,253,.22);border-radius:7px;background:linear-gradient(145deg,rgba(167,139,250,.19),rgba(255,255,255,.05));box-shadow:inset 0 1px rgba(255,255,255,.08);vertical-align:middle}.byazen-tab-costume svg{width:14px;height:14px}.pin-btn{position:relative}.pin-btn .byazen-tab-costume{position:absolute;right:-4px;bottom:-5px;width:17px;height:17px;margin:0;border-radius:6px;background:#17171b}.pin-btn .byazen-tab-costume svg{width:12px;height:12px}
.byazen-desk-hidden{display:none!important}
.byazen-source-link{color:#a5b4fc;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.byazen-fun-panel{padding:17px;background:linear-gradient(145deg,rgba(109,40,217,.1),rgba(255,255,255,.025) 50%,rgba(34,211,238,.045))}
.byazen-fun-heading{display:flex;align-items:flex-start;gap:11px;margin-bottom:15px}
.byazen-fun-heading-icon{width:38px;height:38px;display:grid;place-items:center;flex:none;border:1px solid rgba(196,181,253,.18);border-radius:13px;background:linear-gradient(145deg,rgba(167,139,250,.2),rgba(34,211,238,.1));color:#d8b4fe}.byazen-fun-heading-icon svg{width:19px;height:19px}
.byazen-fun-heading h3{margin:1px 0 3px;font-size:14px}.byazen-fun-heading p{margin:0;max-width:560px}
.byazen-fun-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.byazen-fun-toggle{min-width:0;display:grid;grid-template-columns:34px minmax(0,1fr) 40px;align-items:center;gap:9px;padding:11px;border:1px solid rgba(255,255,255,.075);border-radius:13px;background:rgba(6,7,14,.28);cursor:pointer;transition:border-color .18s,background .18s,transform .18s}
.byazen-fun-toggle:hover{transform:translateY(-1px);border-color:rgba(196,181,253,.2);background:rgba(255,255,255,.04)}
.byazen-fun-toggle-icon{width:32px;height:32px;display:grid;place-items:center;overflow:hidden;border-radius:10px;background:rgba(167,139,250,.12);color:#c4b5fd}.byazen-fun-toggle-icon svg{width:17px;height:17px}.byazen-fun-toggle-icon .pet-mini{width:30px;height:30px}
.byazen-fun-toggle b{display:block;font-size:11px;font-weight:600}.byazen-fun-toggle small{display:block;margin-top:3px;color:var(--text-3);font-size:9.5px;line-height:1.4}
.byazen-fun-toggle input{appearance:none;width:34px;height:20px;margin:0;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:#292933;cursor:pointer;transition:background .18s,border-color .18s;position:relative}
.byazen-fun-toggle input::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#e4e4e7;transition:transform .18s}
.byazen-fun-toggle input:checked{background:linear-gradient(90deg,#8b5cf6,#22d3ee);border-color:transparent}.byazen-fun-toggle input:checked::after{transform:translateX(14px);background:#fff}
.byazen-fun-subhead{display:flex;align-items:center;gap:8px;margin:18px 0 8px;color:var(--text-2);font-size:11px;font-weight:650}
.byazen-fun-subhead::before{content:'';width:3px;height:14px;border-radius:3px;background:linear-gradient(#a78bfa,#22d3ee)}
.byazen-fun-select-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.byazen-fun-select{min-width:0;padding:10px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(6,7,14,.22)}
.byazen-fun-select label{display:block;margin:0 0 7px;color:var(--text-2);font-size:10px;font-weight:600}
.byazen-fun-select .field{height:35px;font-size:11px}
.byazen-fun-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}
.byazen-fun-action{min-height:58px;display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:12px;text-align:left;background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.08)}
.byazen-fun-action:hover{border-color:rgba(196,181,253,.2);transform:translateY(-1px)}
.byazen-fun-action .action-icon{width:30px;height:30px;display:grid;place-items:center;flex:none;border-radius:9px;background:rgba(167,139,250,.1);color:#c4b5fd}.byazen-fun-action .action-icon svg{width:16px;height:16px}
.byazen-fun-action b{display:block;font-size:10px}.byazen-fun-action small{display:block;margin-top:2px;color:var(--text-3);font-size:8.5px;line-height:1.25}
#byazenSnow{position:fixed;inset:0;z-index:320;background:radial-gradient(ellipse at 50% 40%,rgba(59,130,246,.16),transparent 56%),rgba(5,8,18,.82);display:none;place-items:center;padding:18px;backdrop-filter:blur(14px)}#byazenSnow.show{display:grid}
.byazen-snow-card{position:relative;display:grid;justify-items:center;gap:14px;padding:28px 28px 20px;border:1px solid rgba(226,232,240,.13);border-radius:28px;background:linear-gradient(150deg,rgba(30,41,59,.8),rgba(15,23,42,.72));box-shadow:0 30px 100px #0009,inset 0 1px rgba(255,255,255,.06);animation:byazenSnowIn .35s cubic-bezier(.2,.8,.2,1)}
@keyframes byazenSnowIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
.byazen-snow-close{position:absolute;right:12px;top:12px;width:30px;height:30px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.04);color:#e2e8f0;font-size:18px;cursor:pointer}
.byazen-globe{width:min(340px,74vw);aspect-ratio:1;border:5px solid rgba(226,232,240,.75);border-radius:50%;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.5),transparent 19%),radial-gradient(circle at 50% 85%,#1e3a5f 0,transparent 53%),linear-gradient(155deg,#7dd3fc 0%,#344e8b 45%,#171b42 100%);box-shadow:0 18px 50px #0008,inset 0 0 28px rgba(224,242,254,.32),inset -16px -22px 40px rgba(8,15,40,.55);position:relative;overflow:hidden;cursor:grab;touch-action:none}
.byazen-globe::before{content:'';position:absolute;z-index:4;inset:3% 5% 43%;border-radius:50% 50% 40% 35%;background:linear-gradient(135deg,rgba(255,255,255,.28),rgba(255,255,255,.07) 42%,transparent 70%);pointer-events:none}
.byazen-globe-scene{position:absolute;inset:0;overflow:hidden}
.byazen-globe-moon{position:absolute;right:23%;top:18%;width:26px;height:26px;border-radius:50%;background:#fff7d6;box-shadow:0 0 22px #fef3c7b3}
.byazen-globe-star{position:absolute;width:13px;height:13px;color:#fff7d6;filter:drop-shadow(0 0 5px #fff8);animation:byazenSpark 2s ease-in-out infinite}.byazen-globe-star svg{width:100%;height:100%}
.byazen-globe-hill{position:absolute;left:-12%;right:-12%;bottom:10%;height:39%;border-radius:48% 52% 0 0;background:linear-gradient(150deg,#dbeafe 0%,#bfdbfe 38%,#7c9ccc 100%);box-shadow:inset 0 9px 15px #fff9}
.byazen-globe-pet{position:absolute;z-index:2;left:50%;bottom:20%;width:65px;height:65px;transform:translateX(-50%);filter:drop-shadow(0 8px 5px #10204499);animation:byazenPetIdle 2.6s ease-in-out infinite}
.byazen-globe-tree{position:absolute;z-index:2;bottom:18%;width:32px;height:45px;filter:drop-shadow(0 4px 4px #13244266)}.byazen-globe-tree::before{content:'';position:absolute;inset:0 0 9px;background:linear-gradient(145deg,#4ade80,#166534);clip-path:polygon(50% 0,100% 42%,76% 42%,100% 76%,66% 76%,82% 100%,18% 100%,34% 76%,0 76%,24% 42%,0 42%)}.byazen-globe-tree::after{content:'';position:absolute;left:14px;bottom:0;width:5px;height:11px;background:#78350f}
.byazen-globe-caption{display:flex;align-items:center;gap:7px;margin:0;color:#cbd5e1;font-size:11px;text-align:center}.byazen-globe-caption svg{width:14px;height:14px;color:#bfdbfe}
.byazen-globe.shake{animation:byazenShake .55s ease-in-out}.byazen-flake{position:absolute;z-index:3;top:-12px;width:11px;height:11px;color:#fff;filter:drop-shadow(0 0 5px #fff);animation:byazenFall 3s linear infinite;pointer-events:none}.byazen-flake svg{width:100%;height:100%}
@keyframes byazenFall{to{transform:translateY(360px) rotate(240deg);opacity:.3}}@keyframes byazenShake{25%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}75%{transform:rotate(-3deg)}}
#byazenCursorLayer{position:fixed;inset:0;pointer-events:none;z-index:500;overflow:hidden}.byazen-bubble{position:absolute;width:10px;height:10px;border:1px solid rgba(196,181,253,.9);border-radius:50%;background:radial-gradient(circle at 30% 25%,#fff9,rgba(167,139,250,.2) 45%,transparent 70%);box-shadow:0 0 10px rgba(167,139,250,.3);animation:byazenPop .75s ease-out forwards}@keyframes byazenPop{to{transform:translateY(-26px) scale(2.3);opacity:0}}
#byazenEaster{position:fixed;inset:0;z-index:499;pointer-events:none;display:none;background:radial-gradient(circle at 50% 50%,#5b21b655,transparent 55%)}#byazenEaster.show{display:block;animation:byazenEaster .7s alternate 4}@keyframes byazenEaster{to{filter:hue-rotate(170deg);opacity:.2}}
#toast.byazen-farewell{animation:byazenFarewell 1.1s ease-out}@keyframes byazenFarewell{0%{transform:translate(-50%,12px) scale(.8);opacity:0}20%{transform:translate(-50%,0) scale(1.03);opacity:1}100%{transform:translate(-40%,-35px) scale(.86);opacity:0}}
#byazenGame{min-height:140px;border-radius:12px;background:linear-gradient(140deg,#151d2b,#24173b);position:relative;overflow:hidden;margin:10px 0;padding:10px;color:#ddd}
#byazenGameTarget{position:absolute;left:46%;top:48%;width:34px;height:34px;display:grid;place-items:center;border:0;background:none;color:#fbbf24;cursor:pointer;transition:left .18s,top .18s}#byazenGameTarget svg{width:28px;height:28px}
.ai-quick .byazen-ai-quick{border-color:#6d5ce7;color:#d6ccff}
@media(max-width:560px){
  #byazenFeatureDock{padding:12px;border-radius:15px}.byazen-dock-actions{gap:6px}.byazen-dock-actions .btn{padding:7px 9px;font-size:10px}
  .byazen-pet{grid-template-columns:54px minmax(0,1fr) 32px;gap:10px;min-height:72px;padding:8px 10px;border-radius:19px}.byazen-pet-orb{width:54px;height:54px;border-radius:17px}.byazen-pet .face{width:40px;height:40px}.byazen-pet-label{font-size:8px}.byazen-pet-name{font-size:13px}.byazen-pet-mood{font-size:8px}
  .byazen-modal{max-height:90vh}.byazen-modal .modal-body{padding:12px;gap:10px}.byazen-fun-panel{padding:13px}.byazen-fun-grid,.byazen-fun-select-grid{grid-template-columns:1fr}.byazen-fun-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.byazen-fun-action{min-height:54px;padding:8px}.byazen-fun-action small{font-size:8px}
  .byazen-snow-card{padding:40px 16px 16px;border-radius:22px}.byazen-globe{width:min(300px,74vw)}.byazen-snow-close{right:9px;top:8px}
}
@media(max-width:360px){.byazen-fun-actions{grid-template-columns:1fr}.byazen-fun-toggle{grid-template-columns:31px minmax(0,1fr) 36px;padding:9px}.byazen-item{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.byazen-flake,.byazen-pet .face,.byazen-pet .pet-spark,.byazen-globe-star,.byazen-snow-card,#byazenEaster.show,.byazen-pet-heart{animation:none!important;transition:none!important}}
`;
document.head.appendChild(style);
const dock=document.createElement('section');dock.id='byazenFeatureDock';dock.innerHTML=`<div class="byazen-dock-title">${icon('spark')}Рабочий стол ByAzen</div><div class="byazen-dock-actions"><button class="btn" data-feature="desk">${icon('compass')}<span>Фокус-вкладки</span></button><button class="btn" data-feature="project-save">${icon('pin')}<span>Снимок проекта</span></button><button class="btn" data-feature="projects">${icon('folder')}<span>Проекты</span></button><button class="btn" data-feature="fragments">${icon('scissors')}<span>Фрагменты</span></button><button class="btn" data-feature="roulette">${icon('dice')}<span>Рулетка</span></button><button class="btn" data-feature="studio">${icon('spark')}<span>Игровая</span></button></div></section>`;
$('#shortcuts').insertAdjacentElement('afterend',dock);
const pet=document.createElement('section');pet.className='byazen-pet';pet.id='byazenPet';
pet.innerHTML=`<button class="byazen-pet-orb" type="button" aria-label="Погладить питомца" title="Погладить питомца"><span class="face">${petArt(currentPet().id)}</span><svg class="pet-spark" aria-hidden="true"><use href="#i-spark"/></svg></button><span class="byazen-pet-info"><span class="byazen-pet-label">Ваш спутник ByAzen</span><strong class="byazen-pet-name">${esc(currentPet().name)}</strong><span class="pet-copy"></span><span class="byazen-pet-mood">${esc(currentPet().mood)}</span></span><button class="byazen-pet-change" type="button" aria-label="Сменить питомца" title="Выбрать другого питомца">${icon('rotate')}</button>`;
$('#greeting').insertAdjacentElement('afterend',pet);
function updatePetCard(copy){
  const buddy=currentPet(),count=tabs.length,lastTwo=count%100,last=count%10;
  const tabWord=lastTwo>=11&&lastTwo<=14?'вкладок':last===1?'вкладка':last>=2&&last<=4?'вкладки':'вкладок';
  pet.querySelector('.face').innerHTML=petArt(buddy.id);pet.querySelector('.byazen-pet-name').textContent=buddy.name;pet.querySelector('.byazen-pet-mood').textContent=buddy.mood;
  pet.querySelector('.pet-copy').textContent=copy||`${buddy.copy} · ${count} ${tabWord}`;
}
function cyclePet(){const index=PETS.findIndex(item=>item.id===funConfig.petId);funConfig.petId=PETS[(index+1+PETS.length)%PETS.length].id;saveFun();updatePetCard();toast(`Теперь с вами ${currentPet().name}`);}
updatePetCard();
pet.querySelector('.byazen-pet-change').onclick=cyclePet;
pet.querySelector('.byazen-pet-orb').onclick=()=>{
  const orb=pet.querySelector('.byazen-pet-orb'),heart=document.createElement('span');orb.classList.remove('pet-bounce');void orb.offsetWidth;orb.classList.add('pet-bounce');heart.className='byazen-pet-heart';heart.innerHTML=icon('heart');orb.append(heart);setTimeout(()=>{heart.remove();orb.classList.remove('pet-bounce');},950);
  const lines=PET_BANTER[currentPet().id]||['Я тут. Вкладки под присмотром.'],quip=lines[Math.floor(Math.random()*lines.length)];
  updatePetCard(`«${quip}»`);setTimeout(()=>updatePetCard(),2800);
};
const featureBtn=document.createElement('button');featureBtn.className='quick-btn hide-collapsed';featureBtn.id='byazenFeatureBtn';featureBtn.title='Рабочий стол, проекты и игровая мастерская';featureBtn.innerHTML='<svg><use href="#i-spark"/></svg><span class="hide-collapsed">Мастерская</span>';
$('#assistantBtn').insertAdjacentElement('afterend',featureBtn);
const modal=document.createElement('div');modal.className='modal-overlay';modal.id='byazenStudio';modal.innerHTML=`<section class="modal byazen-modal" role="dialog" aria-modal="true" aria-labelledby="byazenStudioTitle"><div class="modal-head"><div><h2 id="byazenStudioTitle">Игровая мастерская</h2><div class="ai-status">Украшения вкладок, уютные эффекты и мини-игры</div></div><button class="icon-btn" data-feature-close title="Закрыть">×</button></div><div class="modal-body" id="byazenStudioBody"></div></section>`;
document.body.append(modal);
const snow=document.createElement('div');snow.id='byazenSnow';snow.innerHTML=`<section class="byazen-snow-card" role="dialog" aria-modal="true" aria-label="Снежный шар"><button class="byazen-snow-close" type="button" aria-label="Закрыть снежный шар"><svg><use href="#i-x"/></svg></button><div class="byazen-globe" id="byazenGlobe" role="button" tabindex="0" aria-label="Встряхнуть снежный шар"></div><p class="byazen-globe-caption">${icon('snowflake')}<span>Нажмите на шар или покачайте его</span></p></section>`;document.body.append(snow);
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
  const button=dock.querySelector('[data-feature="desk"]');if(button)button.innerHTML=`${icon(deskMode?'layout':'compass')}<span>${deskMode?'Показать все вкладки':'Фокус-вкладки'}</span>`;
}
const baseRenderTabs=renderTabs;
function costumeArtwork(id){return PETS.some(item=>item.id===id)?petArt(id,'costume-art'):icon(COSTUME_ICONS[id]||'spark','costume-icon');}
const COSTUME_ICONS={cap:'hat',crown:'crown',rocket:'rocket',dinosaur:'tree',wizard:'wand',paw:'paw',spark:'spark',moon:'moon'};
function setCostumeBadge(container,id,pinned=false){if(!container)return;const costume=normalizeCostume(id);container.dataset.costume=costume;let badge=container.querySelector(':scope > .byazen-tab-costume');if(!costume){badge?.remove();return;}if(!badge){badge=document.createElement('span');badge.className='byazen-tab-costume';}badge.innerHTML=costumeArtwork(costume);if(pinned)container.append(badge);else container.querySelector('.tab-title')?.prepend(badge);}
renderTabs=function(...args){baseRenderTabs(...args);for(const tab of tabs){tab.costume=normalizeCostume(tab.costume||'');const costume=tab.costume||funConfig.costume||'';setCostumeBadge(document.querySelector(`#tabs [data-id="${tab.id}"]`),costume);setCostumeBadge(document.querySelector(`#pinned [data-id="${tab.id}"]`),costume,true);}applyDesk();if(typeof updatePetCard==='function')updatePetCard();};
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
  return `<div class="byazen-card"><h3>${icon('history')} Археология вкладок</h3><p>Недавно закрытые страницы. Восстановление не сохраняет пароли и сайтные данные отдельно.</p>${list?`<div class="byazen-list">${list}</div>`:'<p>Раскопки пока не нашли ничего. Закройте обычную вкладку — и она появится здесь.</p>'}</div>`;
}
function renderFun(){
  const costumes=['',...Object.keys(COSTUME_LABELS)];
  const animalOptions=PETS.map(item=>`<option value="${item.id}">${esc(item.name)}</option>`).join('');
  const action=(id,iconId,title,description,disabled=false)=>`<button class="btn byazen-fun-action" data-action="${id}" ${disabled?'disabled':''}><span class="action-icon">${icon(iconId)}</span><span><b>${title}</b><small>${description}</small></span></button>`;
  return `<div class="byazen-card byazen-fun-panel">
    <div class="byazen-fun-heading"><span class="byazen-fun-heading-icon">${icon('spark')}</span><div><h3>Фан без перегруза</h3><p>Небольшие украшения, уютные эффекты и игры. Всё можно отключить в любой момент.</p></div></div>
    <div class="byazen-fun-grid">
      <label class="byazen-fun-toggle"><span class="byazen-fun-toggle-icon">${icon('sun')}</span><span><b>Тема дня</b><small>Меняет цвета оформления раз в сутки</small></span><input type="checkbox" id="funDailyTheme" ${funConfig.dailyTheme?'checked':''} aria-label="Включить случайную тему дня"></label>
      <label class="byazen-fun-toggle"><span class="byazen-fun-toggle-icon">${icon('spark')}</span><span><b>След за курсором</b><small>Мягкие пузырьки, без эффекта при уменьшении анимации</small></span><input type="checkbox" id="funCursor" ${funConfig.cursorBubbles?'checked':''} aria-label="Включить пузырьки за курсором"></label>
      <label class="byazen-fun-toggle"><span class="byazen-fun-toggle-icon">${icon('message')}</span><span><b>Прощание вкладки</b><small>Добрая фраза, когда закрывается обычная вкладка</small></span><input type="checkbox" id="funFarewell" ${funConfig.tabFarewell?'checked':''} aria-label="Включить прощание вкладки"></label>
      <div class="byazen-fun-toggle" role="group" aria-label="Ваш питомец"><span class="byazen-fun-toggle-icon">${petArt(currentPet().id,'pet-mini')}</span><span><b>Ваш питомец</b><small>${esc(currentPet().name)} · нажмите, чтобы выбрать другого</small></span><button class="icon-btn" type="button" data-action="pet" aria-label="Сменить питомца" title="Сменить питомца">${icon('rotate')}</button></div>
    </div>
    <div class="byazen-fun-subhead">Наряды вкладок</div>
    <div class="byazen-fun-select-grid">
      <div class="byazen-fun-select"><label for="funCostume">Общий наряд</label><select class="field" id="funCostume">${costumes.map(id=>`<option value="${id}" ${id===funConfig.costume?'selected':''}>${id?esc(COSTUME_LABELS[id]):'Без украшения'}</option>`).join('')}</select></div>
      <div class="byazen-fun-select"><label for="tabZooCostume">Наряд активной вкладки</label><select class="field" id="tabZooCostume"><option value="">По умолчанию</option>${animalOptions}${['cap','crown','rocket','wizard'].map(id=>`<option value="${id}">${COSTUME_LABELS[id]}</option>`).join('')}</select></div>
    </div>
    <div class="byazen-fun-actions">${action('apply-zoo-costume','palette','Нарядить вкладку','Применить выбранное украшение')}${action('random-zoo','paw','Зоопарк','Случайный зверёк для каждой вкладки')}</div>
    <div class="byazen-fun-subhead">Маленькие развлечения</div>
    <div class="byazen-fun-actions">
      ${action('roulette','dice','Рулетка','Открыть случайную закладку')}
      ${action('snow','snowflake','Снежный шар','Встряхнуть и отдохнуть')}
      ${action('pet','paw','Питомец','Познакомиться с новым другом')}
      ${action('game','star','Мини-игра','Поймать звезду во время загрузки',!tabs.some(t=>t.loading))}
      ${action('theme-toggle','moon','Тайный режим','Мягкий световой сюрприз')}
    </div>
    <div id="byazenGame" hidden><b>Поймай звезду, пока загружается страница</b><div id="byazenGameScore">Очки: 0 · 15 секунд</div><button id="byazenGameTarget" aria-label="Поймать звезду">${icon('star')}</button></div>
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
  body.querySelectorAll('[data-action="pet"]').forEach(button=>button.onclick=()=>{cyclePet();renderStudio();});
  body.querySelector('[data-action="snow"]').onclick=()=>{closeModal('byazenStudio');openSnowGlobe();};
  body.querySelector('[data-action="theme-toggle"]').onclick=()=>{easter.classList.add('show');setTimeout(()=>easter.classList.remove('show'),3000);toast('Секретный режим активирован. Почти ничего не изменилось.');};
  body.querySelector('#funDailyTheme').onchange=e=>{funConfig.dailyTheme=e.target.checked;saveFun();applyDailyTheme();};
  body.querySelector('#funCursor').onchange=e=>{funConfig.cursorBubbles=e.target.checked;saveFun();};
  body.querySelector('#funFarewell').onchange=e=>{funConfig.tabFarewell=e.target.checked;saveFun();};
  body.querySelector('#funCostume').onchange=e=>{funConfig.costume=e.target.value;saveFun();renderTabs();};
  body.querySelector('[data-action="apply-zoo-costume"]').onclick=()=>{const tab=activeTab();if(!tab)return toast('Нет активной вкладки');tab.costume=normalizeCostume(body.querySelector('#tabZooCostume').value);renderTabs();persistTabs();toast(tab.costume?`${COSTUME_LABELS[tab.costume]||currentPet().name} назначен вкладке`:'Костюм вкладки сброшен');};
  body.querySelector('[data-action="random-zoo"]').onclick=()=>{tabs.forEach(t=>t.costume=PETS[Math.floor(Math.random()*PETS.length)].id);renderTabs();persistTabs();toast('Зоопарк вкладок сформирован');};
  body.querySelector('[data-action="game"]').onclick=()=>startLoadingMiniGame(body);
}
function openRandomBookmark(){
  if(!bookmarks.length){toast('Сначала добавьте закладки — рулетке не из чего выбирать');return;}
  const item=bookmarks[Math.floor(Math.random()*bookmarks.length)];
  if(confirm(`Случайный выбор: «${item.title||hostOf(item.url)}». Открыть?`))navigateActive(item.url);
}
function openSnowGlobe(){
  snow.classList.add('show');if(nativeWebview)window.byazenDesktop.setActiveSite(null);const globe=$('#byazenGlobe'),buddy=currentPet();
  const stars=[icon('star'),icon('spark'),icon('star')];globe.innerHTML=`<div class="byazen-globe-scene"><span class="byazen-globe-moon"></span><span class="byazen-globe-star" style="left:23%;top:27%">${stars[0]}</span><span class="byazen-globe-star" style="left:68%;top:36%;animation-delay:.8s">${stars[1]}</span><span class="byazen-globe-star" style="left:38%;top:19%;animation-delay:1.2s">${stars[2]}</span><span class="byazen-globe-tree" style="left:20%"></span><span class="byazen-globe-tree" style="right:17%;width:25px;height:36px;bottom:20%"></span><div class="byazen-globe-hill"></div><span class="byazen-globe-pet" aria-hidden="true">${petArt(buddy.id)}</span></div>`;
  for(let i=0;i<30;i++){const flake=document.createElement('span');flake.className='byazen-flake';flake.innerHTML=icon('snowflake');flake.style.left=Math.random()*100+'%';flake.style.animationDelay=(-Math.random()*3)+'s';flake.style.animationDuration=(2.4+Math.random()*2.8)+'s';globe.append(flake);}
  const shake=()=>{globe.classList.remove('shake');void globe.offsetWidth;globe.classList.add('shake');};
  globe.onclick=shake;
  let pointerStart=null;
  globe.onpointerdown=e=>{pointerStart=[e.clientX,e.clientY];};
  globe.onpointerup=e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>18)shake();pointerStart=null;};
  const closeSnow=()=>{snow.classList.remove('show');globe.innerHTML='';if(nativeWebview)syncNativeBounds();};
  snow.querySelector('.byazen-snow-close').onclick=closeSnow;
  snow.onclick=e=>{if(e.target===snow)closeSnow();};
  globe.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();shake();}};
  snow.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeSnow();}};
  globe.title='Нажмите или покачайте шар, чтобы поднять снег';
  snow.querySelector('.byazen-snow-close').focus({preventScroll:true});
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
closeTab=function(id){const t=tabs.find(x=>x.id===id);const result=baseCloseTab(id);if(t&&funConfig.tabFarewell){toast(t.private?'Приватная вкладка тихо закрылась.':`${currentPet().name} машет вслед вкладке «${String(t.title||'').slice(0,36)}»`);const note=$('#toast');note.classList.remove('byazen-farewell');void note.offsetWidth;note.classList.add('byazen-farewell');setTimeout(()=>note.classList.remove('byazen-farewell'),1200);}return result;};
const basePersistTabs=persistTabs;
persistTabs=function(){basePersistTabs();const normal=tabs.filter(t=>!t.private).slice(-20);store.set('tabCostumes',normal.map(t=>({url:t.url,title:t.title,costume:t.costume||''})));};
const savedCostumes=readArray('tabCostumes',20);tabs.filter(t=>!t.private).forEach(t=>{const m=savedCostumes.find(x=>x.url===t.url&&x.title===t.title);if(m)t.costume=normalizeCostume(m.costume||'');});store.set('tabCostumes',savedCostumes.map(item=>({...item,costume:normalizeCostume(item.costume)})));renderTabs();
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
renderPanel=function(filter){baseRenderBookmarkPanel(filter);if(panelMode!=='bookmarks')return;$$('#panelBody .panel-item').forEach(row=>{const item=bookmarks[Number(row.dataset.index)],meta=row.querySelector('.dom');if(item?.remindAt&&meta)meta.innerHTML+=` · ${icon('clock')} ${new Date(item.remindAt).toLocaleString('ru-RU')}`;});};
if(typeof BACKUP_KEYS!=='undefined')for(const key of ['researchProjects','webFragments','funConfig','tabCostumes'])if(!BACKUP_KEYS.includes(key))BACKUP_KEYS.push(key);
const baseValidBackupValue=validBackupValue;
validBackupValue=function(key,value){
  if(key==='researchProjects')return Array.isArray(value)&&value.length<=50&&value.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=72&&Array.isArray(p.tabs)&&p.tabs.length<=50&&p.tabs.every(t=>t&&typeof t.url==='string'&&/^https?:\/\//i.test(t.url)));
  if(key==='webFragments')return Array.isArray(value)&&value.length<=200&&value.every(f=>f&&typeof f.id==='string'&&typeof f.text==='string'&&f.text.length<=3000&&typeof f.url==='string');
  if(key==='funConfig')return value&&typeof value==='object'&&!Array.isArray(value)&&['dailyTheme','cursorBubbles','tabFarewell'].every(k=>typeof value[k]==='boolean')&&(typeof value.petId==='string'||typeof value.pet==='string')&&typeof value.costume==='string'&&['friendly','pirate','robot','comedian'].includes(value.persona);
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
function addAiButton(label,handler,iconId='spark'){const button=document.createElement('button');button.className='byazen-ai-quick';button.innerHTML=`${icon(iconId)}<span>${label}</span>`;button.onclick=handler;$('.ai-quick').append(button);}
addAiButton('Инструкция из вкладок',makeInstructionFromPages);
addAiButton('Суд страниц',debateOpenPages,'scale');
addAiButton('Премия попапам',awardPopup,'trophy');
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
const personaLabel=document.createElement('label');personaLabel.textContent='Стиль ИИ';personaLabel.htmlFor='aiPersona';const personaSelect=document.createElement('select');personaSelect.className='field';personaSelect.id='aiPersona';personaSelect.innerHTML='<option value="friendly">Дружелюбный</option><option value="pirate">Пират</option><option value="robot">Робот</option><option value="comedian">Шутник</option>';personaSelect.value=funConfig.persona;aiModelBar.insertBefore(personaLabel,aiModelBar.querySelector('.spacer'));aiModelBar.insertBefore(personaSelect,aiModelBar.querySelector('.spacer'));personaSelect.onchange=()=>{funConfig.persona=personaSelect.value;saveFun();};
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
