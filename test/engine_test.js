global.window = {}; const store = {};
global.localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
const fs = require('fs');
const code = ['core.js', 'engine.js'].map((f) => fs.readFileSync(__dirname + '/../web/js/' + f, 'utf8')).join('\n');
eval(code + '\nglobal.E={S:()=>S,setS:(x)=>{S=x},defaultState,parseGoal,draftFromParse,planGoal,createGoal,occurrencesOn,markDone,undoDone,goalProgress,streak,suggestions,buildReminders,smartSentence,smartChecks,D,setStatus,coachReply,applySuggestion,level};');
E.setS(E.defaultState());
const goals = [
  'می‌خواهم طی ۱۲ ماه زبان انگلیسی‌ام را برای مکالمه بهتر کنم.',
  'می‌خواهم ۱۲ کتاب تا پایان شهریور بخوانم',
  'میخوام ۵ کیلو کم کنم در ۳ ماه',
  '۱۰۰ میلیون تومان پس انداز تا آخر سال',
  'هر روز مدیتیشن کنم',
  'یاد گرفتن پایتون در ۶ ماه روزانه ۴۵ دقیقه',
  'می‌خواهم بیشتر کتاب بخوانم',
  'دویدن ۱۰ کیلومتر تا اردیبهشت',
];
for (const t of goals) {
  const p = E.parseGoal(t);
  const d = E.draftFromParse(p);
  console.log('\n==', t);
  console.log(JSON.stringify({ title: p.title, cat: p.category, sub: p.subtype, num: p.number, unit: p.unit, dir: p.direction, dl: p.deadline, daily: p.dailyMinutes, days: p.days }));
  if (!d.deadline) d.deadline = E.D.add(d.startDate, 90);
  if (d.measure === 'value' && d.startValue == null) { d.startValue = 80; d.targetValue = 75; }
  const pl = E.planGoal(d);
  console.log('feas', pl.feasibility, Math.round(pl.ratio * 100) + '%', 'ms', pl.milestones.length, pl.fixes.map((f) => f.label).join(' | '));
  pl.milestones.slice(0, 2).forEach((m) => console.log('  ', m.title, m.start, m.end, '|', m.actions.map((a) => `${a.title} [${a.minutes}m x${a.target} ${a.rec.type}${a.rec.days ? ':' + a.rec.days.join('') : ''} @${a.time}]`).join(' ; ')));
  console.log('  SMART:', E.smartSentence(d));
}
// lifecycle test
const d = E.draftFromParse(E.parseGoal('۱۲ کتاب تا پایان شهریور بخوانم'));
const g = E.createGoal(d, E.planGoal(d));
const today = E.D.today();
let occ = E.occurrencesOn(today);
console.log('\nToday occs:', occ.map((o) => o.a.title + ' ' + o.status));
const r = E.markDone(occ[0].key);
console.log('done ->', r.xp, 'xp; progress', E.goalProgress(g).toFixed(3), 'streak', E.streak(), 'level', JSON.stringify(E.level()));
E.undoDone(occ[0].key);
console.log('undo -> xp total', E.S().xp.length);
console.log('reminders', E.buildReminders().length, JSON.stringify(E.buildReminders()[0]));
console.log('coach', JSON.stringify(E.coachReply('امروز چه کار کنم')).slice(0, 200));
