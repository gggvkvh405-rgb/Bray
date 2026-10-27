(() => {
  const canvas = document.getElementById('photoCodeCanvas');
  const image = document.getElementById('photoCodeImage');
  if (!canvas || !image) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const spriteFiles = {
    fire: 'fire_01.png', flame: 'flame_01.png', smoke: 'smoke_01.png',
    flare: 'flare_01.png', spark: 'spark_01.png', star: 'star_01.png', muzzle: 'muzzle_01.png'
  };
  const sprites = Object.fromEntries(Object.entries(spriteFiles).map(([name, file]) => {
    const sprite = new Image();
    sprite.src = `/vfx/kenney/${file}`;
    return [name, sprite];
  }));
  let raf = 0, activeEffect = '', lastSize = '', observer = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (n, k = 0) => {
    const v = Math.sin((n + 1) * 127.1 + (k + 1) * 311.7) * 43758.5453123;
    return v - Math.floor(v);
  };
  function fit() {
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const key = `${Math.round(rect.width * dpr)}x${Math.round(rect.height * dpr)}`;
    if (key !== lastSize) {
      lastSize = key;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas._logicalWidth = rect.width;
      canvas._logicalHeight = rect.height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }
  function sprite(name, x, y, w, h, filter = 'none', alpha = 1, rotation = 0) {
    const img = sprites[name];
    if (!img?.complete || !img.naturalWidth) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = filter;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  function glowLine(x1, y1, x2, y2, color, width, glow = 12, alpha = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function bolt(x1, y1, x2, y2, seed, depth = 0, spread = .1) {
    const dx = x2 - x1, dy = y2 - y1;
    const points = [{ x: x1, y: y1 }];
    const count = depth ? 5 : 11;
    for (let i = 1; i < count; i++) {
      const t = i / count;
      points.push({ x: x1 + dx * t + (rand(seed + i, depth) - .5) * spread * Math.hypot(dx, dy), y: y1 + dy * t + (rand(seed + i, depth + 8) - .5) * spread * Math.hypot(dx, dy) });
    }
    points.push({ x: x2, y: y2 });
    for (let i = 0; i < points.length - 1; i++) glowLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, '#70dfff', depth ? 1.1 : 2.1, depth ? 7 : 18, .92);
    if (!depth) {
      for (let i = 2; i < points.length - 2; i += 3) {
        const p = points[i], q = points[Math.min(i + 3, points.length - 1)];
        bolt(p.x, p.y, p.x + (rand(seed, i) - .5) * dx * .38, p.y + Math.abs(q.y - p.y) * (rand(i, seed) + .3), seed + i, 1, .18);
      }
    }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = '#fff'; ctx.lineWidth = depth ? .45 : .8; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.restore();
  }
  function drawFlame(w, h, t) {
    const warm = 'sepia(1) saturate(8) hue-rotate(-22deg) brightness(1.25)';
    const gold = 'sepia(1) saturate(10) hue-rotate(4deg) brightness(1.4)';
    const smoke = 'grayscale(1) brightness(1.65)';
    const pulse = .55 + .25 * Math.sin(t * 8) + .12 * Math.sin(t * 19);
    sprite('smoke', w * .5 + Math.sin(t * .65) * w * .04, h * .69, w * .72, h * .55, smoke, .23);
    sprite('smoke', w * .2, h * .76, w * .45, h * .37, smoke, .16, -.25);
    sprite('smoke', w * .82, h * .73, w * .42, h * .38, smoke, .18, .28);
    sprite('muzzle', w * .22, h * .8, w * .27, h * .65, warm, .67 * pulse, -.09);
    sprite('muzzle', w * .78, h * .79, w * .3, h * .68, warm, .72 * pulse, .12);
    sprite('flame', w * .5, h * .91, w * .52, h * .43, gold, .68 * pulse);
    for (let i = 0; i < 28; i++) {
      const x = rand(i, 2) * w;
      const speed = .12 + rand(i, 3) * .28;
      const p = (t * speed + rand(i, 4)) % 1;
      const y = h * (1 - p);
      const sway = Math.sin(t * 2.3 + i * 5) * w * .025 * p;
      const r = 1 + rand(i, 5) * 3.2;
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = (1 - p) * .9; ctx.fillStyle = p < .25 ? '#fff9b4' : p < .6 ? '#ff9b23' : '#ed321b'; ctx.shadowColor = '#ff681c'; ctx.shadowBlur = r * 5; ctx.beginPath(); ctx.ellipse(x + sway, y, r * .5, r * (1.4 + p), -.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    sprite('fire', w * .48, h * .86, w * .54, h * .35, gold, .15 + .08 * Math.sin(t * 7));
  }
  function drawLaser(w, h, t) {
    const beamY = [h * .28, h * .48, h * .69];
    beamY.forEach((y, i) => {
      const drift = Math.sin(t * 2.6 + i * 2.2) * h * .035;
      const x = ((t * (.25 + i * .07) + i * .31) % 1) * w;
      const color = ['#ff176c', '#39f1ff', '#bc5bff'][i];
      glowLine(-w * .06, y + drift, w * 1.06, y - drift * .5, color, i === 0 ? 2.4 : 1.5, 18, .78);
      glowLine(-w * .06, y + drift, w * 1.06, y - drift * .5, '#fff', .5, 5, .9);
      sprite('flare', x, y + drift, w * .38, h * .15, `sepia(1) saturate(10) hue-rotate(${i * 104 - 25}deg)`, .66, 0);
      sprite('star', x, y + drift, Math.max(34, w * .11), Math.max(34, h * .11), 'brightness(2)', .8);
    });
    const g = ctx.createRadialGradient(w * .5, h * .46, 2, w * .5, h * .46, w * .58);
    g.addColorStop(0, 'rgba(255,30,132,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function drawLightning(w, h, t) {
    const phase = t % 2.8;
    const flash = phase < .16 || (phase > .22 && phase < .29) || (phase > 1.15 && phase < 1.24);
    sprite('spark', w * .52, h * .5, w * 1.24, h * 1.24, 'sepia(1) saturate(6) hue-rotate(165deg) brightness(1.8)', flash ? .42 : .12, Math.sin(t * 3) * .12);
    if (flash) {
      const alpha = phase < .16 ? .15 : .075;
      ctx.fillStyle = `rgba(190,238,255,${alpha})`; ctx.fillRect(0, 0, w, h);
      bolt(w * (.2 + rand(Math.floor(t * 7), 1) * .18), 0, w * (.42 + rand(Math.floor(t * 7), 2) * .25), h * (.68 + rand(Math.floor(t * 7), 3) * .2), Math.floor(t * 17));
      if (phase < .16) bolt(w * .82, h * .02, w * .68, h * .62, Math.floor(t * 11) + 5);
    }
  }
  function drawNeon(w, h, t) {
    const colors = ['#ff38df', '#42f6ff', '#ffe84b'];
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const inset = 8 + i * 5;
      ctx.globalAlpha = .55 + .35 * Math.sin(t * 4 + i * 2);
      ctx.strokeStyle = colors[i]; ctx.lineWidth = i ? 2 : 3; ctx.shadowColor = colors[i]; ctx.shadowBlur = 18 + 8 * Math.sin(t * 5 + i);
      ctx.beginPath(); ctx.roundRect(inset, inset, Math.max(1, w - inset * 2), Math.max(1, h - inset * 2), 12); ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const y = ((t * 1.7 + i * .137) % 1) * h;
      const x = rand(i, 8) * w * .72;
      ctx.globalAlpha = .18 + .34 * rand(i, Math.floor(t * 8)); ctx.fillStyle = i % 2 ? '#ff4fe1' : '#31eeff'; ctx.fillRect(x, y, w * (.12 + rand(i, 9) * .23), 1 + rand(i, 10) * 3);
    }
    ctx.restore();
    for (let i = 0; i < 5; i++) sprite('star', w * (.12 + rand(i, 2) * .76), h * (.13 + rand(i, 3) * .73), 28 + 16 * Math.sin(t * 4 + i), 28 + 16 * Math.sin(t * 4 + i), `hue-rotate(${(t * 80 + i * 80) % 360}deg) brightness(1.8)`, .58);
  }
  function drawIce(w, h, t) {
    sprite('smoke', w * .5, h * .5, w * 1.16, h * 1.16, 'grayscale(1) brightness(2.2) sepia(.35) hue-rotate(155deg)', .22 + .05 * Math.sin(t * 2));
    const frost = '#a9f4ff';
    for (let edge = 0; edge < 4; edge++) {
      const horizontal = edge < 2, reverse = edge % 2 === 1;
      for (let i = 0; i < 7; i++) {
        const p = (i + .5) / 7;
        const x = horizontal ? p * w : (reverse ? w - 8 : 8);
        const y = horizontal ? (reverse ? h - 8 : 8) : p * h;
        const len = 12 + 14 * rand(i, edge);
        const direction = reverse ? -1 : 1;
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .52 + .23 * Math.sin(t * 2 + i); ctx.strokeStyle = frost; ctx.lineWidth = 1.2; ctx.shadowColor = '#5de7ff'; ctx.shadowBlur = 9;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (horizontal ? 0 : len * direction), y + (horizontal ? len * direction : 0));
        ctx.moveTo(x, y); ctx.lineTo(x + (horizontal ? len * .65 : len * direction), y + (horizontal ? len * direction * .65 : len * .65));
        ctx.moveTo(x, y); ctx.lineTo(x + (horizontal ? -len * .65 : len * direction), y + (horizontal ? len * direction * .65 : -len * .65)); ctx.stroke(); ctx.restore();
      }
    }
    for (let i = 0; i < 26; i++) {
      const x = rand(i, 1) * w, y = ((rand(i, 2) * h + t * (18 + rand(i, 3) * 36)) % h);
      sprite('star', x, y, 7 + rand(i, 4) * 10, 7 + rand(i, 5) * 10, 'brightness(1.8) sepia(.4) hue-rotate(150deg)', .45 + rand(i, 6) * .4);
    }
  }
  function drawDisco(w, h, t) {
    const cx = w * .5, cy = h * .13;
    const colors = ['#ff32c8', '#36f4ff', '#ffe849', '#9b4dff', '#6fff7d'];
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) {
      const a = t * (.65 + i * .08) + i * Math.PI * 2 / 7;
      const spread = .19 + .05 * Math.sin(t * 2 + i);
      const len = Math.max(w, h) * 1.2;
      const x1 = cx + Math.cos(a - spread) * len, y1 = cy + Math.sin(a - spread) * len;
      const x2 = cx + Math.cos(a + spread) * len, y2 = cy + Math.sin(a + spread) * len;
      const grad = ctx.createLinearGradient(cx, cy, (x1 + x2) / 2, (y1 + y2) / 2);
      grad.addColorStop(0, colors[i % colors.length] + '00'); grad.addColorStop(.55, colors[i % colors.length] + '33'); grad.addColorStop(1, colors[i % colors.length] + '8c');
      ctx.globalAlpha = .55; ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
      glowLine(cx, cy, cx + Math.cos(a) * len * .95, cy + Math.sin(a) * len * .95, colors[i % colors.length], 1.3, 14, .62);
    }
    ctx.restore();
    sprite('flare', cx, cy, w * .65, h * .34, 'hue-rotate(300deg) saturate(4) brightness(1.4)', .72);
    for (let i = 0; i < 22; i++) {
      const x = rand(i, 11) * w, y = ((rand(i, 12) * h + t * (12 + rand(i, 13) * 22)) % h);
      sprite('star', x, y, 8 + rand(i, 14) * 14, 8 + rand(i, 15) * 14, `hue-rotate(${(i * 53 + t * 70) % 360}deg) brightness(1.5)`, .5 + .35 * Math.sin(t * 3 + i));
    }
    const colorshift = Math.floor(t * 4) % 5;
    ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = colors[colorshift]; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
  function render(now) {
    if (!activeEffect || document.hidden || !fit()) return;
    const w = canvas._logicalWidth, h = canvas._logicalHeight, t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    if (activeEffect === 'flame') drawFlame(w, h, t);
    else if (activeEffect === 'laser') drawLaser(w, h, t);
    else if (activeEffect === 'lightning') drawLightning(w, h, t);
    else if (activeEffect === 'neon') drawNeon(w, h, t);
    else if (activeEffect === 'ice') drawIce(w, h, t);
    else if (activeEffect === 'disco') drawDisco(w, h, t);
    if (!reducedMotion.matches) raf = requestAnimationFrame(render);
  }
  function start(effect) {
    stop();
    activeEffect = String(effect || '');
    if (!activeEffect || !canvas.isConnected) return;
    fit();
    canvas.classList.add('running');
    if (window.ResizeObserver) { observer = new ResizeObserver(fit); observer.observe(image); }
    if (!reducedMotion.matches) raf = requestAnimationFrame(render);
    else render(performance.now());
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; activeEffect = ''; lastSize = '';
    observer?.disconnect(); observer = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('running');
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && activeEffect && !reducedMotion.matches && !raf) raf = requestAnimationFrame(render);
  });
  window.startPhotoCodeVfx = start;
  window.stopPhotoCodeVfx = stop;
})();
