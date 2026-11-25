/* זינוק — בדיקת מבנה של חבילות וגיבויים.
   כל הקלט עובר JSON.parse בלבד, ואז נבנה מחדש לאובייקט נקי עם שדות מוכרים בלבד. */
(function () {
  'use strict';

  const MAX_FILE = 6 * 1024 * 1024;
  const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/i;
  const QID_RE = /^[A-Za-z0-9_.-]{1,64}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const BLANK_RE = /_{3,}/g;
  const TYPES = ['mcq', 'cloze', 'tf', 'explain', 'mark'];
  const ROLES = ['sub', 'conj', 'subject', 'pred', 'clause'];

  /* סימון: tokens = מילים (מילה שמסתיימת ב־~ צמודה למילה הבאה, למשל "ש~").
     marks/tasks מפנים לאינדקסים של מילים; ‎-1 = "הנושא סמוי". */
  function checkIdxList(list, n, allowHidden) {
    return Array.isArray(list) && list.length > 0 && list.length <= 60 &&
      list.every((i) => Number.isInteger(i) && ((i >= 0 && i < n) || (allowHidden && i === -1)));
  }
  function checkTokens(t) {
    return Array.isArray(t) && t.length >= 1 && t.length <= 80 && t.every((w) => isStr(w, 60));
  }
  function checkLesson(lesson, err, where) {
    if (!Array.isArray(lesson) || lesson.length < 1 || lesson.length > 30) return err(`${where}: "lesson" צריך להיות מערך כרטיסים.`);
    lesson.forEach((card, k) => {
      const w = `${where}, כרטיס שיעור ${k + 1}`;
      if (!isObj(card) || !isStr(card.title, 120)) return err(`${w}: חסרה כותרת.`);
      if (card.body != null && (!Array.isArray(card.body) || !card.body.every((b) => typeof b === 'string' && b.length <= 1200))) err(`${w}: "body" צריך להיות רשימת פסקאות.`);
      if (card.example != null) {
        const ex = card.example;
        if (!isObj(ex) || !checkTokens(ex.tokens)) return err(`${w}: דוגמה בלי "tokens".`);
        if (ex.marks != null && (!Array.isArray(ex.marks) || !ex.marks.every((m) => isObj(m) && ROLES.includes(m.role) && checkIdxList(m.idx, ex.tokens.length, true)))) err(`${w}: סימונים לא תקינים בדוגמה.`);
      }
    });
  }

  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isStr = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= (max || 2000);

  function validatePack(raw) {
    const errors = [];
    const err = (m) => { if (errors.length < 12) errors.push(m); };

    if (!isObj(raw)) return { ok: false, errors: ['הקובץ לא מכיל אובייקט JSON של חבילה.'] };
    if (raw.format !== 'zinuk-pack') err('השדה "format" חייב להיות "zinuk-pack".');
    if (raw.version !== 1) err('גרסת החבילה לא נתמכת (צריך version: 1).');
    if (typeof raw.id !== 'string' || !ID_RE.test(raw.id)) err('מזהה החבילה ("id") חסר או לא תקין — רק אותיות לטיניות, ספרות ומקפים.');
    if (!isStr(raw.title, 120)) err('חסר שם למבחן ("title"), או שהוא ארוך מדי.');
    if (raw.subject != null && (typeof raw.subject !== 'string' || raw.subject.length > 80)) err('השדה "subject" לא תקין.');
    if (raw.description != null && typeof raw.description !== 'string') err('השדה "description" לא תקין.');
    if (raw.examDate != null) {
      if (typeof raw.examDate !== 'string' || !DATE_RE.test(raw.examDate) || isNaN(Date.parse(raw.examDate + 'T00:00:00'))) {
        err('תאריך המבחן ("examDate") צריך להיות בפורמט YYYY-MM-DD.');
      }
    }
    if (raw.boss != null && !isObj(raw.boss)) err('השדה "boss" לא תקין.');

    const topicIds = new Set();
    const chapterIds = new Set();
    if (!Array.isArray(raw.chapters) || raw.chapters.length < 1 || raw.chapters.length > 60) {
      err('חייב להיות מערך "chapters" עם פרק אחד לפחות.');
    } else {
      raw.chapters.forEach((c, i) => {
        const where = `פרק ${i + 1}`;
        if (!isObj(c)) return err(`${where}: לא אובייקט.`);
        if (typeof c.id !== 'string' || !QID_RE.test(c.id)) err(`${where}: מזהה לא תקין.`);
        else if (chapterIds.has(c.id)) err(`${where}: המזהה "${c.id}" כפול.`);
        else chapterIds.add(c.id);
        if (!isStr(c.title, 120)) err(`${where}: חסר שם.`);
        if (c.lesson != null) checkLesson(c.lesson, err, where);
        if (!Array.isArray(c.topics) || c.topics.length < 1) return err(`${where}: חייב לפחות נושא אחד.`);
        c.topics.forEach((t, j) => {
          if (!isObj(t) || typeof t.id !== 'string' || !QID_RE.test(t.id) || !isStr(t.title, 120)) {
            err(`${where}, נושא ${j + 1}: חסר מזהה או שם.`);
          } else if (topicIds.has(t.id)) err(`הנושא "${t.id}" מופיע פעמיים.`);
          else topicIds.add(t.id);
        });
      });
    }

    if (!Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 3000) {
      err('חייב להיות מערך "questions" עם שאלה אחת לפחות.');
    } else {
      const qids = new Set();
      raw.questions.forEach((q, i) => {
        const where = `שאלה ${i + 1}`;
        if (!isObj(q)) return err(`${where}: לא אובייקט.`);
        if (typeof q.id !== 'string' || !QID_RE.test(q.id)) err(`${where}: מזהה לא תקין.`);
        else if (qids.has(q.id)) err(`${where}: המזהה "${q.id}" כפול.`);
        else qids.add(q.id);
        if (!topicIds.has(q.topic)) err(`${where}: הנושא "${String(q.topic)}" לא קיים באף פרק.`);
        if (!TYPES.includes(q.type)) return err(`${where}: סוג לא מוכר (mcq / cloze / tf / explain / mark).`);
        if (![1, 2, 3].includes(q.difficulty)) err(`${where}: "difficulty" חייב להיות 1, 2 או 3.`);
        if (!isStr(q.prompt)) err(`${where}: חסר נוסח שאלה.`);
        if (q.explanation != null && typeof q.explanation !== 'string') err(`${where}: הסבר לא תקין.`);
        if (q.type === 'mcq') {
          if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6 || !q.choices.every((c) => isStr(c, 400))) err(`${where}: אמריקאית צריכה 2–6 תשובות טקסט.`);
          else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) err(`${where}: "answer" צריך להיות אינדקס של התשובה הנכונה.`);
        } else if (q.type === 'cloze') {
          const blanks = typeof q.prompt === 'string' ? (q.prompt.match(BLANK_RE) || []).length : 0;
          if (blanks !== 1) err(`${where}: השלמה צריכה בדיוק חור אחד מסומן ___.`);
          if (!Array.isArray(q.answers) || q.answers.length < 1 || !q.answers.every((a) => isStr(a, 120))) err(`${where}: השלמה צריכה רשימת "answers".`);
        } else if (q.type === 'tf') {
          if (typeof q.answer !== 'boolean') err(`${where}: "answer" צריך להיות true או false.`);
          if (q.answer === false && !isStr(q.correction)) err(`${where}: משפט לא נכון צריך "correction".`);
        } else if (q.type === 'explain') {
          if (!isStr(q.model, 4000)) err(`${where}: חסרה תשובת מופת ("model").`);
        } else if (q.type === 'mark') {
          if (!checkTokens(q.tokens)) err(`${where}: סימון צריך "tokens".`);
          else if (!Array.isArray(q.tasks) || q.tasks.length < 1 || q.tasks.length > 10) err(`${where}: סימון צריך 1–10 משימות ("tasks").`);
          else q.tasks.forEach((t, k) => {
            const n = q.tokens.length;
            if (!isObj(t) || !ROLES.includes(t.role)) return err(`${where}, משימה ${k + 1}: תפקיד לא מוכר.`);
            if (!checkIdxList(t.answer, n, t.role === 'subject')) err(`${where}, משימה ${k + 1}: "answer" לא תקין.`);
            if (t.accept != null && (!Array.isArray(t.accept) || !t.accept.every((a) => checkIdxList(a, n, false)))) err(`${where}, משימה ${k + 1}: "accept" לא תקין.`);
            if (t.prompt != null && typeof t.prompt !== 'string') err(`${where}, משימה ${k + 1}: "prompt" לא תקין.`);
            if (t.hidden != null && !isStr(t.hidden, 30)) err(`${where}, משימה ${k + 1}: "hidden" לא תקין.`);
          });
        }
      });
    }

    if (errors.length) return { ok: false, errors };
    return { ok: true, pack: cleanPack(raw) };
  }

  function s(v) { return typeof v === 'string' ? v : ''; }

  function cleanPack(raw) {
    return {
      format: 'zinuk-pack',
      version: 1,
      id: raw.id,
      isDemo: raw.isDemo === true,
      title: s(raw.title).trim(),
      subject: s(raw.subject).trim(),
      description: s(raw.description).trim(),
      examDate: typeof raw.examDate === 'string' ? raw.examDate : null,
      boss: isObj(raw.boss) ? { name: s(raw.boss.name).slice(0, 60), title: s(raw.boss.title).slice(0, 100) } : null,
      chapters: raw.chapters.map((c) => ({
        id: c.id, title: s(c.title), summary: s(c.summary),
        topics: c.topics.map((t) => ({ id: t.id, title: s(t.title) })),
        lesson: Array.isArray(c.lesson) ? c.lesson.map((card) => ({
          title: s(card.title),
          body: Array.isArray(card.body) ? card.body.map(String) : [],
          example: isObj(card.example) ? {
            tokens: card.example.tokens.map(String),
            marks: Array.isArray(card.example.marks) ? card.example.marks.map((m) => ({ role: m.role, idx: m.idx.slice() })) : [],
            hidden: s(card.example.hidden),
            note: s(card.example.note),
          } : null,
        })) : null,
      })),
      questions: raw.questions.map((q) => {
        const o = { id: q.id, topic: q.topic, type: q.type, difficulty: q.difficulty, prompt: s(q.prompt), explanation: s(q.explanation) };
        if (q.type === 'mcq') { o.choices = q.choices.map(String); o.answer = q.answer; }
        if (q.type === 'cloze') o.answers = q.answers.map(String);
        if (q.type === 'tf') { o.answer = q.answer; o.correction = s(q.correction); }
        if (q.type === 'explain') o.model = s(q.model);
        if (q.type === 'mark') {
          o.tokens = q.tokens.map(String);
          o.tasks = q.tasks.map((t) => ({ role: t.role, prompt: s(t.prompt), answer: t.answer.slice(), accept: Array.isArray(t.accept) ? t.accept.map((a) => a.slice()) : [], hidden: s(t.hidden) }));
        }
        return o;
      }),
    };
  }

  function validateBackup(raw, lenient) {
    if (!isObj(raw) || raw.format !== 'zinuk-backup' || !isObj(raw.state)) {
      return { ok: false, errors: ['זה לא קובץ גיבוי של זינוק.'] };
    }
    const st = raw.state;
    if (!isObj(st.packs) || !isObj(st.progress) || !isObj(st.player)) {
      return { ok: false, errors: ['קובץ הגיבוי חסר חלקים (packs / progress / player).'] };
    }
    const packs = {};
    for (const key of Object.keys(st.packs)) {
      const r = validatePack(st.packs[key]);
      if (!r.ok) { if (lenient) continue; return { ok: false, errors: [`חבילה "${key}" בגיבוי פגומה:`].concat(r.errors) }; }
      packs[r.pack.id] = r.pack;
    }
    const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
    const progress = {};
    for (const pid of Object.keys(packs)) {
      const p = st.progress[pid];
      if (!isObj(p)) continue;
      const clean = { topics: {}, questions: {}, chapters: {}, boss: { wins: 0, tries: 0, best: 0 } };
      if (isObj(p.topics)) for (const [k, v] of Object.entries(p.topics)) if (isObj(v)) clean.topics[k] = { m: Math.max(0, Math.min(100, num(v.m, 0))), n: num(v.n, 0), last: num(v.last, 0) };
      if (isObj(p.questions)) for (const [k, v] of Object.entries(p.questions)) if (isObj(v)) clean.questions[k] = { seen: num(v.seen, 0), correct: num(v.correct, 0), streak: num(v.streak, 0), last: num(v.last, 0), lastOk: num(v.lastOk, 0), wrongLast: v.wrongLast === true };
      if (isObj(p.chapters)) for (const [k, v] of Object.entries(p.chapters)) if (isObj(v)) clean.chapters[k] = { done: v.done === true, best: num(v.best, 0), plays: num(v.plays, 0), lessonSeen: v.lessonSeen === true };
      if (isObj(p.boss)) clean.boss = { wins: num(p.boss.wins, 0), tries: num(p.boss.tries, 0), best: num(p.boss.best, 0) };
      progress[pid] = clean;
    }
    return {
      ok: true,
      state: {
        v: 1,
        player: { name: s(st.player.name).slice(0, 24), xp: Math.max(0, num(st.player.xp, 0)) },
        settings: { sound: !(isObj(st.settings) && st.settings.sound === false) },
        packs, progress,
        lastBackup: num(st.lastBackup, 0),
        createdAt: num(st.createdAt, Date.now()),
      },
    };
  }

  function readJsonFile(file) {
    return new Promise((resolve) => {
      if (!file) return resolve({ ok: false, errors: ['לא נבחר קובץ.'] });
      if (file.size > MAX_FILE) return resolve({ ok: false, errors: ['הקובץ גדול מדי.'] });
      const fr = new FileReader();
      fr.onerror = () => resolve({ ok: false, errors: ['לא הצלחתי לקרוא את הקובץ.'] });
      fr.onload = () => {
        try {
          const text = String(fr.result).replace(/^﻿/, '');
          resolve({ ok: true, data: JSON.parse(text) });
        } catch (e) {
          resolve({ ok: false, errors: ['הקובץ הוא לא JSON תקין: ' + e.message] });
        }
      };
      fr.readAsText(file, 'utf-8');
    });
  }

  window.ZValidate = { validatePack, validateBackup, readJsonFile, BLANK_RE, ROLES };
})();
