// בדיקת חבילה מחוץ לדפדפן, עם אותו מאמת שהמשחק משתמש בו.
// שימוש: node .claude/commands/check-pack.js packs/<file>.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = process.argv[2];
if (!file) { console.error('usage: node check-pack.js <pack.json>'); process.exit(2); }
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'validate.js'), 'utf8'), ctx);
let data;
try { data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); }
catch (e) { console.error('JSON לא תקין: ' + e.message); process.exit(1); }
const r = ctx.window.ZValidate.validatePack(data);
if (!r.ok) { console.error('שגיאות:\n- ' + r.errors.join('\n- ')); process.exit(1); }
const p = r.pack;
const types = p.questions.reduce((a, q) => (a[q.type] = (a[q.type] || 0) + 1, a), {});
console.log(`OK · ${p.title} · ${p.chapters.length} פרקים · ${p.questions.length} שאלות · ${JSON.stringify(types)}`);
