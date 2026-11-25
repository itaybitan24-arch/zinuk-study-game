/* זינוק — שמירה, XP, רמות, הערכת שליטה ובחירת שאלות */
(function () {
  'use strict';

  const KEY = 'zinuk.save.v1';
  const DAY = 86400000;

  /* ---------- שמירה ---------- */
  function fresh() {
    return { v: 1, player: { name: '', xp: 0 }, settings: { sound: true }, packs: {}, progress: {}, lastBackup: 0, createdAt: Date.now() };
  }

  let state = fresh();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const r = window.ZValidate.validateBackup({ format: 'zinuk-backup', state: JSON.parse(raw) }, true);
        if (r.ok) state = r.state;
        else localStorage.setItem(KEY + '.unreadable-' + Date.now(), raw); // לא דורסים נתונים שלא הצלחנו לקרוא
      }
    } catch (e) { /* localStorage חסום או פגום — מתחילים נקי */ }
    // חבילת הדמו תמיד נטענת מהגרסה העדכנית
    // חבילות מובנות (דמו + חבילות שהוכנסו לתוכנה) — תמיד בגרסה העדכנית, ההתקדמות נשמרת לפי המזהה
    [window.DEMO_PACK].concat(window.BUILTIN_PACKS || []).forEach((raw) => {
      if (!raw) return;
      const r = window.ZValidate.validatePack(raw);
      if (r.ok) state.packs[r.pack.id] = r.pack;
    });
    return state;
  }

  let saveFailed = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); saveFailed = false; return true; }
    catch (e) { saveFailed = true; return false; }
  }

  function exportBackup() {
    state.lastBackup = Date.now();
    save();
    return JSON.stringify({ format: 'zinuk-backup', version: 1, exportedAt: new Date().toISOString(), state }, null, 1);
  }

  function restoreBackup(newState) { state = newState; load(); save(); }

  function resetAll() { const keep = state.settings; state = fresh(); state.settings = keep; load(); save(); }

  /* ---------- חבילות ---------- */
  function addPack(pack) {
    const existed = !!state.packs[pack.id];
    state.packs[pack.id] = pack;
    prog(pack.id);
    save();
    return existed;
  }
  function removePack(id) { delete state.packs[id]; delete state.progress[id]; save(); }
  function packs() {
    return Object.values(state.packs).sort((a, b) => (a.isDemo - b.isDemo) || (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999));
  }
  function prog(pid) {
    if (!state.progress[pid]) state.progress[pid] = { topics: {}, questions: {}, chapters: {}, boss: { wins: 0, tries: 0, best: 0 } };
    return state.progress[pid];
  }
  function topicIndex(pack) {
    const map = {};
    pack.chapters.forEach((c, ci) => c.topics.forEach((t) => { map[t.id] = { ...t, chapterId: c.id, chapterIndex: ci }; }));
    return map;
  }
  function chapterOfQuestion(pack, q) { return topicIndex(pack)[q.topic].chapterId; }

  function daysLeft(pack) {
    if (!pack.examDate) return null;
    const exam = new Date(pack.examDate + 'T00:00:00');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((exam - now) / DAY);
  }

  /* ---------- רמות ---------- */
  const TIERS = [
    { from: 1, name: 'ניצוץ', desc: 'רק התחלת. כל תשובה מציתה אותך.' },
    { from: 3, name: 'להבה', desc: 'הבעירה תפסה. הטבעת הראשונה נוצרה.' },
    { from: 6, name: 'חוקר', desc: 'הליבה התגבשה לקריסטל.' },
    { from: 10, name: 'שומר ידע', desc: 'כנפי אור צמחו סביבך.' },
    { from: 15, name: 'אגדה', desc: 'כתר של אור. מעטים מגיעים לכאן.' },
  ];
  const needFor = (L) => Math.round(80 + 45 * Math.pow(L - 1, 1.35));
  function levelInfo(xp) {
    let L = 1, rest = xp;
    while (rest >= needFor(L)) { rest -= needFor(L); L++; }
    return { level: L, into: rest, need: needFor(L), pct: rest / needFor(L) };
  }
  function tierIndex(level) { let i = 0; TIERS.forEach((t, k) => { if (level >= t.from) i = k; }); return i; }

  /* ---------- הערכת שליטה ---------- */
  function topicRaw(pid, tid) { return prog(pid).topics[tid] || { m: 0, n: 0, last: 0 }; }
  // הערכה אפקטיבית: ידע שלא תורגל כמה ימים "דוהה" מעט
  function mastery(pid, tid) {
    const t = topicRaw(pid, tid);
    if (!t.n) return 0;
    const days = (Date.now() - t.last) / DAY;
    const fade = days > 3 ? Math.min(0.2, (days - 3) * 0.015) : 0;
    return Math.round(t.m * (1 - fade));
  }
  function packMastery(pack) {
    const ts = Object.keys(topicIndex(pack));
    if (!ts.length) return 0;
    return Math.round(ts.reduce((a, t) => a + mastery(pack.id, t), 0) / ts.length);
  }
  function chapterMastery(pack, ch) {
    return Math.round(ch.topics.reduce((a, t) => a + mastery(pack.id, t.id), 0) / ch.topics.length);
  }
  function confidence(pid, tid) {
    const n = topicRaw(pid, tid).n;
    return n === 0 ? 'אין עדיין נתונים' : n < 4 ? 'הערכה ראשונית' : n < 10 ? 'הערכה סבירה' : 'הערכה יציבה';
  }

  /* ---------- XP ותשובה ---------- */
  const BASE = { 1: 10, 2: 20, 3: 35 };

  /* score: 0..1 — כמה השליטה הוכחה בשאלה הזאת
     mode: 'first' (נכון בניסיון ראשון) | 'retry' (נכון אחרי טעות) | 'wrong' | 'self' (דירוג עצמי) */
  function recordAnswer(pack, q, score, mode, bonusFrac) {
    const p = prog(pack.id);
    const now = Date.now();
    const qs = p.questions[q.id] || { seen: 0, correct: 0, streak: 0, last: 0, lastOk: 0, wrongLast: false };
    const ok = score >= 0.6;

    // XP — רק על שליטה אמיתית
    let xp = 0;
    const base = BASE[q.difficulty] || 10;
    if (mode === 'first') xp = base;
    else if (mode === 'retry') xp = Math.round(base * 0.2);
    else if (mode === 'self') xp = Math.round(base * score);
    if (bonusFrac) xp += Math.round(base * bonusFrac);
    // אותה שאלה שכבר נפתרה נכון ב־20 השעות האחרונות שווה חצי
    if (xp && qs.lastOk && now - qs.lastOk < 20 * 3600000) xp = Math.round(xp * 0.5);

    qs.seen++; qs.last = now;
    if (ok) { qs.correct++; qs.streak++; qs.lastOk = now; qs.wrongLast = false; }
    else { qs.streak = 0; qs.wrongLast = true; }
    p.questions[q.id] = qs;

    // הערכת שליטה — ממוצע נע משוקלל לפי קושי
    const t = p.topics[q.topic] || { m: 0, n: 0, last: 0 };
    const before = mastery(pack.id, q.topic);
    const w = t.n === 0 ? 0.5 : 0.16 + 0.06 * q.difficulty;
    const cur = before; // מתחילים מהערך האפקטיבי (כולל דעיכה)
    const target = 100 * score * (0.75 + 0.125 * q.difficulty); // קושי 3 יכול להביא ל־100+
    t.m = Math.max(0, Math.min(100, cur + w * (Math.min(100, target) - cur)));
    t.n++; t.last = now;
    p.topics[q.topic] = t;

    const r = addXp(xp);
    save();
    return { xp, ...r, masteryBefore: before, masteryAfter: mastery(pack.id, q.topic) };
  }

  function addXp(xp) {
    const before = levelInfo(state.player.xp).level;
    state.player.xp += xp;
    const after = levelInfo(state.player.xp).level;
    return { levelBefore: before, levelAfter: after };
  }

  /* ---------- בחירת שאלות ---------- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function priority(pack, q) {
    const p = prog(pack.id);
    const qs = p.questions[q.id];
    let s = 100 - mastery(pack.id, q.topic);
    if (!qs) s += 35;
    else {
      if (qs.wrongLast) s += 45;
      s -= Math.min(3, qs.streak) * 18;
      const days = (Date.now() - qs.last) / DAY;
      s += Math.min(25, days * 4);
    }
    return s + Math.random() * 22;
  }

  function pickTop(pack, pool, n) {
    return pool.map((q) => ({ q, s: priority(pack, q) })).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.q);
  }

  // שלב: שאלות מהפרק + עד 2 שאלות מנושאים חלשים בפרקים שכבר שוחקו
  function buildStage(pack, chapterId) {
    const idx = topicIndex(pack);
    const inCh = pack.questions.filter((q) => idx[q.topic].chapterId === chapterId);
    // שאלות סימון הן לב התרגול כשיש כאלה: עד 4 בכל סבב
    const marks = pickTop(pack, inCh.filter((q) => q.type === 'mark'), 4);
    const main = marks.concat(pickTop(pack, inCh.filter((q) => q.type !== 'mark'), 8 - marks.length));
    const p = prog(pack.id);
    const weakOther = pack.questions.filter((q) => {
      const ch = idx[q.topic].chapterId;
      return ch !== chapterId && p.chapters[ch] && p.chapters[ch].done && topicRaw(pack.id, q.topic).n > 0 && mastery(pack.id, q.topic) < 55;
    });
    const extra = pickTop(pack, weakOther, 2).map((q) => Object.assign({ _review: true }, q));
    return shuffle(main).concat(extra);
  }

  // אימון חכם: הנושאים הכי חלשים מכל העולם
  function buildSmart(pack, n) {
    const idx = topicIndex(pack);
    const p = prog(pack.id);
    const playable = pack.questions.filter((q) => {
      const ch = idx[q.topic];
      return ch.chapterIndex === 0 || (p.chapters[ch.chapterId] && p.chapters[ch.chapterId].done) || topicRaw(pack.id, q.topic).n > 0;
    });
    return shuffle(pickTop(pack, playable, n || 10));
  }

  function buildBoss(pack) {
    const pool = pack.questions.filter((q) => q.type !== 'explain' && q.type !== 'mark');
    const picked = pool.map((q) => ({ q, s: priority(pack, q) * 0.6 + q.difficulty * 25 + Math.random() * 30 }))
      .sort((a, b) => b.s - a.s).slice(0, 10).map((x) => x.q);
    return shuffle(picked);
  }

  /* ---------- פתיחת שלבים ובוס ---------- */
  function chapterUnlocked(pack, i) {
    if (i === 0) return true;
    const prev = prog(pack.id).chapters[pack.chapters[i - 1].id];
    return !!(prev && prev.done);
  }
  const BOSS_AVG = 65, BOSS_MIN = 40;
  function bossStatus(pack) {
    const p = prog(pack.id);
    const allDone = pack.chapters.every((c) => p.chapters[c.id] && p.chapters[c.id].done);
    const avg = packMastery(pack);
    const tids = Object.keys(topicIndex(pack));
    const min = tids.length ? Math.min(...tids.map((t) => mastery(pack.id, t))) : 0;
    return {
      allDone, avg, min,
      unlocked: allDone && avg >= BOSS_AVG && min >= BOSS_MIN,
      beaten: p.boss.wins > 0,
      reqs: [
        { ok: allDone, text: 'לסיים את כל השלבים לפחות פעם אחת' },
        { ok: avg >= BOSS_AVG, text: `הערכת שליטה ממוצעת של ${BOSS_AVG} ומעלה (עכשיו: ${avg})` },
        { ok: min >= BOSS_MIN, text: `אף נושא לא מתחת ל־${BOSS_MIN} (החלש ביותר: ${min})` },
      ],
    };
  }

  function finishStage(pack, chapterId, acc) {
    const p = prog(pack.id);
    const c = p.chapters[chapterId] || { done: false, best: 0, plays: 0 };
    const first = !c.done;
    c.done = true; c.plays++; c.best = Math.max(c.best, acc);
    p.chapters[chapterId] = c;
    save();
    return first;
  }

  function markLessonSeen(pack, chapterId) {
    const p = prog(pack.id);
    const c = p.chapters[chapterId] || { done: false, best: 0, plays: 0 };
    c.lessonSeen = true;
    p.chapters[chapterId] = c;
    save();
  }

  function finishBoss(pack, won, hits) {
    const p = prog(pack.id);
    p.boss.tries++;
    p.boss.best = Math.max(p.boss.best, hits);
    let xp = 0;
    if (won) { xp = p.boss.wins === 0 ? 150 + 25 * pack.chapters.length : 30; p.boss.wins++; }
    const r = addXp(xp);
    save();
    return { xp, ...r };
  }

  function weakestTopics(pack, n) {
    const idx = topicIndex(pack);
    return Object.values(idx).map((t) => ({ ...t, m: mastery(pack.id, t.id), n: topicRaw(pack.id, t.id).n }))
      .sort((a, b) => a.m - b.m).slice(0, n || 3);
  }

  window.Z = {
    load, save, get state() { return state; }, get saveFailed() { return saveFailed; },
    exportBackup, restoreBackup, resetAll,
    addPack, removePack, packs, prog, topicIndex, chapterOfQuestion, daysLeft,
    TIERS, levelInfo, tierIndex, needFor,
    mastery, packMastery, chapterMastery, confidence, topicRaw,
    recordAnswer, addXp, buildStage, buildSmart, buildBoss,
    chapterUnlocked, bossStatus, finishStage, markLessonSeen, finishBoss, weakestTopics, shuffle,
  };
})();
