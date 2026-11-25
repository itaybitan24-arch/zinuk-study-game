/* זינוק — ממשק. כל טקסט שמגיע מחבילות נכנס ל־DOM רק דרך textContent / createTextNode. */
(function () {
  'use strict';
  const Z = window.Z, FX = window.FX, V = window.ZValidate;

  /* ---------- עזרי DOM ---------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
    append(el, kids);
    return el;
  }
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
    }
    return el;
  }

  const ICONS = {
    back: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
    shield: '<path d="M12 3l8 3.5v5.5c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6.5z"/><path d="M9 12l2 2 4-4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    heart: '<path d="M12 20.5s-8-5-8-10.8A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.7c0 5.8-8 10.8-8 10.8z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    soundOn: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    soundOff: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 17h.01"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.7 0-3.3-2-5.6-3.6-7.3-.3 1.7-1.2 3-2.4 3.6.3-3.3-1.2-6.5-4-8.6.3 3.1-1.4 5.3-3 7.2A8.3 8.3 0 0 0 5 15.3C5 19.3 8 22 12 22z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };
  function icon(name, size, cls) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size || 20); svg.setAttribute('height', size || 20);
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    svg.innerHTML = ICONS[name] || ''; // קבועים פנימיים בלבד
    return svg;
  }

  const $view = () => document.getElementById('view');
  const live = (msg) => { const r = document.getElementById('live'); r.textContent = ''; setTimeout(() => { r.textContent = msg; }, 30); };

  function toast(msg, kind) {
    const t = h('div', { class: 'toast ' + (kind || ''), role: 'status' }, icon(kind === 'bad' ? 'close' : 'check', 18), h('span', { text: msg }));
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  function modal(title, body, actions) {
    return new Promise((resolve) => {
      const prev = document.activeElement;
      const close = (val) => { wrap.classList.add('out'); document.removeEventListener('keydown', onKey); setTimeout(() => { wrap.remove(); if (prev && prev.focus) prev.focus(); }, 220); resolve(val); };
      const onKey = (e) => { if (e.key === 'Escape') close(null); };
      const btns = (actions || [{ label: 'סגור', value: true, primary: true }]).map((a) =>
        h('button', { class: 'btn ' + (a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-ghost'), onclick: () => close(a.value) }, a.label));
      const box = h('div', { class: 'modal glass', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('h2', { class: 'modal-title', text: title }), h('div', { class: 'modal-body' }, body), h('div', { class: 'modal-actions' }, btns));
      const wrap = h('div', { class: 'scrim', onclick: (e) => { if (e.target === wrap) close(null); } }, box);
      document.body.appendChild(wrap);
      document.addEventListener('keydown', onKey);
      setTimeout(() => (btns[btns.length - 1] || box).focus(), 40);
    });
  }
  const confirmBox = (title, text, okLabel, danger) => modal(title, h('p', { text }), [
    { label: 'ביטול', value: false }, { label: okLabel, value: true, primary: !danger, danger: !!danger }]);

  /* ---------- סרגל עליון ---------- */
  function renderTopbar() {
    const bar = document.getElementById('topbar');
    bar.textContent = '';
    const st = Z.state;
    const li = Z.levelInfo(st.player.xp);
    const tier = Z.TIERS[Z.tierIndex(li.level)];
    const chip = h('button', { class: 'player-chip', onclick: () => go('stats'), 'aria-label': `רמה ${li.level}, ${li.into} מתוך ${li.need} XP. פתח סטטיסטיקות` },
      h('span', { class: 'chip-av' }, FX.avatar(li.level, 34)),
      h('span', { class: 'chip-meta' },
        h('span', { class: 'chip-line' }, h('b', { text: 'רמה ' + li.level }), h('span', { class: 'muted', text: ' · ' + tier.name })),
        h('span', { class: 'xpbar sm' }, h('span', { class: 'xpfill', id: 'top-xpfill', style: { width: (li.pct * 100).toFixed(1) + '%' } }))));
    bar.append(
      h('button', { class: 'brand', onclick: () => go('home'), 'aria-label': 'זינוק — מסך הבית' },
        h('span', { class: 'brand-mark' }, icon('bolt', 18)), h('span', { class: 'brand-name', text: 'זינוק' })),
      h('div', { class: 'top-actions' },
        h('button', { class: 'icon-btn', onclick: () => go('stats'), 'aria-label': 'סטטיסטיקות', title: 'סטטיסטיקות' }, icon('chart')),
        h('button', { class: 'icon-btn', onclick: () => go('data'), 'aria-label': 'גיבוי והגדרות', title: 'גיבוי והגדרות' }, icon('shield')),
        chip));
    renderBottomNav();
  }

  /* סרגל ניווט תחתון — מוצג רק בטלפון */
  let current = 'home';
  function renderBottomNav() {
    const nav = document.getElementById('bottomnav');
    if (!nav) return;
    nav.textContent = '';
    const tab = (screen, ic, label) => h('button', { class: 'tab' + (current === screen ? ' active' : ''), 'aria-current': current === screen ? 'page' : null,
      onclick: () => { FX.sfx.tap(); go(screen); } }, icon(ic, 22), h('span', { text: label }));
    append(nav, [tab('home', 'book', 'עולמות'), tab('stats', 'chart', 'התקדמות'), tab('data', 'shield', 'גיבוי')]);
  }

  /* ---------- ניווט ---------- */
  let cleanup = null;
  function blank() {
    if (cleanup) { cleanup(); cleanup = null; }
    document.onkeydown = null;
    document.body.classList.remove('boss-mode', 'in-play');
    const v = $view();
    v.textContent = '';
    v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    window.scrollTo({ top: 0 });
    renderTopbar();
    return v;
  }
  function go(screen, arg) {
    current = screen === 'world' ? 'home' : screen;
    const v = blank();
    ({ home: renderHome, world: renderWorld, stats: renderStats, data: renderData })[screen](arg);
    const hd = v.querySelector('h1'); if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus({ preventScroll: true }); }
  }

  function countdown(pack) {
    const d = Z.daysLeft(pack);
    if (d == null) return null;
    const txt = d > 1 ? `עוד ${d} ימים למבחן` : d === 1 ? 'המבחן מחר!' : d === 0 ? 'המבחן היום!' : 'המבחן עבר · ההתקדמות נשמרת';
    return h('span', { class: 'pill ' + (d < 0 ? 'pill-dim' : d <= 3 ? 'pill-hot' : d <= 10 ? 'pill-warm' : '') }, icon('clock', 14), h('span', { text: txt }));
  }

  function ring(pct, size, label) {
    const r = 15.5, c = 2 * Math.PI * r;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 36 36'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('class', 'ring');
    svg.setAttribute('aria-hidden', 'true');
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    svg.innerHTML = `<circle cx="18" cy="18" r="${r}" class="ring-bg"/><circle cx="18" cy="18" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>`;
    return h('span', { class: 'ring-wrap', style: { width: size + 'px', height: size + 'px' } }, svg, h('span', { class: 'ring-label', text: label != null ? label : String(Math.round(pct)) }));
  }

  /* ---------- בית ---------- */
  function renderHome() {
    const st = Z.state;
    const li = Z.levelInfo(st.player.xp);
    const ti = Z.tierIndex(li.level);
    const next = Z.TIERS[ti + 1];
    const v = $view();

    const hero = h('section', { class: 'hero glass' },
      h('div', { class: 'hero-av' }, FX.avatar(li.level, 168)),
      h('div', { class: 'hero-meta' },
        h('p', { class: 'eyebrow', text: Z.TIERS[ti].name + ' · רמה ' + li.level }),
        h('h1', { class: 'display', text: st.player.name ? `${st.player.name}, ממשיכים לזנק.` : 'ממשיכים לזנק.' }),
        h('p', { class: 'lead', text: Z.TIERS[ti].desc + (next ? ` ההתפתחות הבאה (${next.name}) ברמה ${next.from}.` : '') }),
        h('div', { class: 'xp-row' },
          h('span', { class: 'xpbar' }, h('span', { class: 'xpfill', style: { width: (li.pct * 100).toFixed(1) + '%' } })),
          h('span', { class: 'xp-num', text: `${li.into} / ${li.need} XP` })),
        h('p', { class: 'fineprint', text: 'XP מגיע רק משליטה: שאלות קשות שוות יותר, ותשובה נכונה אחרי טעות שווה הרבה פחות.' })));

    const fileIn = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', id: 'pack-file', onchange: (e) => importPack(e.target) });
    const head = h('div', { class: 'section-head' },
      h('h2', { text: 'העולמות שלך' }),
      h('div', { class: 'row gap' },
        h('button', { class: 'btn btn-ghost', onclick: showHowTo }, icon('help', 18), 'איך מוסיפים חומר'),
        h('button', { class: 'btn btn-primary', onclick: () => fileIn.click() }, icon('upload', 18), 'ייבוא חבילה'), fileIn));

    const grid = h('div', { class: 'worlds' });
    const packs = Z.packs();
    packs.forEach((p, i) => grid.appendChild(worldCard(p, i)));
    if (packs.filter((p) => !p.isDemo).length === 0) {
      grid.appendChild(h('button', { class: 'world-card empty glass', onclick: showHowTo },
        h('span', { class: 'empty-icon' }, icon('book', 28)),
        h('b', { text: 'העולם הראשון שלך מחכה' }),
        h('span', { class: 'muted', text: 'שים חומר בתיקיית materials, בקש מ־Claude ״תוסיף חומר״, ואז ייבא את החבילה.' })));
    }

    const backupNag = needsBackupNag() ? h('div', { class: 'nag glass' }, icon('shield', 20),
      h('span', { text: 'לא גיבית כבר זמן מה. ההתקדמות שמורה רק בדפדפן הזה — שווה להוריד קובץ גיבוי.' }),
      h('button', { class: 'btn btn-sm', onclick: () => go('data') }, 'לגיבוי')) : null;

    append(v, [hero, backupNag, head, grid]);
  }

  function needsBackupNag() {
    const st = Z.state;
    const hasProgress = st.player.xp > 60;
    return hasProgress && Date.now() - (st.lastBackup || 0) > 7 * 86400000;
  }

  function worldCard(p, i) {
    const pm = Z.packMastery(p);
    const pr = Z.prog(p.id);
    const done = p.chapters.filter((c) => pr.chapters[c.id] && pr.chapters[c.id].done).length;
    const bs = Z.bossStatus(p);
    return h('button', { class: 'world-card glass', style: { '--i': i }, onclick: () => go('world', p.id) },
      h('div', { class: 'wc-top' },
        p.isDemo ? h('span', { class: 'pill pill-demo', text: 'דמו' }) : (p.subject ? h('span', { class: 'pill', text: p.subject }) : h('span')),
        bs.beaten ? h('span', { class: 'pill pill-gold' }, icon('crown', 14), h('span', { text: 'נכבש' })) : null),
      h('div', { class: 'wc-main' },
        ring(pm, 64),
        h('div', { class: 'wc-text' },
          h('h3', { text: p.title }),
          h('span', { class: 'muted', text: `${done}/${p.chapters.length} שלבים · ${p.questions.length} שאלות` }))),
      h('div', { class: 'wc-foot' }, countdown(p), h('span', { class: 'muted sm', text: 'הערכת שליטה' })));
  }

  async function importPack(input) {
    const file = input.files && input.files[0];
    input.value = '';
    const r = await V.readJsonFile(file);
    if (!r.ok) return showErrors('לא הצלחתי לקרוא את החבילה', r.errors);
    const v = V.validatePack(r.data);
    if (!v.ok) return showErrors('החבילה פגומה ולא יובאה', v.errors);
    const existed = !!Z.state.packs[v.pack.id];
    if (existed) {
      const ok = await confirmBox('העולם כבר קיים', `יש כבר עולם בשם "${Z.state.packs[v.pack.id].title}". לעדכן את התוכן שלו? ההתקדמות שלך תישמר.`, 'עדכן');
      if (!ok) return;
    }
    Z.addPack(v.pack);
    FX.sfx.levelUp();
    toast(existed ? `העולם "${v.pack.title}" עודכן` : `עולם חדש נפתח: "${v.pack.title}"`);
    go('world', v.pack.id);
  }

  function showErrors(title, errors) {
    modal(title, h('div', {},
      h('p', { text: 'מה מצאתי בקובץ:' }),
      h('ul', { class: 'errlist' }, errors.map((e) => h('li', { text: e }))),
      h('p', { class: 'muted', text: 'כדאי לבקש מ־Claude לבנות את החבילה מחדש עם הפקודה new-material.' })));
  }

  function showHowTo() {
    modal('איך מוסיפים חומר חדש', h('ol', { class: 'steps' },
      h('li', {}, h('b', { text: 'שים את החומר ' }), 'בתיקיית materials שליד המשחק — PDF, DOCX או תמונות של דפים מהמחברת.'),
      h('li', {}, h('b', { text: 'בקש מ־Claude Code ' }), 'בתיקיית הפרויקט: ״תוסיף חומר״ או ', h('code', { text: '/new-material' }), '. כדאי לציין את שם המבחן ואת התאריך.'),
      h('li', {}, h('b', { text: 'Claude בונה חבילה ' }), 'בתיקיית packs — קובץ JSON עם פרקים, נושאים ושאלות מתוך החומר שלך בלבד.'),
      h('li', {}, h('b', { text: 'לחץ ״ייבוא חבילה״ ' }), 'ובחר את הקובץ מתוך packs. נפתח עולם חדש.')),
      [{ label: 'הבנתי', value: true, primary: true }]);
  }

  /* ---------- עולם ---------- */
  function renderWorld(pid) {
    const p = Z.state.packs[pid];
    if (!p) return go('home');
    const v = $view();
    const pm = Z.packMastery(p);
    const bs = Z.bossStatus(p);
    const head = h('section', { class: 'world-head glass' },
      h('button', { class: 'back', onclick: () => go('home'), 'aria-label': 'חזרה לעולמות' }, icon('back', 18), 'עולמות'),
      h('div', { class: 'wh-row' },
        h('div', {},
          p.isDemo ? h('span', { class: 'pill pill-demo', text: 'דמו — חבילה לדוגמה' }) : null,
          h('h1', { class: 'display sm', text: p.title }),
          p.description ? h('p', { class: 'lead', text: p.description }) : null,
          h('div', { class: 'row gap wrap' }, countdown(p))),
        h('div', { class: 'wh-ring' }, ring(pm, 96), h('span', { class: 'muted sm', text: 'הערכת שליטה כוללת' }))),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn btn-primary', onclick: () => runSession(pid, { kind: 'smart' }) }, icon('target', 18), 'אימון חכם'),
        h('span', { class: 'muted sm', text: 'אימון חכם מביא קודם את הנושאים שההערכה שלהם הכי נמוכה.' })));

    const path = h('ol', { class: 'path', 'aria-label': 'שלבים' });
    p.chapters.forEach((c, i) => {
      const open = Z.chapterUnlocked(p, i);
      const cp = Z.prog(pid).chapters[c.id];
      const cm = Z.chapterMastery(p, c);
      path.appendChild(h('li', { class: 'node-wrap', style: { '--i': i } },
        h('button', { class: 'node ' + (open ? (cp && cp.done ? 'done' : 'open') : 'locked'), disabled: !open,
          onclick: () => runSession(pid, { kind: 'stage', chapterId: c.id }),
          'aria-label': `שלב ${i + 1}: ${c.title}${open ? '' : ' — נעול'}` },
          h('span', { class: 'node-orb' }, open ? ring(cm, 58, String(i + 1)) : h('span', { class: 'node-lock' }, icon('lock', 20))),
          h('span', { class: 'node-text' },
            h('b', { text: c.title }),
            h('span', { class: 'muted sm', text: open ? (c.summary || c.topics.map((t) => t.title).join(' · ')) : 'נפתח אחרי שתסיים את השלב הקודם' }),
            open && cp && cp.done ? h('span', { class: 'sm accent', text: `שיא: ${Math.round(cp.best)}% · הערכה ${cm}` }) : null))));
    });
    const bossName = (p.boss && p.boss.name) || 'שומר העולם';
    path.appendChild(h('li', { class: 'node-wrap boss-wrap', style: { '--i': p.chapters.length } },
      h('button', { class: 'node boss ' + (bs.unlocked ? 'open' : 'locked') + (bs.beaten ? ' done' : ''), disabled: !bs.unlocked,
        onclick: () => runBoss(pid), 'aria-label': `בוס: ${bossName}${bs.unlocked ? '' : ' — נעול'}` },
        h('span', { class: 'node-orb boss-orb' }, bs.unlocked ? icon(bs.beaten ? 'crown' : 'swords', 26) : icon('lock', 22)),
        h('span', { class: 'node-text' },
          h('b', { text: 'בוס: ' + bossName }),
          h('span', { class: 'muted sm', text: (p.boss && p.boss.title) || 'הקרב האחרון של העולם' }),
          bs.unlocked ? h('span', { class: 'sm danger', text: bs.beaten ? 'נוצח · אפשר להילחם שוב' : 'מוכן לקרב' }) :
            h('ul', { class: 'reqs' }, bs.reqs.map((r) => h('li', { class: r.ok ? 'ok' : '' }, icon(r.ok ? 'check' : 'lock', 14), h('span', { text: r.text }))))))));

    append(v, [head, path]);
  }

  /* ---------- סשן תרגול ---------- */
  const TYPE_LABEL = { mcq: 'אמריקאית', cloze: 'השלמה', tf: 'נכון / לא נכון', explain: 'במילים שלך' };

  function runSession(pid, opts) {
    const p = Z.state.packs[pid];
    const qs = opts.kind === 'stage' ? Z.buildStage(p, opts.chapterId) : Z.buildSmart(p, 10);
    if (!qs.length) return toast('אין עדיין שאלות זמינות כאן', 'bad');
    const chapter = opts.chapterId ? p.chapters.find((c) => c.id === opts.chapterId) : null;
    const idx = Z.topicIndex(p);
    const startMastery = {};
    Object.keys(idx).forEach((t) => { startMastery[t] = Z.mastery(pid, t); });
    const session = { xp: 0, firstOk: 0, n: qs.length, i: 0, touched: new Set() };

    const v = blank();
    document.body.classList.add('in-play');
    const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, qs.map(() => h('span', { class: 'dot' })));
    const counter = h('span', { class: 'muted sm' });
    const top = h('div', { class: 'session-top' },
      h('button', { class: 'icon-btn', 'aria-label': 'יציאה מהשלב', onclick: async () => {
        if (session.i === 0 || await confirmBox('לצאת מהשלב?', 'ה־XP והשליטה שכבר צברת נשמרים. השלב לא יסומן כמושלם.', 'יציאה')) go('world', pid);
      } }, icon('close')),
      h('div', { class: 'session-title' }, h('b', { text: chapter ? chapter.title : 'אימון חכם' }), counter),
      h('div', { class: 'session-xp' }, icon('bolt', 16), h('span', { id: 'sess-xp', text: '0' })));
    const stage = h('div', { class: 'q-stage' });
    append(v, [h('h1', { class: 'sr-only', text: chapter ? chapter.title : 'אימון חכם' }), top, dots, stage]);

    const next = () => {
      if (session.i >= qs.length) return summary();
      counter.textContent = `שאלה ${session.i + 1} מתוך ${qs.length}`;
      [...dots.children].forEach((d, k) => d.classList.toggle('cur', k === session.i));
      const q = qs[session.i];
      stage.textContent = '';
      const card = questionCard(p, q, idx[q.topic], (res) => {
        const r = Z.recordAnswer(p, q, res.score, res.mode, res.bonus);
        session.touched.add(q.topic);
        session.xp += r.xp;
        if (res.score >= 0.6 && res.mode !== 'retry') session.firstOk++;
        dots.children[session.i].classList.add(res.score >= 0.6 ? 'ok' : 'bad');
        document.getElementById('sess-xp').textContent = String(session.xp);
        renderTopbar();
        if (r.xp) floatXp(card, r.xp);
        session.i++;
        const after = () => { if (r.levelAfter > r.levelBefore) levelUp(r.levelBefore, r.levelAfter); };
        return { r, after };
      }, next);
      stage.appendChild(card);
    };

    const summary = () => {
      const acc = Math.round((session.firstOk / session.n) * 100);
      let firstClear = false;
      if (opts.kind === 'stage') firstClear = Z.finishStage(p, opts.chapterId, acc);
      renderTopbar();
      stage.textContent = '';
      dots.remove(); counter.textContent = 'סיכום';
      const rows = [...session.touched].map((t) => {
        const a = startMastery[t], b = Z.mastery(pid, t);
        return h('li', {}, h('span', { text: idx[t].title }),
          h('span', { class: 'delta ' + (b > a ? 'up' : b < a ? 'down' : '') }, h('span', { text: String(a) }), icon('back', 14, 'flip'), h('b', { text: String(b) })));
      });
      const card = h('section', { class: 'summary glass' },
        h('p', { class: 'eyebrow', text: firstClear ? 'שלב הושלם לראשונה' : 'סוף הסבב' }),
        h('h2', { class: 'display sm', text: acc >= 85 ? 'שליטה מרשימה.' : acc >= 60 ? 'התקדמות יפה.' : 'עשית את העבודה הקשה.' }),
        h('div', { class: 'stats-row' },
          stat(acc + '%', 'נכון בניסיון ראשון'), stat('+' + session.xp, 'XP שהרווחת'), stat(String(session.n), 'שאלות')),
        h('h3', { text: 'הערכת שליטה לפי נושא' }),
        h('p', { class: 'muted sm', text: 'הערכה בלבד, מבוססת על התשובות שלך עד עכשיו — לא קביעה על מה שאתה יודע.' }),
        h('ul', { class: 'deltas' }, rows),
        firstClear && opts.kind === 'stage' && p.chapters.findIndex((c) => c.id === opts.chapterId) < p.chapters.length - 1
          ? h('p', { class: 'accent', text: 'השלב הבא נפתח.' }) : null,
        h('div', { class: 'row gap wrap' },
          h('button', { class: 'btn btn-primary', onclick: () => go('world', pid) }, 'חזרה למפה'),
          h('button', { class: 'btn btn-ghost', onclick: () => runSession(pid, opts) }, 'עוד סבב')));
      stage.appendChild(card);
      if (acc >= 60) setTimeout(() => FX.burstAt(card, { n: 60, speed: 9 }), 150);
      live(`סוף הסבב. ${acc} אחוז נכון בניסיון ראשון, ${session.xp} XP.`);
    };

    cleanup = () => { document.onkeydown = null; };
    next();
  }

  function stat(num, label) { return h('div', { class: 'stat' }, h('b', { text: num }), h('span', { class: 'muted sm', text: label })); }

  function floatXp(anchor, xp) {
    const r = anchor.getBoundingClientRect();
    const f = h('div', { class: 'xp-float', text: `+${xp} XP`, style: { left: (r.left + r.width / 2) + 'px', top: (r.top + 24) + 'px' } });
    document.body.appendChild(f);
    FX.sfx.xp();
    setTimeout(() => f.remove(), 1300);
  }

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[֑-ׇ]/g, '')
      .replace(/[״׳"'`.,;:!?()\[\]{}\-–—_/\\]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function clozeMatch(input, answers) {
    const a = norm(input);
    if (!a) return false;
    const strip = (x) => x.replace(/^[הו](?=\S{2})/, '');
    return answers.some((ans) => { const b = norm(ans); return a === b || strip(a) === strip(b); });
  }

  /* כרטיס שאלה. record(res) שומר ומחזיר {r, after}. onNext ממשיך. */
  function questionCard(pack, q, topic, record, onNext) {
    const card = h('article', { class: 'q-card glass' });
    const diff = h('span', { class: 'diff', 'aria-label': 'קושי ' + q.difficulty + ' מתוך 3' }, [1, 2, 3].map((n) => h('i', { class: n <= q.difficulty ? 'on' : '' })));
    append(card, [
      h('div', { class: 'q-meta' },
        h('span', { class: 'pill' }, h('span', { text: TYPE_LABEL[q.type] })),
        q._review ? h('span', { class: 'pill pill-warm', text: 'חזרה על נושא חלש' }) : null,
        h('span', { class: 'muted sm', text: topic.title }), diff)]);

    const area = h('div', { class: 'q-area' });
    const fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
    let finished = false;

    const finish = (res, extraNodes) => {
      if (finished) return; finished = true;
      const { r, after } = record(res);
      const good = res.score >= 0.6;
      if (good) { FX.sfx.correct(); FX.buzz(12); } else { FX.sfx.wrong(); FX.buzz([20, 40, 20]); }
      card.classList.add(good ? 'is-ok' : 'is-bad');
      const nextBtn = h('button', { class: 'btn btn-primary', onclick: () => { document.onkeydown = null; onNext(); } }, 'הבא', icon('back', 18, 'flip'));
      area.querySelectorAll('button, textarea, input').forEach((b) => { if (b.tagName === 'BUTTON') b.disabled = true; else b.readOnly = true; });
      append(fb, [
        h('div', { class: 'fb-head ' + (good ? 'ok' : 'bad') }, icon(good ? 'check' : 'close', 20),
          h('b', { text: res.label || (good ? (res.mode === 'retry' ? 'נכון, בניסיון השני' : 'נכון!') : 'לא הפעם') }),
          r.xp ? h('span', { class: 'pill pill-xp' }, icon('bolt', 13), h('span', { text: '+' + r.xp + ' XP' })) : h('span', { class: 'muted sm', text: 'בלי XP' })),
        extraNodes || null,
        q.explanation ? h('p', { class: 'fb-exp', text: q.explanation }) : null,
        h('p', { class: 'muted sm', text: `הערכת שליטה ב״${topic.title}״: ${r.masteryBefore} ← ${r.masteryAfter}` }),
        h('div', { class: 'row end' }, nextBtn)]);
      fb.classList.add('show');
      setTimeout(() => nextBtn.focus({ preventScroll: true }), 60);
      fb.scrollIntoView({ behavior: FX.reduced() ? 'auto' : 'smooth', block: 'nearest' });
      document.onkeydown = (e) => { if (e.key === 'Enter' && document.activeElement === nextBtn) return; if (e.key === 'Enter' && !/TEXTAREA|INPUT/.test(document.activeElement.tagName)) { e.preventDefault(); nextBtn.click(); } };
      setTimeout(after, 500);
    };

    if (q.type === 'mcq') {
      card.appendChild(h('h2', { class: 'q-prompt', text: q.prompt }));
      const order = Z.shuffle(q.choices.map((c, i) => i));
      let tries = 0;
      const hint = h('p', { class: 'hint', 'aria-live': 'polite' });
      const list = h('div', { class: 'choices' });
      const btns = order.map((ci, k) => h('button', { class: 'choice', onclick: () => pick(ci, btns[k]) },
        h('kbd', { text: String(k + 1) }), h('span', { text: q.choices[ci] })));
      append(list, btns);
      const pick = (ci, b) => {
        if (finished || b.disabled) return;
        if (ci === q.answer) {
          b.classList.add('right');
          btns.forEach((x) => { x.disabled = true; });
          finish({ score: tries === 0 ? 1 : 0.35, mode: tries === 0 ? 'first' : 'retry' });
        } else {
          tries++;
          b.classList.add('wrong'); b.disabled = true;
          FX.sfx.wrong();
          if (tries >= 2 || q.choices.length <= 2) {
            btns.forEach((x, k) => { x.disabled = true; if (order[k] === q.answer) x.classList.add('right'); });
            finish({ score: 0, mode: 'wrong' });
          } else {
            hint.textContent = 'לא מדויק. אפשר לנסות שוב — תשובה נכונה עכשיו שווה הרבה פחות XP.';
            card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
          }
        }
      };
      document.onkeydown = (e) => { const n = parseInt(e.key, 10); if (!finished && n >= 1 && n <= btns.length) btns[n - 1].click(); };
      append(area, [list, hint, h('p', { class: 'kbd-hint', text: 'מקלדת: 1–' + btns.length + ' לבחירה · Enter להמשך' })]);
    }

    if (q.type === 'cloze') {
      const parts = q.prompt.split(V.BLANK_RE);
      const inp = h('input', { class: 'cloze-in', type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'השלמה', size: 10 });
      card.appendChild(h('h2', { class: 'q-prompt' }, h('span', { text: parts[0] }), inp, h('span', { text: parts.slice(1).join('___') })));
      let tries = 0;
      const hint = h('p', { class: 'hint', 'aria-live': 'polite' });
      const check = () => {
        if (finished) return;
        if (!inp.value.trim()) { inp.focus(); return; }
        if (clozeMatch(inp.value, q.answers)) {
          inp.classList.add('right'); inp.readOnly = true;
          finish({ score: tries === 0 ? 1 : 0.35, mode: tries === 0 ? 'first' : 'retry' });
        } else {
          tries++;
          inp.classList.remove('wrong'); void inp.offsetWidth; inp.classList.add('wrong');
          if (tries >= 2) { inp.readOnly = true; reveal(); }
          else { FX.sfx.wrong(); hint.textContent = `לא בדיוק. רמז: מתחיל ב־״${q.answers[0].trim().charAt(0)}״. ניסיון נוסף שווה פחות XP.`; inp.select(); }
        }
      };
      const reveal = () => finish({ score: 0, mode: 'wrong' }, h('p', {}, 'התשובה: ', h('b', { class: 'accent', text: q.answers.join(' / ') })));
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      append(area, [h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn btn-primary', onclick: check }, 'בדיקה'),
        h('button', { class: 'btn btn-ghost', onclick: () => { if (!finished) { inp.readOnly = true; reveal(); } } }, 'לא יודע')), hint]);
      setTimeout(() => inp.focus(), 80);
    }

    if (q.type === 'tf') {
      card.appendChild(h('h2', { class: 'q-prompt', text: q.prompt }));
      const yes = h('button', { class: 'choice tf', onclick: () => pick(true, yes) }, icon('check', 20), h('span', { text: 'נכון' }));
      const no = h('button', { class: 'choice tf', onclick: () => pick(false, no) }, icon('close', 20), h('span', { text: 'לא נכון' }));
      const pick = (val, b) => {
        if (finished) return;
        yes.disabled = no.disabled = true;
        const right = val === q.answer;
        b.classList.add(right ? 'right' : 'wrong');
        if (!right) {
          (q.answer ? yes : no).classList.add('right');
          return finish({ score: 0, mode: 'wrong' }, q.answer ? null : h('p', {}, 'הניסוח הנכון: ', h('b', { class: 'accent', text: q.correction })));
        }
        if (q.answer) return finish({ score: 1, mode: 'first' });
        // המשפט שגוי והשחקן זיהה — שלב תיקון
        FX.sfx.correct();
        const ta = h('textarea', { class: 'answer-ta', rows: 2, placeholder: 'כתוב את המשפט הנכון…', 'aria-label': 'התיקון שלך' });
        const step = h('div', { class: 'tf-fix' },
          h('p', {}, h('b', { text: 'נכון, המשפט שגוי. ' }), 'עכשיו תקן אותו — בונוס XP אם התיקון שלך מדויק.'),
          ta,
          h('div', { class: 'row gap wrap' },
            h('button', { class: 'btn btn-primary', onclick: () => showFix(true) }, 'הצג תיקון'),
            h('button', { class: 'btn btn-ghost', onclick: () => showFix(false) }, 'דלג')));
        area.appendChild(step);
        setTimeout(() => ta.focus(), 60);
        const showFix = (tried) => {
          step.textContent = '';
          const mine = ta.value.trim();
          append(step, [
            mine ? h('p', { class: 'mine' }, h('span', { class: 'muted sm', text: 'התיקון שלך: ' }), h('span', { text: mine })) : null,
            h('p', {}, h('span', { class: 'muted sm', text: 'התיקון מהחומר: ' }), h('b', { class: 'accent', text: q.correction }))]);
          if (!tried || !mine) return finish({ score: 0.85, mode: 'first', label: 'זיהית שהמשפט שגוי' });
          step.appendChild(h('div', { class: 'row gap wrap' },
            h('button', { class: 'btn btn-primary', onclick: () => finish({ score: 1, mode: 'first', bonus: 0.4, label: 'זיהית ותיקנת' }) }, 'התיקון שלי נכון'),
            h('button', { class: 'btn btn-ghost', onclick: () => finish({ score: 0.75, mode: 'first', label: 'זיהית את הטעות' }) }, 'לא בדיוק')));
        };
      };
      area.appendChild(h('div', { class: 'choices two' }, yes, no));
    }

    if (q.type === 'explain') {
      card.appendChild(h('h2', { class: 'q-prompt', text: q.prompt }));
      const ta = h('textarea', { class: 'answer-ta', rows: 5, placeholder: 'כתוב במילים שלך, בלי להציץ…', 'aria-label': 'התשובה שלך' });
      const revealBtn = h('button', { class: 'btn btn-primary', disabled: true, onclick: () => reveal(false) }, 'הצג תשובת מופת');
      ta.addEventListener('input', () => { revealBtn.disabled = ta.value.trim().length < 12; });
      const box = h('div', { class: 'explain' }, ta,
        h('div', { class: 'row gap wrap' }, revealBtn, h('button', { class: 'btn btn-ghost', onclick: () => reveal(true) }, 'אין לי מושג')));
      const reveal = (gaveUp) => {
        ta.readOnly = true;
        box.lastChild.remove();
        box.append(h('div', { class: 'model' }, h('span', { class: 'eyebrow', text: 'תשובת המופת מהחומר' }), h('p', { text: q.model })));
        if (gaveUp) return finish({ score: 0, mode: 'wrong', label: 'קרא את תשובת המופת' });
        box.append(h('p', { class: 'muted sm', text: 'השווה ודרג את עצמך בכנות — ההערכה וה־XP נבנים מזה, ורמאות רק תפגע בך.' }),
          h('div', { class: 'row gap wrap grade' },
            h('button', { class: 'btn btn-ok', onclick: () => finish({ score: 1, mode: 'self', label: 'עניתי את העיקר' }) }, 'עניתי את העיקר'),
            h('button', { class: 'btn btn-ghost', onclick: () => finish({ score: 0.5, mode: 'self', label: 'חלקית' }) }, 'חלקית'),
            h('button', { class: 'btn btn-ghost', onclick: () => finish({ score: 0, mode: 'self', label: 'פספסתי' }) }, 'פספסתי')));
      };
      area.appendChild(box);
      setTimeout(() => ta.focus(), 80);
    }

    card.append(area, fb);
    return card;
  }

  /* ---------- Level up ---------- */
  let luQueue = Promise.resolve();
  function levelUp(from, to) {
    luQueue = luQueue.then(() => new Promise((resolve) => {
      const tiFrom = Z.tierIndex(from), tiTo = Z.tierIndex(to);
      const evolved = tiTo > tiFrom;
      const t = Z.TIERS[tiTo];
      const prev = document.activeElement;
      const cont = h('button', { class: 'btn btn-primary btn-lg', onclick: () => close() }, 'יאללה, ממשיכים');
      const wrap = h('div', { class: 'levelup', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'עלית רמה' },
        h('div', { class: 'lu-rays', 'aria-hidden': 'true' }),
        h('div', { class: 'lu-inner' },
          h('p', { class: 'eyebrow', text: evolved ? 'התפתחות!' : 'Level Up' }),
          h('div', { class: 'lu-av' }, FX.avatar(to, 220)),
          h('h2', { class: 'lu-title' }, h('span', { text: 'רמה ' }), h('b', { text: String(to) })),
          h('p', { class: 'lead', text: evolved ? `הפכת ל״${t.name}״. ${t.desc}` : 'הדמות שלך מתחזקת. השליטה שלך עובדת.' }),
          cont));
      const close = () => { wrap.classList.add('out'); setTimeout(() => { wrap.remove(); if (prev && prev.focus) prev.focus({ preventScroll: true }); resolve(); }, 300); };
      wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      document.body.appendChild(wrap);
      FX.sfx.levelUp(); FX.buzz([30, 50, 30, 50, 80]);
      const cx = innerWidth / 2, cy = innerHeight / 2 - 40;
      FX.burst(cx, cy, { n: 120, speed: 12, colors: ['#F5C451', '#7C5CFF', '#22D3EE', '#fff', '#FF6FB5'], life: 90 });
      setTimeout(() => FX.burst(cx, cy, { n: 60, speed: 7, colors: ['#fff', '#F5C451'] }), 260);
      setTimeout(() => cont.focus(), 80);
      renderTopbar();
      live(`עלית לרמה ${to}`);
    }));
  }

  /* ---------- בוס ---------- */
  function runBoss(pid) {
    const p = Z.state.packs[pid];
    const qs = Z.buildBoss(p);
    if (!qs.length) return toast('אין מספיק שאלות לקרב בוס', 'bad');
    const idx = Z.topicIndex(p);
    const need = Math.min(8, Math.ceil(qs.length * 0.75));
    const bossName = (p.boss && p.boss.name) || 'שומר העולם';
    const S = { hp: need, hearts: 3, i: 0, hits: 0, xp: 0, timer: null, over: false };

    const v = blank();
    document.body.classList.add('boss-mode', 'in-play');
    const fig = FX.bossFigure(150);
    const hpFill = h('span', { class: 'hp-fill' });
    const hearts = h('div', { class: 'hearts', 'aria-label': 'חיים' });
    const drawHearts = () => { hearts.textContent = ''; for (let i = 0; i < 3; i++) hearts.appendChild(h('span', { class: 'heart ' + (i < S.hearts ? 'on' : 'off') }, icon('heart', 22))); hearts.setAttribute('aria-label', `${S.hearts} חיים`); };
    drawHearts();
    const timeFill = h('span', { class: 'time-fill' });
    const arena = h('div', { class: 'boss-q' });
    const header = h('section', { class: 'boss-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'ברח מהקרב', onclick: async () => {
        pause();
        if (await confirmBox('לברוח מהקרב?', 'הקרב לא ייחשב. אפשר לחזור בכל זמן.', 'לברוח', true)) { S.over = true; go('world', pid); } else resume();
      } }, icon('close')),
      h('div', { class: 'boss-figwrap' }, fig),
      h('div', { class: 'boss-info' },
        h('h1', { class: 'boss-name', text: bossName }),
        h('div', { class: 'hp', role: 'progressbar', 'aria-label': 'חיי הבוס', 'aria-valuemin': 0, 'aria-valuemax': need, 'aria-valuenow': need }, hpFill),
        h('div', { class: 'row between' }, hearts, h('span', { class: 'muted sm', id: 'boss-count' }))),
      h('div', { class: 'time' }, timeFill));
    append(v, [header, arena]);

    // פתיח מותח
    const intro = h('div', { class: 'boss-intro', role: 'dialog', 'aria-label': 'קרב בוס' },
      h('div', { class: 'bi-inner' },
        FX.bossFigure(200),
        h('p', { class: 'eyebrow danger', text: 'קרב בוס' }),
        h('h2', { class: 'bi-name', text: bossName }),
        h('p', { class: 'lead', text: `${need} פגיעות כדי לנצח. 3 טעויות ואתה בחוץ. השעון רץ.` }),
        h('button', { class: 'btn btn-danger btn-lg', onclick: () => { intro.classList.add('out'); setTimeout(() => { intro.remove(); nextQ(); }, 350); } }, icon('swords', 20), 'להילחם')));
    document.body.appendChild(intro);
    FX.sfx.bossIntro(); FX.buzz([60, 80, 120]);
    setTimeout(() => { const b = intro.querySelector('button'); if (b) b.focus(); }, 100);

    let tLeft = 0, tTotal = 0, paused = false, onTimeout = null;
    const startTimer = (secs, cb) => {
      tLeft = tTotal = secs * 1000; onTimeout = cb;
      clearInterval(S.timer);
      let last = performance.now();
      S.timer = setInterval(() => {
        const now = performance.now(); const dt = now - last; last = now;
        if (paused) return;
        tLeft -= dt;
        timeFill.style.transform = `scaleX(${Math.max(0, tLeft / tTotal)})`;
        header.classList.toggle('urgent', tLeft < 6000);
        if (tLeft < 5000 && Math.floor(tLeft / 1000) !== Math.floor((tLeft + dt) / 1000)) FX.sfx.tick();
        if (tLeft <= 0) { clearInterval(S.timer); onTimeout(); }
      }, 100);
    };
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    cleanup = () => { clearInterval(S.timer); S.over = true; document.onkeydown = null; const i = document.querySelector('.boss-intro'); if (i) i.remove(); };

    const nextQ = () => {
      if (S.over) return;
      if (S.hits >= need) return end(true);
      if (S.hearts <= 0 || S.i >= qs.length) return end(false);
      const q = qs[S.i];
      document.getElementById('boss-count').textContent = `שאלה ${S.i + 1} · ${S.hits}/${need} פגיעות`;
      arena.textContent = '';
      const card = h('article', { class: 'q-card glass boss-card' },
        h('div', { class: 'q-meta' }, h('span', { class: 'pill pill-hot', text: TYPE_LABEL[q.type] }), h('span', { class: 'muted sm', text: idx[q.topic].title })));
      const area = h('div', { class: 'q-area' });
      let answered = false;
      const resolveQ = (ok, revealText) => {
        if (answered) return; answered = true;
        clearInterval(S.timer);
        area.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        area.querySelectorAll('input').forEach((i) => { i.readOnly = true; });
        document.onkeydown = null;
        const r = Z.recordAnswer(p, q, ok ? 1 : 0, ok ? 'first' : 'wrong');
        S.xp += r.xp; S.i++;
        renderTopbar();
        if (ok) {
          S.hits++;
          hpFill.style.transform = `scaleX(${Math.max(0, 1 - S.hits / need)})`;
          header.querySelector('.hp').setAttribute('aria-valuenow', String(need - S.hits));
          fig.classList.remove('hit'); void fig.getBoundingClientRect(); fig.classList.add('hit');
          FX.sfx.bossHit(); FX.buzz(25);
          FX.burstAt(fig, { n: 36, colors: ['#ff3d6e', '#ffb02e', '#fff'], speed: 8 });
          card.classList.add('is-ok');
          if (r.levelAfter > r.levelBefore) levelUp(r.levelBefore, r.levelAfter);
          setTimeout(nextQ, 900);
        } else {
          S.hearts--; drawHearts();
          document.body.classList.remove('hurt'); void document.body.offsetWidth; document.body.classList.add('hurt');
          FX.sfx.hurt(); FX.buzz([40, 30, 80]);
          card.classList.add('is-bad');
          const cont = h('button', { class: 'btn btn-primary', onclick: nextQ }, S.hearts > 0 ? 'המשך לקרב' : 'המשך');
          area.append(h('div', { class: 'feedback show' },
            h('div', { class: 'fb-head bad' }, icon('heart', 18), h('b', { text: revealText === null ? 'נגמר הזמן' : 'הבוס פגע בך' })),
            h('p', {}, 'התשובה הנכונה: ', h('b', { class: 'accent', text: answerText(q) })),
            q.explanation ? h('p', { class: 'fb-exp', text: q.explanation }) : null,
            h('div', { class: 'row end' }, cont)));
          setTimeout(() => cont.focus(), 50);
        }
      };

      if (q.type === 'mcq') {
        card.appendChild(h('h2', { class: 'q-prompt', text: q.prompt }));
        const order = Z.shuffle(q.choices.map((c, i) => i));
        const btns = order.map((ci, k) => h('button', { class: 'choice', onclick: () => {
          if (answered) return;
          btns.forEach((x, j) => { x.disabled = true; if (order[j] === q.answer) x.classList.add('right'); });
          if (ci !== q.answer) btns[k].classList.add('wrong');
          resolveQ(ci === q.answer);
        } }, h('kbd', { text: String(k + 1) }), h('span', { text: q.choices[ci] })));
        area.appendChild(h('div', { class: 'choices' }, btns));
        document.onkeydown = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= btns.length) btns[n - 1].click(); };
      } else if (q.type === 'tf') {
        card.appendChild(h('h2', { class: 'q-prompt', text: q.prompt }));
        const mk = (val, label, ic) => h('button', { class: 'choice tf', onclick: (e) => {
          if (answered) return;
          [...area.querySelectorAll('.choice')].forEach((x) => { x.disabled = true; });
          e.currentTarget.classList.add(val === q.answer ? 'right' : 'wrong');
          resolveQ(val === q.answer);
        } }, icon(ic, 20), h('span', { text: label }));
        area.appendChild(h('div', { class: 'choices two' }, mk(true, 'נכון', 'check'), mk(false, 'לא נכון', 'close')));
      } else {
        const parts = q.prompt.split(V.BLANK_RE);
        const inp = h('input', { class: 'cloze-in', type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'השלמה', size: 10 });
        card.appendChild(h('h2', { class: 'q-prompt' }, h('span', { text: parts[0] }), inp, h('span', { text: parts.slice(1).join('___') })));
        const go2 = () => { if (answered || !inp.value.trim()) return; inp.readOnly = true; const ok = clozeMatch(inp.value, q.answers); inp.classList.add(ok ? 'right' : 'wrong'); resolveQ(ok); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go2(); } });
        area.appendChild(h('div', { class: 'row gap' }, h('button', { class: 'btn btn-danger', onclick: go2 }, icon('swords', 18), 'תקוף')));
        setTimeout(() => inp.focus(), 60);
      }
      card.appendChild(area);
      arena.appendChild(card);
      card.classList.add('drop');
      startTimer(q.type === 'cloze' ? 35 : 25, () => resolveQ(false, null));
    };

    const answerText = (q) => q.type === 'mcq' ? q.choices[q.answer] : q.type === 'tf' ? (q.answer ? 'נכון' : 'לא נכון — ' + q.correction) : q.answers.join(' / ');

    const end = (won) => {
      S.over = true; clearInterval(S.timer); document.onkeydown = null;
      const r = Z.finishBoss(p, won, S.hits);
      renderTopbar();
      arena.textContent = '';
      header.classList.remove('urgent');
      if (won) {
        fig.classList.add('dead');
        FX.sfx.victory(); FX.buzz([50, 50, 50, 50, 200]);
        const go3 = () => FX.burst(innerWidth / 2, innerHeight / 3, { n: 140, speed: 13, colors: ['#F5C451', '#fff', '#FF6FB5', '#22D3EE'], life: 100 });
        go3(); setTimeout(go3, 400);
      }
      const weak = Z.weakestTopics(p, 3);
      arena.appendChild(h('section', { class: 'summary glass ' + (won ? 'won' : 'lost') },
        h('p', { class: 'eyebrow ' + (won ? 'gold' : 'danger'), text: won ? 'ניצחון' : 'הפסד' }),
        h('h2', { class: 'display sm', text: won ? `${bossName} הובס.` : `${bossName} ניצח הפעם.` }),
        h('div', { class: 'stats-row' }, stat(`${S.hits}/${need}`, 'פגיעות'), stat('+' + (S.xp + r.xp), 'XP בקרב')),
        won ? h('p', { class: 'lead', text: r.xp > 50 ? 'כבשת את העולם. הכתר שלך.' : 'ניצחון חוזר — XP קטן, כי כבר הוכחת את זה.' })
          : h('div', {}, h('p', { class: 'lead', text: 'כדאי לחזק את הנושאים האלה ולחזור:' }),
            h('ul', { class: 'deltas' }, weak.map((t) => h('li', {}, h('span', { text: t.title }), h('b', { text: '~' + t.m }))))),
        h('div', { class: 'row gap wrap' },
          h('button', { class: 'btn btn-primary', onclick: () => go('world', pid) }, 'חזרה למפה'),
          won ? null : h('button', { class: 'btn btn-ghost', onclick: () => runSession(pid, { kind: 'smart' }) }, 'אימון חכם'))));
      if (won && r.levelAfter > r.levelBefore) setTimeout(() => levelUp(r.levelBefore, r.levelAfter), 1200);
    };
  }

  /* ---------- סטטיסטיקות ---------- */
  function renderStats() {
    const v = $view();
    const st = Z.state;
    let seen = 0, correct = 0;
    Object.values(st.progress).forEach((p) => Object.values(p.questions).forEach((q) => { seen += q.seen; correct += q.correct; }));
    const li = Z.levelInfo(st.player.xp);
    append(v, [
      h('button', { class: 'back', onclick: () => go('home') }, icon('back', 18), 'בית'),
      h('h1', { class: 'display sm', text: 'איפה אתה עומד' }),
      h('p', { class: 'lead', text: 'כל המספרים כאן הם הערכה בלבד — חישוב מהתשובות שלך לאורך זמן, לא עובדה על מה שאתה יודע. נושא שלא תרגלת כמה ימים יורד קצת, כי גם הזיכרון דועך.' }),
      h('div', { class: 'stats-row glass pad' }, stat(String(li.level), 'רמה'), stat(String(st.player.xp), 'XP כולל'), stat(String(seen), 'תשובות'), stat(seen ? Math.round((correct / seen) * 100) + '%' : '—', 'דיוק כללי')),
    ]);
    Z.packs().forEach((p) => {
      const weak = Z.weakestTopics(p, 3).filter((t) => t.m < 80);
      const sec = h('section', { class: 'stat-world glass' },
        h('div', { class: 'row between wrap' },
          h('div', {}, p.isDemo ? h('span', { class: 'pill pill-demo', text: 'דמו' }) : null, h('h2', { text: p.title })),
          h('div', { class: 'row gap' }, ring(Z.packMastery(p), 56), h('button', { class: 'btn btn-sm', onclick: () => go('world', p.id) }, 'לעולם'))));
      if (weak.length) {
        sec.appendChild(h('div', { class: 'advice' },
          h('div', { class: 'row gap' }, icon('target', 18), h('b', { text: 'כדאי להתאמן על:' })),
          h('div', { class: 'row gap wrap' }, weak.map((t) => h('span', { class: 'pill pill-warm', text: `${t.title} · ~${t.m}` }))),
          h('button', { class: 'btn btn-primary btn-sm', onclick: () => runSession(p.id, { kind: 'smart' }) }, 'אימון חכם על החלשים')));
      }
      const grid = h('div', { class: 'ch-grid' });
      sec.appendChild(grid);
      p.chapters.forEach((c) => {
        grid.appendChild(h('div', { class: 'ch-block' }, h('h3', { class: 'ch-title', text: c.title }), h('ul', { class: 'bars' }, c.topics.map((t) => {
          const m = Z.mastery(p.id, t.id);
          return h('li', {},
            h('div', { class: 'row between' }, h('span', { text: t.title }), h('span', { class: 'muted sm', text: `~${m} · ${Z.confidence(p.id, t.id)}` })),
            h('span', { class: 'bar', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': m, 'aria-label': `הערכת שליטה ב${t.title}` },
              h('span', { class: 'bar-fill ' + (m >= 75 ? 'hi' : m >= 45 ? 'mid' : 'lo'), style: { width: Math.max(2, m) + '%' } })));
        }))));
      });
      v.appendChild(sec);
    });
  }

  /* ---------- גיבוי והגדרות ---------- */
  function renderData() {
    const v = $view();
    const st = Z.state;
    const lb = st.lastBackup ? new Date(st.lastBackup).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'אף פעם';
    const bIn = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', onchange: (e) => restore(e.target) });
    const pIn = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', onchange: (e) => importPack(e.target) });
    const nameIn = h('input', { class: 'text-in', type: 'text', maxlength: 24, value: st.player.name, placeholder: 'איך לקרוא לך?', 'aria-label': 'שם השחקן' });
    nameIn.addEventListener('change', () => { st.player.name = nameIn.value.trim().slice(0, 24); Z.save(); toast('השם נשמר'); });
    const soundBtn = h('button', { class: 'btn btn-ghost', 'aria-pressed': String(st.settings.sound), onclick: () => {
      st.settings.sound = !st.settings.sound; Z.save(); go('data');
    } }, icon(st.settings.sound ? 'soundOn' : 'soundOff', 18), st.settings.sound ? 'סאונד פועל' : 'סאונד כבוי');

    append(v, [
      h('button', { class: 'back', onclick: () => go('home') }, icon('back', 18), 'בית'),
      h('h1', { class: 'display sm', text: 'גיבוי והגדרות' }),
      h('section', { class: 'glass pad stack' },
        h('div', { class: 'row gap' }, icon('shield', 22, 'accent'), h('h2', { text: 'גיבוי ידני' })),
        h('p', { text: 'כל ההתקדמות שלך (XP, רמה, הערכות שליטה והעולמות שייבאת) שמורה רק בדפדפן הזה, ב־localStorage. אם מנקים את נתוני הדפדפן, עוברים למחשב אחר או משתמשים בגלישה בסתר — היא יכולה להימחק.' }),
        h('p', { text: 'לכן שווה מדי פעם (נגיד פעם בשבוע) להוריד קובץ גיבוי ולשמור אותו בצד. אם משהו נמחק — טוענים אותו חזרה וממשיכים בדיוק מאותה נקודה.' }),
        h('p', { class: 'muted sm', text: 'גיבוי אחרון: ' + lb }),
        Z.saveFailed ? h('p', { class: 'danger', text: 'שים לב: השמירה בדפדפן נכשלה. הורד גיבוי עכשיו.' }) : null,
        h('div', { class: 'row gap wrap' },
          h('button', { class: 'btn btn-primary', onclick: download }, icon('download', 18), 'הורדת גיבוי'),
          h('button', { class: 'btn btn-ghost', onclick: () => bIn.click() }, icon('upload', 18), 'טעינת גיבוי'), bIn)),
      h('section', { class: 'glass pad stack' },
        h('h2', { text: 'עולמות' }),
        h('ul', { class: 'pack-list' }, Z.packs().map((p) => h('li', {},
          h('span', {}, p.isDemo ? h('span', { class: 'pill pill-demo', text: 'דמו' }) : null, h('span', { text: ' ' + p.title })),
          h('button', { class: 'icon-btn', 'aria-label': 'מחיקת העולם ' + p.title, title: 'מחיקה', onclick: async () => {
            if (await confirmBox('למחוק את העולם?', `"${p.title}" וכל ההתקדמות בו יימחקו מהדפדפן. ה־XP הכללי נשאר.${p.isDemo ? ' (הדמו יחזור בטעינה הבאה, מאופס.)' : ''}`, 'מחיקה', true)) { Z.removePack(p.id); go('data'); toast('העולם נמחק'); }
          } }, icon('trash', 18))))),
        h('button', { class: 'btn btn-ghost', onclick: () => pIn.click() }, icon('upload', 18), 'ייבוא חבילה'), pIn),
      h('section', { class: 'glass pad stack' },
        h('h2', { text: 'הגדרות' }),
        h('label', { class: 'field' }, h('span', { text: 'השם שלך' }), nameIn),
        soundBtn),
      h('section', { class: 'glass pad stack danger-zone' },
        h('h2', { text: 'איפוס' }),
        h('p', { class: 'muted', text: 'מוחק את כל ההתקדמות והעולמות מהדפדפן. אי אפשר לבטל — הורד גיבוי קודם.' }),
        h('button', { class: 'btn btn-danger', onclick: async () => {
          if (await confirmBox('לאפס הכל?', 'כל ה־XP, הרמות, הערכות השליטה והעולמות יימחקו לצמיתות מהדפדפן הזה.', 'לאפס הכל', true)) { Z.resetAll(); go('home'); toast('הכל אופס'); }
        } }, icon('trash', 18), 'איפוס מלא')),
    ]);
  }

  function download() {
    const blob = new Blob([Z.exportBackup()], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `zinuk-backup-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('קובץ הגיבוי ירד');
    setTimeout(() => go('data'), 300);
  }

  async function restore(input) {
    const file = input.files && input.files[0];
    input.value = '';
    const r = await V.readJsonFile(file);
    if (!r.ok) return showErrors('לא הצלחתי לקרוא את הגיבוי', r.errors);
    const b = V.validateBackup(r.data);
    if (!b.ok) return showErrors('קובץ הגיבוי פגום', b.errors);
    const li = Z.levelInfo(b.state.player.xp);
    if (!await confirmBox('לטעון את הגיבוי?', `בגיבוי: רמה ${li.level}, ${Object.keys(b.state.packs).length} עולמות. ההתקדמות הנוכחית בדפדפן תוחלף בו.`, 'טען גיבוי')) return;
    Z.restoreBackup(b.state);
    toast('הגיבוי נטען');
    go('home');
  }

  /* ---------- פתיחה ---------- */
  function welcome() {
    const nameIn = h('input', { class: 'text-in', type: 'text', maxlength: 24, placeholder: 'השם שלך (לא חובה)', 'aria-label': 'השם שלך' });
    modal('ברוך הבא לזינוק', h('div', { class: 'stack' },
      h('div', { class: 'center' }, FX.avatar(1, 120)),
      h('p', { text: 'זה ניצוץ — הדמות שלך. היא מתחזקת ומשתנה רק כשאתה מוכיח שליטה בחומר.' }),
      h('p', { class: 'muted', text: 'התחל מהעולם המסומן ״דמו״ כדי לראות איך הכל עובד.' }),
      nameIn), [{ label: 'בוא נתחיל', value: true, primary: true }])
      .then(() => { Z.state.player.name = nameIn.value.trim().slice(0, 24); Z.save(); go('home'); });
  }

  function boot() {
    Z.load();
    let firstTime = false;
    try { firstTime = !localStorage.getItem('zinuk.save.v1'); } catch (e) { /* */ }
    Z.save();
    go('home');
    if (firstTime) welcome();
  }

  window.ZUI = { go };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
