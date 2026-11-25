/* זינוק — דמות, חלקיקים וסאונד */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- הדמות: מתפתחת לפי רמה. כל הערכים כאן מספריים/קבועים, אין תוכן מחבילות ---------- */
  const PALETTES = [
    ['#7CF5E1', '#22D3EE'],
    ['#38E1FF', '#7C5CFF'],
    ['#8B7BFF', '#D07BFF'],
    ['#D69BFF', '#F5C451'],
    ['#FFD66B', '#FF6FB5'],
  ];
  let uid = 0;

  function avatar(level, size) {
    const tier = window.Z.tierIndex(level);
    const [c1, c2] = PALETTES[tier];
    const id = 'av' + (++uid);
    const coreR = 15 + tier * 2.2 + Math.min(level, 20) * 0.25;
    const dots = Math.min(2 + level, 9);
    let m = '';
    m += `<defs>
      <radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${c2}" stop-opacity=".55"/><stop offset="100%" stop-color="${c2}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff"/><stop offset="35%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>
      <linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c2}" stop-opacity="0"/><stop offset="100%" stop-color="${c1}" stop-opacity=".85"/></linearGradient>
    </defs>`;
    m += `<circle cx="60" cy="60" r="${44 + tier * 3}" fill="url(#${id}g)" class="av-pulse"/>`;
    if (tier >= 3) {
      m += `<g class="av-wings" opacity=".9">
        <path d="M44 62 C22 50 12 36 8 22 C22 30 30 34 40 44 C30 44 22 46 16 52 C28 52 36 56 44 62Z" fill="url(#${id}w)"/>
        <path d="M44 62 C22 50 12 36 8 22 C22 30 30 34 40 44 C30 44 22 46 16 52 C28 52 36 56 44 62Z" fill="url(#${id}w)" transform="translate(120 0) scale(-1 1)"/>
      </g>`;
    }
    if (tier >= 1) m += `<g class="av-spin"><ellipse cx="60" cy="60" rx="${coreR + 16}" ry="${(coreR + 16) * 0.34}" fill="none" stroke="${c1}" stroke-opacity=".55" stroke-width="1.6" transform="rotate(-20 60 60)"/></g>`;
    if (tier >= 2) m += `<g class="av-spin-rev"><ellipse cx="60" cy="60" rx="${coreR + 22}" ry="${(coreR + 22) * 0.3}" fill="none" stroke="${c2}" stroke-opacity=".45" stroke-width="1.2" transform="rotate(35 60 60)"/></g>`;
    let orb = '';
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      const r = coreR + 12 + (i % 2) * 6;
      orb += `<circle cx="${(60 + Math.cos(a) * r).toFixed(1)}" cy="${(60 + Math.sin(a) * r).toFixed(1)}" r="${1.2 + (i % 3) * 0.5}" fill="${i % 2 ? c1 : '#fff'}" opacity=".85"/>`;
    }
    m += `<g class="av-spin-slow">${orb}</g>`;
    m += `<g class="av-float">`;
    if (tier >= 2) {
      const r = coreR + 3;
      m += `<polygon points="60,${60 - r * 1.15} ${60 + r * 0.9},${60 - r * 0.2} ${60 + r * 0.6},${60 + r} ${60 - r * 0.6},${60 + r} ${60 - r * 0.9},${60 - r * 0.2}" fill="url(#${id}c)"/>`;
      m += `<polygon points="60,${60 - r * 1.15} ${60 + r * 0.9},${60 - r * 0.2} 60,${60 - r * 0.05}" fill="#fff" opacity=".28"/>`;
    } else {
      m += `<circle cx="60" cy="60" r="${coreR}" fill="url(#${id}c)"/>`;
      m += `<ellipse cx="${60 - coreR * 0.35}" cy="${60 - coreR * 0.45}" rx="${coreR * 0.35}" ry="${coreR * 0.2}" fill="#fff" opacity=".45"/>`;
    }
    const ey = 60 + (tier >= 2 ? 2 : 1), ex = coreR * 0.34;
    m += `<g class="av-blink"><ellipse cx="${60 - ex}" cy="${ey}" rx="2.3" ry="3.4" fill="#0b0b12"/><ellipse cx="${60 + ex}" cy="${ey}" rx="2.3" ry="3.4" fill="#0b0b12"/>
      <circle cx="${60 - ex + 0.8}" cy="${ey - 1.2}" r=".8" fill="#fff"/><circle cx="${60 + ex + 0.8}" cy="${ey - 1.2}" r=".8" fill="#fff"/></g>`;
    if (tier >= 4) {
      const top = 60 - coreR * 1.15 - 6;
      m += `<path d="M48 ${top} L51 ${top - 10} L56 ${top - 3} L60 ${top - 13} L64 ${top - 3} L69 ${top - 10} L72 ${top} Z" fill="#FFD66B" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/>`;
    }
    m += `</g>`;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('width', size); svg.setAttribute('height', size);
    svg.setAttribute('class', 'avatar tier-' + tier);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'הדמות שלך, דרגה: ' + window.Z.TIERS[tier].name);
    svg.innerHTML = m; // מחרוזת קבועה שנבנית רק ממספרים וצבעים פנימיים
    return svg;
  }

  function bossFigure(size) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', size); svg.setAttribute('height', size);
    svg.setAttribute('class', 'boss-fig');
    svg.setAttribute('aria-hidden', 'true');
    let spikes = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, a1 = a - 0.12, a2 = a + 0.12;
      const p = (r, t) => `${(100 + Math.cos(t) * r).toFixed(1)},${(100 + Math.sin(t) * r).toFixed(1)}`;
      spikes += `<polygon points="${p(52, a1)} ${p(i % 2 ? 84 : 74, a)} ${p(52, a2)}" fill="#1a0b12" stroke="#ff3d6e" stroke-opacity=".5" stroke-width="1"/>`;
    }
    svg.innerHTML = `<defs>
      <radialGradient id="bg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff2d5a" stop-opacity=".55"/><stop offset="100%" stop-color="#ff2d5a" stop-opacity="0"/></radialGradient>
      <radialGradient id="bg2" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="#3a1020"/><stop offset="100%" stop-color="#07030a"/></radialGradient>
      <radialGradient id="bg3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff6c2"/><stop offset="35%" stop-color="#ffb02e"/><stop offset="100%" stop-color="#ff1f4b"/></radialGradient></defs>
      <circle cx="100" cy="100" r="98" fill="url(#bg1)" class="av-pulse"/>
      <g class="boss-spikes">${spikes}</g>
      <circle cx="100" cy="100" r="56" fill="url(#bg2)" stroke="#ff3d6e" stroke-opacity=".6" stroke-width="1.5"/>
      <g class="boss-eye"><ellipse cx="100" cy="100" rx="30" ry="18" fill="#12040a" stroke="#ff3d6e" stroke-width="1.5"/>
      <circle cx="100" cy="100" r="14" fill="url(#bg3)"/><ellipse cx="100" cy="100" rx="3.2" ry="11" fill="#0a0205"/></g>`;
    return svg;
  }

  /* ---------- חלקיקים ---------- */
  let cv, ctx, parts = [], running = false;
  function ensureCanvas() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.className = 'fx-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const rs = () => { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    rs(); addEventListener('resize', rs);
  }
  function burst(x, y, opts) {
    if (reduced()) return;
    ensureCanvas();
    const o = Object.assign({ n: 40, colors: ['#7C5CFF', '#22D3EE', '#fff'], speed: 7, gravity: 0.14, size: 3, life: 70 }, opts || {});
    for (let i = 0; i < o.n; i++) {
      const a = Math.random() * Math.PI * 2, v = o.speed * (0.35 + Math.random() * 0.75);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - o.speed * 0.25, g: o.gravity, s: o.size * (0.5 + Math.random()), c: o.colors[i % o.colors.length], life: o.life * (0.6 + Math.random() * 0.6), t: 0, sq: Math.random() < 0.4 });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.t < p.life);
    for (const p of parts) {
      p.t++; p.vx *= 0.985; p.vy = p.vy * 0.985 + p.g; p.x += p.vx; p.y += p.vy;
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.c;
      if (p.sq) ctx.fillRect(p.x, p.y, p.s * 1.6, p.s * 0.8);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(tick); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function burstAt(el, opts) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  /* ---------- סאונד (סינתזה, בלי קבצים) ---------- */
  let ac;
  function audio() {
    if (!window.Z.state.settings.sound) return null;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; }
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + start;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    tap() { tone(660, 0, 0.05, 'sine', 0.04); },
    correct() { tone(784, 0, 0.12, 'triangle', 0.1); tone(1175, 0.07, 0.2, 'triangle', 0.09); },
    wrong() { tone(196, 0, 0.22, 'sawtooth', 0.05, 130); },
    xp() { tone(1320, 0, 0.08, 'sine', 0.05); },
    levelUp() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.085, 0.35, 'triangle', 0.09)); tone(2093, 0.45, 0.6, 'sine', 0.05); },
    bossIntro() { tone(55, 0, 1.6, 'sawtooth', 0.07, 45); tone(82, 0.3, 1.4, 'square', 0.03, 70); },
    bossHit() { tone(140, 0, 0.18, 'square', 0.08, 60); tone(900, 0, 0.08, 'triangle', 0.06); },
    hurt() { tone(90, 0, 0.35, 'sawtooth', 0.09, 50); },
    tick() { tone(1200, 0, 0.03, 'square', 0.02); },
    victory() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.5, 'triangle', 0.09)); },
  };
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* */ } }

  window.FX = { avatar, bossFigure, burst, burstAt, sfx, buzz, reduced };
})();
