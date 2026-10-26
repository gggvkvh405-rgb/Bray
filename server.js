const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// ---------- Search suggestions ----------
app.get('/api/suggest', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);
  try {
    const r = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&hl=ru&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.8' },
      signal: AbortSignal.timeout(6000)
    });
    const data = await r.json();
    return res.json(Array.isArray(data[1]) ? data[1].slice(0, 7) : []);
  } catch (e) {
    try {
      const r = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`, { signal: AbortSignal.timeout(6000) });
      const data = await r.json();
      return res.json(Array.isArray(data[1]) ? data[1].slice(0, 7) : []);
    } catch { return res.json([]); }
  }
});

// ---------- Weather (Nizhnevartovsk default, no key) ----------
app.get('/api/weather', async (req, res) => {
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=60.9344&longitude=76.5531&current=temperature_2m,weather_code&timezone=Asia%2FYekaterinburg', { signal: AbortSignal.timeout(6000) });
    const d = await r.json();
    res.json({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
  } catch { res.json(null); }
});

// ---------- Favicons (cached server-side, offline fallback tile) ----------
const faviconCache = new Map();
app.get('/api/favicon', async (req, res) => {
  const domain = (req.query.domain || '').toString().toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 120);
  if (!domain) return res.status(400).end();
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const hit = faviconCache.get(domain);
  if (hit) return res.type(hit.type).send(hit.body);
  try {
    const r = await fetch('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=64', {
      headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000)
    });
    if (!r.ok) throw new Error('bad response');
    const body = Buffer.from(await r.arrayBuffer());
    if (!body.length) throw new Error('empty');
    const type = r.headers.get('content-type') || 'image/png';
    faviconCache.set(domain, { type, body });
    return res.type(type).send(body);
  } catch {
    const letter = (domain[0] || '?').toUpperCase();
    let hash = 0; for (const ch of domain) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="hsl(${hash},42%,32%)"/><text x="32" y="43" text-anchor="middle" font-family="system-ui,sans-serif" font-size="34" font-weight="600" fill="#FAFAFA">${letter}</text></svg>`;
    faviconCache.set(domain, { type: 'image/svg+xml', body: svg });
    return res.type('image/svg+xml').send(svg);
  }
});

// ---------- ByAzen Search (real results via DuckDuckGo HTML) ----------
function stripTags(s){ return (s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function decodeEntities(s){
  return (s||'')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0?39;|&#x27;/g,"'")
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
    .replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n));
}
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json({ results: [], answer: null });
  try {
    const [htmlResp, iaResp] = await Promise.allSettled([
      fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q) + '&kl=ru-ru', { headers: { 'User-Agent': UA, 'Accept-Language': 'ru,en;q=0.8' }, signal: AbortSignal.timeout(9000) }),
      fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1&kl=ru-ru', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000) })
    ]);
    let results = [];
    if (htmlResp.status === 'fulfilled') {
      const html = await htmlResp.value.text();
      const titles = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
      const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];
      results = titles.map((m, i) => {
        let url = decodeEntities(m[1]);
        try {
          const u = new URL(url.startsWith('//') ? 'https:' + url : url, 'https://duckduckgo.com');
          url = u.searchParams.get('uddg') || u.href;
        } catch {}
        return {
          title: decodeEntities(stripTags(m[2])),
          url,
          snippet: snippets[i] ? decodeEntities(stripTags(snippets[i][1])) : ''
        };
      }).filter(r => r.title && /^https?:/.test(r.url)).slice(0, 15);
    }
    let answer = null;
    if (iaResp.status === 'fulfilled') {
      try {
        const ia = await iaResp.value.json();
        if (ia.AbstractText) answer = { text: ia.AbstractText, source: ia.AbstractSource || '', url: ia.AbstractURL || '', heading: ia.Heading || '' };
      } catch {}
    }
    res.json({ results, answer });
  } catch (e) {
    res.json({ results: [], answer: null, error: true });
  }
});

// ---------- Web proxy : lets real sites open inside ByAzen ----------
function injectedScript(finalUrl) {
  return `<script>
(function(){
  function send(){ try{ parent.postMessage({type:'byazen-nav', url:${JSON.stringify(finalUrl)}, title:document.title||''}, '*'); }catch(e){} }
  window.addEventListener('load', send); setTimeout(send,300); setTimeout(send,1200);
  try{ new MutationObserver(send).observe(document.querySelector('title')||document.head,{childList:true,characterData:true,subtree:true}); }catch(e){}
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a');
    if(!a) return;
    var href = a.href;
    if(!href || href.indexOf('http')!==0 || href.indexOf('#')===0 || a.target==='_blank' && e.ctrlKey) return;
    if(a.hasAttribute('download')) return;
    e.preventDefault();
    location.href = '/proxy?url=' + encodeURIComponent(href);
  }, true);
  document.addEventListener('submit', function(e){
    var f = e.target;
    try{
      var action = f.action || location.href;
      if((f.method||'GET').toUpperCase()==='GET'){
        e.preventDefault();
        var params = new URLSearchParams(new FormData(f)).toString();
        var target = action.split('?')[0] + (params ? '?' + params : '');
        location.href = '/proxy?url=' + encodeURIComponent(target);
      }
    }catch(err){}
  }, true);
})();
<\/script>`;
}

app.get('/proxy', async (req, res) => {
  let target = (req.query.url || '').toString();
  if (!target) return res.status(400).send('No url');
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru,en-US;q=0.8,en;q=0.6',
        'Referer': new URL(target).origin + '/'
      },
      signal: AbortSignal.timeout(12000)
    });
    const finalUrl = upstream.url || target;
    const ct = upstream.headers.get('content-type') || '';

    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Proxied-Url', encodeURIComponent(finalUrl));

    if (ct.includes('text/html')) {
      let html = await upstream.text();
      // strip frame-busting meta CSP
      html = html.replace(/<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      const base = `<base href="${finalUrl.replace(/"/g, '&quot;')}">`;
      const inject = base + injectedScript(finalUrl);
      if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, m => m + inject);
      else if (/<html[^>]*>/i.test(html)) html = html.replace(/<html[^>]*>/i, m => m + '<head>' + inject + '</head>');
      else html = inject + html;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
    // binary / other content passthrough
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (ct) res.setHeader('Content-Type', ct);
    return res.send(buf);
  } catch (e) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html><meta charset="utf-8"><style>
      body{margin:0;background:#0E0E11;color:#FAFAFA;font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh}
      .box{text-align:center;max-width:460px;padding:24px}h1{font-size:20px;font-weight:600}p{color:#A1A1AA;line-height:1.6;font-size:14px}
      a{display:inline-block;margin-top:14px;background:#FAFAFA;color:#09090B;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px}
    </style><div class="box"><h1>Не удалось открыть сайт</h1>
    <p>Сайт недоступен или блокирует открытие внутри браузера. Попробуйте открыть его напрямую.</p>
    <a href="${target.replace(/"/g,'&quot;')}" target="_blank" rel="noopener">Открыть ${new URL(target).hostname}</a></div>
    <script>parent.postMessage({type:'byazen-nav',url:${JSON.stringify(target)},title:'Ошибка загрузки'},'*')<\/script>`);
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

function startServer(port = PORT, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const srv = app.listen(port, host, () => resolve(srv));
    srv.on('error', reject);
  });
}

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`ByAzen running on http://0.0.0.0:${PORT}`));
}

module.exports = { app, startServer };
