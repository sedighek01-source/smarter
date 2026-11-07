/* Goal-to-Action — domain engine: SMART parsing, planning, occurrences, XP, progress, adaptive rules, reminders. */
'use strict';

const CATS = {
  language: { label: 'یادگیری و زبان', icon: '🗣️' },
  reading: { label: 'مطالعه', icon: '📚' },
  health: { label: 'سلامت و ورزش', icon: '💪' },
  finance: { label: 'مالی', icon: '💰' },
  career: { label: 'شغلی و مهارت', icon: '💼' },
  habit: { label: 'عادت شخصی', icon: '🌱' },
  other: { label: 'سایر', icon: '🎯' },
};
const UNIT_HINTS = {
  language: ['ساعت تمرین', 'لغت', 'جلسه'], reading: ['کتاب', 'صفحه'], health: ['کیلوگرم', 'کیلومتر', 'جلسه'],
  finance: ['میلیون تومان', 'هزار تومان'], career: ['دوره', 'پروژه', 'ساعت تمرین'], habit: ['روز', 'جلسه'], other: ['جلسه', 'بار', 'ساعت'],
};
const MISS_REASONS = [
  ['time', 'وقت نداشتم'], ['forgot', 'فراموش کردم'], ['hard', 'سخت یا طولانی بود'],
  ['motivation', 'انگیزه نداشتم'], ['unexpected', 'شرایط پیش‌بینی‌نشده'], ['other', 'سایر'],
];
const XP_RULES = { small: 5, medium: 10, large: 20, milestone: 50, goal: 500, dailyCap: 150, level: 250 };
const sizeOf = (m) => (m <= 10 ? 'small' : m <= 30 ? 'medium' : 'large');
const SIZE_LABEL = { small: 'کوچک', medium: 'متوسط', large: 'بزرگ' };

/* ---------- state ---------- */
let S = null;
const defaultState = () => ({
  v: 1, rev: 0,
  profile: {
    name: '', dailyMinutes: 30, days: [0, 1, 2, 3, 4, 5], times: ['07:30', '13:30', '21:00'],
    quietStart: '22:00', quietEnd: '07:00', maxNotif: 5, checkin: true, checkinTime: '20:00', followUp: true,
    theme: 'system', onboarded: false, createdAt: Date.now(), notifAsked: false,
  },
  goals: [], milestones: [], actions: [], occ: {}, xp: [], sugg: {}, coach: [],
});

let syncTimer = null;
function commit() {
  S.rev += 1;
  Persist.save(S);
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncReminders, 350);
}

const goalById = (id) => S.goals.find((g) => g.id === id);
const msById = (id) => S.milestones.find((m) => m.id === id);
const actById = (id) => S.actions.find((a) => a.id === id);
const msOf = (g) => S.milestones.filter((m) => m.goalId === g.id).sort((a, b) => a.order - b.order);
const actsOfMs = (ms) => S.actions.filter((a) => a.msId === ms.id);
const actsOfGoal = (g) => S.actions.filter((a) => a.goalId === g.id);
const createdDay = (ts) => D.str(new Date(ts));

/* ---------- natural-language goal parsing ---------- */
const NUMWORDS = { 'یک': 1, 'یه': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6, 'شیش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10, 'یازده': 11, 'دوازده': 12 };
const UNITS = ['میلیون تومان', 'میلیارد تومان', 'هزار تومان', 'میلیون', 'تومان', 'کیلوگرم', 'کیلومتر', 'کیلو', 'کتاب', 'صفحه', 'لغت', 'واژه', 'کلمه',
  'ساعت', 'دقیقه', 'جلسه', 'روز', 'بار', 'دوره', 'پروژه', 'درس', 'فصل', 'مقاله', 'پست', 'ویدیو', 'ویدئو', 'نمره', 'درصد', 'قدم', 'لیوان'];
const UNIT_NORM = { 'کیلو': 'کیلوگرم', 'واژه': 'لغت', 'کلمه': 'لغت', 'ویدئو': 'ویدیو', 'میلیون': 'میلیون تومان' };
const CAT_WORDS = {
  language: ['زبان', 'انگلیسی', 'آلمانی', 'فرانسه', 'فرانسوی', 'ترکی', 'عربی', 'اسپانیایی', 'ایتالیایی', 'ژاپنی', 'چینی', 'کره', 'روسی', 'آیلتس', 'تافل', 'مکالمه', 'لغت', 'واژه', 'گرامر', 'speaking'],
  reading: ['کتاب', 'مطالعه', 'بخوانم', 'بخونم', 'خواندن', 'رمان', 'صفحه', 'کتاب‌خوانی'],
  health: ['ورزش', 'وزن', 'کیلو', 'دویدن', 'بدوم', 'پیاده‌روی', 'باشگاه', 'تناسب', 'چربی', 'رژیم', 'لاغر', 'خواب', 'شنا', 'دوچرخه', 'یوگا', 'سلامت', 'کیلومتر', 'تغذیه', 'ماراتن', 'بدنسازی'],
  finance: ['پس‌انداز', 'تومان', 'ریال', 'پول', 'بدهی', 'قسط', 'سرمایه', 'درآمد', 'خرج', 'هزینه', 'وام', 'بودجه', 'دلار'],
  career: ['برنامه‌نویسی', 'کدنویسی', 'مهارت', 'دوره', 'پروژه', 'شغل', 'رزومه', 'ترفیع', 'طراحی', 'پایتون', 'فریلنس', 'مدرک', 'کنکور', 'آزمون', 'استخدام', 'نمونه‌کار', 'جاوا', 'هوش مصنوعی', 'داده', 'حسابداری', 'فتوشاپ', 'اکسل'],
  habit: ['عادت', 'مدیتیشن', 'سیگار', 'ترک', 'صبح زود', 'بیدار', 'ژورنال', 'نوشتن', 'مراقبه', 'شکرگزاری', 'گوشی'],
};
const MONTH_RE = new RegExp('(اول|پایان|آخر|اخر)?\\s*(?:ماه\\s*)?(' + J_MONTHS.join('|') + ')(?:\\s*ماه)?(?:\\s*(\\d{4}))?');

function normText(t) {
  return en(t).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ')
    .replace(/پیاده روی/g, 'پیاده‌روی').replace(/پس انداز/g, 'پس‌انداز').replace(/کتاب خوانی/g, 'کتاب‌خوانی')
    .replace(/برنامه نویسی/g, 'برنامه‌نویسی').replace(/می خواهم/g, 'می‌خواهم').replace(/می خوام/g, 'می‌خوام').trim();
}

function detectCategory(t) {
  let best = 'other', score = 0;
  for (const [cat, words] of Object.entries(CAT_WORDS)) {
    const s = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
    if (s > score) { score = s; best = cat; }
  }
  return best;
}

function addJMonths(dateStr, months) {
  const j = D.j(dateStr);
  let m = j.jm - 1 + months, y = j.jy + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12 + 1;
  return D.fromJ(y, m, Math.min(j.jd, Jalali.monthLength(y, m)));
}

const LIGHT_VERBS = { 'کنم': 'کردن', 'بکنم': 'کردن', 'بگیرم': 'گرفتن', 'بشوم': 'شدن', 'بشم': 'شدن', 'شوم': 'شدن', 'بزنم': 'زدن', 'بدهم': 'دادن', 'بدم': 'دادن', 'بیاورم': 'آوردن', 'بیارم': 'آوردن', 'ببرم': 'بردن', 'بخورم': 'خوردن', 'بدم': 'دادن' };
const SIMPLE_VERBS = { 'بخوانم': 'خواندن', 'بخونم': 'خواندن', 'بدوم': 'دویدن', 'بنویسم': 'نوشتن', 'بروم': 'رفتن', 'برم': 'رفتن', 'برسم': 'رسیدن', 'بسازم': 'ساختن', 'ببینم': 'دیدن', 'بخوابم': 'خوابیدن', 'بیاموزم': 'آموختن', 'بشنوم': 'شنیدن', 'بپزم': 'پختن', 'بپردازم': 'پرداختن', 'بخرم': 'خریدن', 'بنوشم': 'نوشیدن', 'بدانم': 'دانستن', 'بفروشم': 'فروختن' };

function toInfinitiveTitle(s) {
  s = s.replace(/^(?:من\s+)?(?:می[‌ ]?خواهم|میخواهم|می[‌ ]?خوام|میخوام|دوست\s*دارم|قصد\s*دارم|تصمیم\s*دارم|تصمیم\s*گرفتم|باید|هدفم\s*(?:این\s*(?:است|ه)\s*)?)\s*(?:که\s+)?/, '');
  s = s.replace(/[.!؟?،,؛]+$/g, '').trim();
  const w = s.split(' ').filter(Boolean);
  if (!w.length) return s;
  const last = w[w.length - 1];
  let verb = null, rest = w;
  if (SIMPLE_VERBS[last]) { verb = SIMPLE_VERBS[last]; rest = w.slice(0, -1); }
  else if (LIGHT_VERBS[last] && w.length >= 2) { verb = w[w.length - 2] + ' ' + LIGHT_VERBS[last]; rest = w.slice(0, -2); }
  if (!verb) return s;
  rest = rest.filter((x) => x !== 'را');
  return (verb + (rest.length ? ' ' + rest.join(' ') : '')).trim();
}

function parseGoal(text) {
  const today = D.today();
  let t = ' ' + normText(text) + ' ';
  const r = { raw: text, category: detectCategory(t), number: null, unit: '', direction: 'up', deadline: null, deadlineFrom: '', dailyMinutes: null, days: null, subtype: '' };

  // daily time budget ("روزانه ۳۰ دقیقه", "۲ ساعت در روز")
  let m = t.match(/(?:روزانه|هر\s*روز|در\s*روز)\s*(\d+)\s*(دقیقه|ساعت)|(\d+)\s*(دقیقه|ساعت)\s*(?:در\s*روز|روزانه|هر\s*روز)/);
  if (m) {
    const n = +(m[1] || m[3]); const u = m[2] || m[4];
    r.dailyMinutes = clamp(u === 'ساعت' ? n * 60 : n, 5, 240);
    t = t.replace(m[0], ' ');
  }
  // frequency ("هفته‌ای ۳ بار", "۳ روز در هفته")
  m = t.match(/هفته[‌ ]?ای\s*(\d+)\s*(?:بار|روز|جلسه)|(\d+)\s*(?:بار|روز|جلسه)\s*در\s*هفته/);
  if (m) {
    const n = clamp(+(m[1] || m[2]), 1, 7);
    r.days = [[3], [0, 3], [0, 2, 4], [0, 1, 3, 5], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5, 6]][n - 1];
    t = t.replace(m[0], ' ');
  } else if (/هر\s*روز/.test(t)) {
    r.days = [0, 1, 2, 3, 4, 5, 6];
    t = t.replace(/هر\s*روز/, ' ');
  }
  // relative span ("طی ۱۲ ماه", "در یک سال", "۶ ماه آینده")
  m = t.match(/(?:(طی|ظرف|در|تا|برای)\s+)?(\d+|یک|یه|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|یازده|دوازده)\s*(روز|هفته|ماه|سال)(?:\s*(آینده|دیگر|آتی))?/);
  if (m && (m[1] || m[4] || m[3] !== 'روز')) {
    const n = /\d/.test(m[2]) ? +m[2] : NUMWORDS[m[2]];
    if (m[3] === 'ماه') r.deadline = addJMonths(today, n);
    else if (m[3] === 'سال') r.deadline = addJMonths(today, 12 * n);
    else r.deadline = D.add(today, (m[3] === 'هفته' ? 7 : 1) * n);
    r.deadlineFrom = m[0].trim();
    t = t.replace(m[0], ' ');
  }
  // named deadlines
  if (!r.deadline) {
    const jt = D.j(today);
    const seasons = { 'بهار': 3, 'تابستان': 6, 'پاییز': 9, 'پائیز': 9, 'زمستان': 12 };
    if ((m = t.match(/تا\s*(?:پایان|آخر|اخر)\s*(?:امسال|سال)|تا\s*(?:عید|نوروز|سال\s*نو|پایان\s*اسفند)/))) {
      r.deadline = D.endOfJMonth(jt.jy, 12);
    } else if ((m = t.match(/تا\s*(?:پایان|آخر|اخر)?\s*(?:فصل\s*)?(بهار|تابستان|پاییز|پائیز|زمستان)/))) {
      const em = seasons[m[1]]; r.deadline = D.endOfJMonth(em >= jt.jm ? jt.jy : jt.jy + 1, em);
    } else if ((m = t.match(new RegExp('تا\\s*' + MONTH_RE.source)))) {
      const jm = J_MONTHS.indexOf(m[2]) + 1;
      const jy = m[3] ? +m[3] : (jm >= jt.jm ? jt.jy : jt.jy + 1);
      r.deadline = m[1] === 'اول' ? D.fromJ(jy, jm, 1) : D.endOfJMonth(jy, jm);
    }
    if (m) { r.deadlineFrom = m[0].trim(); t = t.replace(m[0], ' '); if (r.deadline <= today) r.deadline = null; }
  }
  // direction
  if (/کم\s*کنم|کاهش|لاغر|کم\s*کردن|کمتر|ترک/.test(t)) r.direction = 'down';
  // target number and unit (skip year-like numbers)
  const numRe = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(' + UNITS.join('|') + ')?', 'g');
  let mm;
  while ((mm = numRe.exec(t))) {
    const n = parseFloat(mm[1]);
    if ((n >= 1300 && n <= 1500) || (n >= 1990 && n <= 2100)) continue;
    r.number = n;
    r.unit = mm[2] ? (UNIT_NORM[mm[2]] || mm[2]) : '';
    if (r.unit === 'میلیون تومان' && r.category === 'other') r.category = 'finance';
    break;
  }
  // subtype for health goals
  if (r.category === 'health') {
    if (/وزن|لاغر|چربی|کیلوگرم/.test(t + r.unit) && r.unit !== 'کیلومتر') r.subtype = 'weight';
    else if (/دویدن|بدوم|ماراتن|کیلومتر/.test(t + r.unit)) r.subtype = 'run';
    else if (/خواب/.test(t)) r.subtype = 'sleep';
  }
  // title
  let title = normText(text);
  if (r.deadlineFrom) title = title.replace(r.deadlineFrom, ' ');
  title = title.replace(/(?:روزانه|هر\s*روز|در\s*روز)\s*\d+\s*(?:دقیقه|ساعت)|\d+\s*(?:دقیقه|ساعت)\s*(?:در\s*روز|روزانه)/, ' ')
    .replace(/هفته[‌ ]?ای\s*\d+\s*(?:بار|روز|جلسه)|\d+\s*(?:بار|روز|جلسه)\s*در\s*هفته/, ' ')
    .replace(/هر\s*روز/, ' ').replace(/\s+/g, ' ').trim();
  let inf = title;
  try { inf = toInfinitiveTitle(title); } catch (e) { /* keep */ }
  r.title = fa(inf || normText(text)).slice(0, 120);
  return r;
}

function draftFromParse(p) {
  const prof = S.profile;
  const today = D.today();
  const d = {
    raw: p.raw, title: p.title, category: p.category, subtype: p.subtype,
    measure: p.number != null ? 'value' : 'actions',
    unit: p.unit || (p.number != null ? (UNIT_HINTS[p.category] || ['واحد'])[0] : ''),
    startValue: 0, targetValue: p.number, delta: null, direction: p.direction,
    dailyMinutes: p.dailyMinutes || prof.dailyMinutes,
    days: p.days ? p.days.slice() : prof.days.slice(),
    constraints: '', why: '', startDate: today, deadline: p.deadline,
    filled: { S: !!p.title, M: p.number != null, A: !!(p.dailyMinutes || p.days), T: !!p.deadline },
  };
  if (p.subtype === 'weight' && p.direction === 'down' && p.number != null) {
    d.delta = p.number; d.targetValue = null; d.startValue = null; d.unit = 'کیلوگرم'; d.filled.M = false;
  }
  return d;
}

/* ---------- planning ---------- */
function countDays(from, to, days) {
  if (to < from) return 0;
  let n = 0;
  for (let d = from; d <= to; d = D.add(d, 1)) if (days.includes(D.wd(d))) n += 1;
  return n;
}
function pickPhases(list, N) {
  if (N >= list.length) return list.slice(0, N);
  if (N === 1) return [list[list.length - 1]];
  return Array.from({ length: N }, (_, i) => list[Math.round((i * (list.length - 1)) / (N - 1))]);
}
const fmtMoney = (v, unit) => {
  if (unit === 'میلیون تومان' && v < 1) return faNum(Math.round(v * 1000 / 10) * 10, 0) + ' هزار تومان';
  return faNum(v, v < 10 ? 1 : 0) + ' ' + unit;
};

const TEMPLATES = {
  reading(c) {
    const d = c.dr, valued = d.measure === 'value' && d.targetValue > d.startValue, isPages = d.unit === 'صفحه';
    const total = valued ? (isPages ? d.targetValue - d.startValue : (d.targetValue - d.startValue) * 250) : null;
    const ppd = total ? Math.ceil(total / Math.max(1, c.activeTotal)) : Math.max(5, Math.floor(c.daily / 1.5 / 5) * 5);
    const phases = pickPhases(['ساختن عادت مطالعه', 'مطالعه منظم', 'افزایش عمق مطالعه', 'مطالعه پیوسته', 'شتاب پایانی', 'جمع‌بندی و مرور'], c.N);
    return {
      need: total ? total * 1.5 : null,
      first: { title: 'انتخاب کتاب اول و گذاشتن آن در دسترس', minutes: 10 },
      milestones: c.wins.map((w, i) => {
        let title = phases[i];
        if (valued) {
          const cum = Math.round(d.startValue + ((d.targetValue - d.startValue) * (i + 1)) / c.N);
          title = isPages ? `رسیدن به ${cum} صفحه` : (i === 0 ? `${cum - d.startValue} کتاب اول` : `رسیدن به ${cum} کتاب`);
        }
        return {
          title, desc: phases[i],
          actions: [
            { kind: 'main', title: `مطالعه ${ppd} صفحه`, minutes: Math.ceil(ppd * 1.5), priority: 2, rate: { per: 1.5, fmt: (n) => `مطالعه ${n} صفحه` } },
            { kind: 'weekly', title: 'نوشتن ۳ نکته از مطالعه این هفته', minutes: 10, priority: 1 },
          ],
        };
      }),
    };
  },
  language(c) {
    const P = [
      ['واژگان و جمله‌های پرکاربرد', [{ kind: 'main', title: 'یادگیری ۱۰ لغت جدید و ساختن یک جمله با هرکدام', minutes: 15, rate: { per: 1.5, fmt: (n) => `یادگیری ${n} لغت جدید و ساختن یک جمله با هرکدام` } }, { kind: 'weekly', title: 'مرور همه لغت‌های این هفته', minutes: 15 }]],
      ['شنیدن و تکرار (Shadowing)', [{ kind: 'main', title: 'شنیدن و تکرار بلند یک پادکست کوتاه', minutes: 15 }, { kind: 'main', title: 'یادگیری ۵ لغت از همان پادکست', minutes: 10 }, { kind: 'weekly', title: 'مرور لغت‌های هفته', minutes: 15 }]],
      ['مکالمه کوتاه', [{ kind: 'main', title: 'صحبت با خودت درباره یک موضوع روزمره و ضبط صدا', minutes: 10 }, { kind: 'main', title: 'شنیدن و تکرار یک ویدیوی کوتاه', minutes: 15 }, { kind: 'weekly', title: 'یک جلسه مکالمه با هم‌تمرین یا معلم', minutes: 30 }]],
      ['مکالمه آزاد', [{ kind: 'main', title: 'توضیح یک موضوع با صدای بلند (مکالمه آزاد)', minutes: 20 }, { kind: 'weekly', title: 'جلسه مکالمه با هم‌تمرین یا معلم', minutes: 30 }]],
      ['تقویت نقاط ضعف', [{ kind: 'main', title: 'تمرین روی اشتباهات رایج از یادداشت‌ها', minutes: 15 }, { kind: 'main', title: 'دیدن یک ویدیوی کوتاه بدون زیرنویس', minutes: 15 }, { kind: 'weekly', title: 'جلسه مکالمه با هم‌تمرین یا معلم', minutes: 30 }]],
      ['سنجش سطح و جمع‌بندی', [{ kind: 'main', title: 'مکالمه آزاد درباره موضوعات سفر و کار', minutes: 20 }, { kind: 'weekly', title: 'مرور اشتباهات رایج', minutes: 15 }, { kind: 'once-end', title: 'آزمون سنجش سطح آنلاین', minutes: 30 }]],
    ];
    const ph = pickPhases(P, c.N);
    return {
      first: { title: 'آماده‌کردن دفترچه لغت یا نصب یک اپ فلش‌کارت', minutes: 10 },
      milestones: c.wins.map((w, i) => ({ title: ph[i][0], desc: ph[i][0], actions: ph[i][1].map((a) => ({ priority: a.kind === 'main' ? 2 : 1, ...a })) })),
    };
  },
  health(c) {
    const d = c.dr, st = d.subtype;
    const valued = d.measure === 'value' && d.targetValue != null && d.startValue != null && d.targetValue !== d.startValue;
    const ramp = (arr, i) => Math.min(arr[Math.min(i, arr.length - 1)], Math.max(10, c.daily));
    let phases, first, mk;
    if (st === 'weight') {
      phases = pickPhases(['شروع آرام و عادت‌سازی', 'افزایش تحرک', 'تثبیت تغذیه سالم', 'تقویت و استمرار', 'حفظ نتیجه', 'جمع‌بندی'], c.N);
      first = { title: 'ثبت وزن فعلی و آماده‌کردن کفش ورزشی', minutes: 5 };
      mk = (i) => {
        const m = ramp([20, 25, 30, 35, 40, 40], i);
        const acts = [{ kind: 'main', title: `پیاده‌روی سریع ${m} دقیقه`, minutes: m, priority: 2 }];
        if (c.daily >= m + 10) acts.push({ kind: 'main', title: 'آماده‌کردن یک وعده سالم برای فردا', minutes: 10, priority: 1 });
        return acts;
      };
    } else if (st === 'run') {
      phases = pickPhases(['پایه‌سازی (پیاده‌روی و دویدن تناوبی)', 'دویدن پیوسته', 'افزایش مسافت', 'افزایش سرعت', 'آمادگی نهایی', 'جمع‌بندی'], c.N);
      first = { title: 'آماده‌کردن کفش و لباس دویدن', minutes: 5 };
      mk = (i) => {
        const m = ramp([15, 20, 25, 30, 35, 40], i);
        return [{ kind: 'main', title: i === 0 ? `${m} دقیقه پیاده‌روی و دویدن تناوبی` : `دویدن آرام ${m} دقیقه`, minutes: m, priority: 2 },
          { kind: 'weekly', title: 'دوی طولانی آخر هفته', minutes: Math.min(60, m + 15), priority: 1 }];
      };
    } else if (st === 'sleep') {
      phases = pickPhases(['ساعت خواب ثابت', 'کاهش صفحه‌نمایش شبانه', 'تثبیت روال خواب'], c.N);
      first = { title: 'تعیین ساعت ثابت خواب و بیداری', minutes: 5 };
      mk = () => [{ kind: 'main', title: 'خاموش کردن گوشی ۳۰ دقیقه قبل از خواب', minutes: 5, priority: 2, time: '22:00' },
        { kind: 'main', title: 'آماده شدن برای خواب در ساعت ثابت', minutes: 10, priority: 2, time: '22:30' },
        { kind: 'weekly', title: 'مرور کیفیت خواب این هفته', minutes: 5, priority: 1 }];
    } else {
      phases = pickPhases(['شروع سبک', 'افزایش تدریجی', 'تقویت', 'تثبیت عادت ورزش', 'چالش نهایی', 'جمع‌بندی'], c.N);
      first = { title: 'انتخاب زمان و مکان ثابت برای ورزش', minutes: 5 };
      const types = ['کششی و تحرک', 'هوازی سبک', 'قدرتی با وزن بدن', 'ترکیبی', 'ترکیبی', 'ترکیبی'];
      mk = (i) => {
        const m = ramp([15, 20, 25, 30, 30, 30], i);
        return [{ kind: 'main', title: `${m} دقیقه ورزش ${types[Math.min(i, 5)]}`, minutes: m, priority: 2 },
          { kind: 'weekly', title: 'یک فعالیت تحرکی تفریحی (کوه، شنا یا دوچرخه)', minutes: 30, priority: 1 }];
      };
    }
    return {
      first,
      milestones: c.wins.map((w, i) => {
        let title = phases[i];
        if (valued) {
          const v = d.startValue + ((d.targetValue - d.startValue) * (i + 1)) / c.N;
          title = `رسیدن به ${faNum(Math.round(v * 2) / 2)} ${d.unit}`;
        }
        return { title, desc: phases[i], actions: mk(i) };
      }),
    };
  },
  finance(c) {
    const d = c.dr, valued = d.measure === 'value' && d.targetValue > d.startValue;
    const weeks = Math.max(1, Math.floor(c.totalDays / 7));
    const per = valued ? (d.targetValue - d.startValue) / weeks : null;
    const phases = pickPhases(['شناخت هزینه‌ها', 'کاهش هزینه‌های غیرضروری', 'پس‌انداز منظم', 'تثبیت و بازبینی', 'شتاب‌گیری', 'جمع‌بندی'], c.N);
    return {
      first: { title: 'باز کردن حساب یا قلک جداگانه برای پس‌انداز', minutes: 10 },
      note: 'امکان‌پذیری مالی این هدف را با درآمد و هزینه‌های واقعی خودت هم بسنج.',
      milestones: c.wins.map((w, i) => {
        const acts = [{ kind: 'main', title: 'ثبت هزینه‌های امروز', minutes: 5, priority: 1 }];
        if (valued) acts.push({ kind: 'weekly', title: `واریز ${fmtMoney(per, d.unit)} به حساب پس‌انداز`, minutes: 5, priority: 3 });
        if (i === 0) acts.push({ kind: 'once-start', title: 'فهرست کردن هزینه‌های ثابت ماهانه', minutes: 20, priority: 2 });
        else acts.push({ kind: 'weekly', title: 'پیدا کردن یک هزینه قابل حذف یا کاهش', minutes: 15, priority: 1 });
        const cum = valued ? d.startValue + ((d.targetValue - d.startValue) * (i + 1)) / c.N : 0;
        return { title: valued ? `رسیدن به ${fmtMoney(cum, d.unit)}` : phases[i], desc: phases[i], actions: acts };
      }),
    };
  },
  career(c) {
    const P = [['مبانی و نقشه یادگیری', 'یک درس از دوره و نوشتن خلاصه', 20], ['تمرین هدفمند', 'تمرین عملی روی مبحث این هفته', 20],
      ['پروژه کوچک', 'کار روی پروژه کوچک', 25], ['پروژه اصلی', 'کار روی پروژه اصلی', 25],
      ['نمونه‌کار و جمع‌بندی', 'تکمیل نمونه‌کار و مستندسازی', 25], ['ارائه و بازخورد', 'دریافت بازخورد و اصلاح کار', 20]];
    const ph = pickPhases(P, c.N);
    return {
      first: { title: 'انتخاب یک دوره یا منبع آموزشی اصلی', minutes: 10 },
      milestones: c.wins.map((w, i) => {
        const acts = [{ kind: 'main', title: ph[i][1], minutes: ph[i][2], priority: 2 }, { kind: 'weekly', title: 'مرور و نوشتن آموخته‌های هفته', minutes: 15, priority: 1 }];
        if (i === c.N - 1) acts.push({ kind: 'once-end', title: 'به‌روزرسانی رزومه یا نمونه‌کار', minutes: 30, priority: 2 });
        return { title: ph[i][0], desc: ph[i][0], actions: acts };
      }),
    };
  },
  habit(c) {
    const subject = c.dr.title;
    const phases = pickPhases(['شروع خیلی کوچک', 'افزایش تدریجی', 'تثبیت عادت', 'حفظ و ادامه', 'حفظ و ادامه', 'جمع‌بندی'], c.N);
    const ramp = [5, 10, 15, 20, 20, 20];
    return {
      first: { title: `تعیین زمان و مکان ثابت برای «${subject}»`, minutes: 5 },
      milestones: c.wins.map((w, i) => {
        const m = Math.min(ramp[Math.min(i, 5)], Math.max(5, c.daily));
        return { title: phases[i], desc: phases[i], actions: [{ kind: 'main', title: `${subject} — ${m} دقیقه`, minutes: m, priority: 2 }, { kind: 'weekly', title: 'مرور هفته: چه چیزی کمک کرد و چه چیزی مانع شد؟', minutes: 5, priority: 1 }] };
      }),
    };
  },
  other(c) {
    const phases = pickPhases(['شروع و آماده‌سازی', 'اجرای منظم', 'شتاب‌گیری', 'تکمیل', 'بازبینی', 'جمع‌بندی'], c.N);
    const m = Math.min(c.daily, 20);
    return {
      first: { title: 'نوشتن اولین قدم کوچک و آماده‌کردن وسایل لازم', minutes: 5 },
      milestones: c.wins.map((w, i) => ({ title: phases[i], desc: phases[i], actions: [{ kind: 'main', title: `کار روی «${c.dr.title}»`, minutes: m, priority: 2 }, { kind: 'weekly', title: 'بازبینی پیشرفت هفته و تعیین قدم بعدی', minutes: 10, priority: 1 }] })),
    };
  },
};

function planGoal(dr) {
  const prof = S.profile;
  const start = dr.startDate, end = dr.deadline;
  const totalDays = D.diff(start, end) + 1;
  const days = dr.days && dr.days.length ? dr.days.slice().sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6];
  const N = clamp(Math.round(totalDays / 45), 3, 6);
  const wins = [];
  for (let i = 0; i < N; i += 1) {
    const s = D.add(start, Math.round((i * totalDays) / N));
    const e = D.add(start, Math.round(((i + 1) * totalDays) / N) - 1);
    wins.push({ start: s, end: e < s ? s : e });
  }
  const activeTotal = countDays(start, end, days);
  const ctx = { dr, days, N, wins, totalDays, activeTotal, daily: dr.dailyMinutes };
  const tpl = (TEMPLATES[dr.category] || TEMPLATES.other)(ctx);
  const times = (prof.times && prof.times.length ? prof.times : ['08:00']).slice().sort();
  const lastDay = days[days.length - 1];
  const recMain = days.length === 7 ? { type: 'daily' } : { type: 'weekly', days };
  const valueGoal = dr.measure === 'value';
  const timeUnit = valueGoal && /ساعت|دقیقه/.test(dr.unit || '');
  const countUnit = valueGoal && /جلسه|بار|^روز$/.test(dr.unit || '');

  // value goals measured in time: daily main minutes follow the total need
  let need = tpl.need != null ? tpl.need : null;
  if (timeUnit && dr.targetValue > dr.startValue) {
    need = (dr.targetValue - dr.startValue) * (/ساعت/.test(dr.unit) ? 60 : 1);
  }
  const intrinsic = need != null;

  const milestones = tpl.milestones.map((ms, i) => {
    const w = wins[i];
    const actions = [];
    const mains = ms.actions.filter((a) => a.kind === 'main');
    const sumMain = mains.reduce((s, a) => s + a.minutes, 0) || 1;
    const targetDaily = timeUnit && need ? Math.ceil(need / Math.max(1, activeTotal)) : null;
    const desired = targetDaily || sumMain;
    // plans with an intrinsic time need may use the whole daily budget; others keep ~25% slack
    const budget = intrinsic ? dr.dailyMinutes : Math.max(5, Math.floor((dr.dailyMinutes * 0.75) / 5) * 5);
    const scaleTo = Math.min(desired, budget) / sumMain;
    let ti = 0;
    for (const a of ms.actions) {
      const x = { title: a.title, minutes: a.minutes, priority: a.priority || 1, kind: 'task', desc: a.desc || '' };
      if (a.kind === 'main') {
        x.minutes = clamp(round5(a.minutes * scaleTo), 5, 60);
        if (a.rate) x.title = a.rate.fmt(Math.max(1, Math.floor(x.minutes / a.rate.per)));
        else if (x.minutes !== a.minutes && a.title.includes(String(a.minutes))) x.title = a.title.replace(String(a.minutes), String(x.minutes));
        x.rec = { ...recMain, days: recMain.days ? recMain.days.slice() : undefined };
        x.target = countDays(w.start, w.end, days);
        x.time = a.time || times[Math.min(ti, times.length - 1)];
        ti += 1;
      } else if (a.kind === 'weekly') {
        x.rec = { type: 'weekly', days: [lastDay] };
        x.target = countDays(w.start, w.end, [lastDay]);
        x.time = times[times.length - 1];
        if (x.target === 0) { x.rec = { type: 'once', date: w.end }; x.target = 1; }
      } else if (a.kind === 'once-start' || a.kind === 'once-end') {
        x.rec = { type: 'once', date: a.kind === 'once-start' ? w.start : w.end };
        x.target = 1;
        x.time = times[0];
      }
      x.minutes = clamp(x.minutes, 5, 60);
      if (x.target > 0) actions.push(x);
    }
    if (countUnit && dr.targetValue > dr.startValue && actions.length) {
      const share = countDays(w.start, w.end, days) / Math.max(1, activeTotal);
      actions[0].target = Math.min(actions[0].target, Math.max(1, Math.round((dr.targetValue - dr.startValue) * share)));
    }
    if (valueGoal && dr.unit) {
      const logT = countDays(w.start, w.end, [lastDay]);
      actions.push({ title: `ثبت مقدار فعلی (${dr.unit})`, minutes: 5, priority: 1, kind: 'log', rec: logT ? { type: 'weekly', days: [lastDay] } : { type: 'once', date: w.end }, target: logT || 1, time: times[times.length - 1] });
    }
    if (i === 0 && tpl.first) {
      actions.unshift({ title: tpl.first.title, minutes: clamp(tpl.first.minutes, 5, 10), priority: 3, kind: 'task', rec: { type: 'once', date: w.start }, target: 1, time: times[0], first: true });
    }
    return { title: fa(ms.title), desc: ms.desc ? fa(ms.desc) : '', start: w.start, end: w.end, actions: actions.map((a) => ({ ...a, title: fa(a.title) })) };
  });

  const planned = milestones.reduce((s, ms) => s + ms.actions.reduce((t, a) => t + a.minutes * a.target, 0), 0);
  if (need == null) need = planned;
  const capacity = dr.dailyMinutes * activeTotal;
  const ratio = capacity > 0 ? need / capacity : 9;
  const feasibility = ratio <= 0.8 ? 'green' : ratio <= 1 ? 'yellow' : 'red';
  const fixes = [];
  if (feasibility !== 'green') {
    const f = ratio / 0.8;
    fixes.push({ kind: 'deadline', label: 'افزایش مهلت تا ' + D.fmt(D.add(start, Math.ceil(totalDays * f))), value: D.add(start, Math.ceil(totalDays * f)) });
    const mins = Math.min(240, Math.ceil((dr.dailyMinutes * f) / 5) * 5);
    fixes.push({ kind: 'minutes', label: `افزایش زمان روزانه به ${fa(mins)} دقیقه`, value: mins });
    if (valueGoal && dr.targetValue != null && dr.startValue != null) {
      const nt = dr.startValue + (dr.targetValue - dr.startValue) / f;
      const rounded = Math.abs(nt) >= 10 ? Math.round(nt) : Math.round(nt * 10) / 10;
      fixes.push({ kind: 'target', label: `کاهش مقدار هدف به ${faNum(rounded)} ${dr.unit}`, value: rounded });
    }
  }
  return { milestones, need, capacity, ratio, feasibility, fixes, note: tpl.note || '', totalDays, activeTotal };
}

function smartSentence(dr) {
  let s = dr.title;
  if (dr.measure === 'value' && dr.targetValue != null && !s.includes(fa(dr.targetValue))) {
    if (dr.startValue != null && dr.startValue !== 0) s += ` (از ${faNum(dr.startValue)} به ${faNum(dr.targetValue)} ${dr.unit})`;
    else s += ` (${faNum(dr.targetValue)} ${dr.unit})`;
  }
  s += ' تا ' + D.fmt(dr.deadline);
  const n = dr.days.length;
  s += `، با ${fa(dr.dailyMinutes)} دقیقه ${n === 7 ? 'در روز' : `در ${fa(n)} روز هفته`}`;
  return s;
}

function smartChecks(dr, plan) {
  return [
    { k: 'S', label: 'مشخص (Specific)', ok: dr.title.trim().split(' ').length >= 2, val: dr.title },
    { k: 'M', label: 'قابل اندازه‌گیری (Measurable)', ok: dr.measure === 'actions' || (dr.targetValue != null && dr.startValue != null && dr.targetValue !== dr.startValue),
      val: dr.measure === 'value' ? `${faNum(dr.startValue)} ← ${faNum(dr.targetValue)} ${dr.unit}` : 'بر اساس انجام اقدام‌های برنامه' },
    { k: 'A', label: 'دست‌یافتنی (Achievable)', ok: plan.feasibility !== 'red', val: `${fa(Math.round(plan.ratio * 100))}٪ ظرفیت زمانی` },
    { k: 'R', label: 'مرتبط (Relevant)', ok: !!dr.why.trim(), val: dr.why.trim() || 'دلیل اهمیت ثبت نشده (اختیاری)' },
    { k: 'T', label: 'زمان‌دار (Time-bound)', ok: !!dr.deadline, val: `${D.fmt(dr.startDate)} تا ${D.fmt(dr.deadline)}` },
  ];
}

function createGoal(dr, plan) {
  const now = Date.now();
  const g = {
    id: uid(), title: dr.title, raw: dr.raw || '', category: dr.category, subtype: dr.subtype || '', measure: dr.measure,
    unit: dr.unit || '', startValue: dr.measure === 'value' ? Number(dr.startValue) : null,
    currentValue: dr.measure === 'value' ? Number(dr.startValue) : null, targetValue: dr.measure === 'value' ? Number(dr.targetValue) : null,
    startDate: dr.startDate, deadline: dr.deadline, dailyMinutes: dr.dailyMinutes, days: dr.days.slice(), why: dr.why || '',
    constraints: dr.constraints || '', status: 'active', createdAt: now, feasibility: plan.feasibility,
    logs: dr.measure === 'value' ? [{ date: dr.startDate, value: Number(dr.startValue) }] : [],
  };
  S.goals.push(g);
  plan.milestones.forEach((m, i) => {
    const ms = { id: uid(), goalId: g.id, title: m.title, desc: m.desc, start: m.start, end: m.end, order: i, completedAt: null };
    S.milestones.push(ms);
    m.actions.forEach((a) => {
      S.actions.push({
        id: uid(), goalId: g.id, msId: ms.id, title: a.title, desc: a.desc || '', minutes: a.minutes, priority: a.priority, kind: a.kind,
        rec: a.rec, recHist: [], time: a.time, remind: true, target: a.target, status: 'active', createdAt: now, manual: false,
        from: m.start > D.today() ? m.start : D.today(),
      });
    });
  });
  commit();
  return g;
}

/* ---------- occurrences ---------- */
let IDX = null, IDX_REV = -1;
function idx() {
  if (IDX && IDX_REV === S.rev) return IDX;
  const done = {}, movedIn = {}, doneDates = new Set();
  for (const [k, r] of Object.entries(S.occ)) {
    const p = k.lastIndexOf('|'), aid = k.slice(0, p), date = k.slice(p + 1);
    if (r.status === 'done') { done[aid] = (done[aid] || 0) + 1; doneDates.add(date); }
    if (r.movedFrom && r.status !== 'moved') (movedIn[date] = movedIn[date] || []).push(k);
  }
  IDX = { done, movedIn, doneDates }; IDX_REV = S.rev;
  return IDX;
}
const doneCount = (aid) => idx().done[aid] || 0;
const recAt = (a, date) => {
  for (const h of a.recHist || []) if (date <= h.until) return h.rec;
  return a.rec;
};
function ruleMatch(a, date) {
  const g = goalById(a.goalId), ms = msById(a.msId);
  if (!g || !ms) return false;
  if (g.pausedAt && date >= g.pausedAt) return false;
  if ((g.status === 'completed' || g.status === 'archived') && g.endedAt && date > g.endedAt) return false;
  if (a.pausedAt && date >= a.pausedAt) return false;
  const rec = recAt(a, date);
  if (rec.type === 'once') return date === rec.date;
  if (date < ms.start || date > ms.end) return false;
  if (date < (a.from || ms.start)) return false;
  if (rec.type === 'daily') return true;
  return (rec.days || []).includes(D.wd(date));
}
function scheduledOn(a, date) {
  if (!ruleMatch(a, date)) return false;
  if (a.target) {
    const r = S.occ[a.id + '|' + date];
    const done = doneCount(a.id) - (r && r.status === 'done' ? 1 : 0);
    if (done >= a.target) return false;
  }
  return true;
}
function occStatus(key, date) {
  const r = S.occ[key];
  if (r) return r.status === 'snoozed' ? 'pending' : r.status;
  return date < D.today() ? 'missed' : 'pending';
}
function mkOcc(a, date) {
  const key = a.id + '|' + date, r = S.occ[key];
  return { a, date, key, r, status: occStatus(key, date), time: (r && r.time) || a.time, g: goalById(a.goalId), ms: msById(a.msId) };
}
function occurrencesOn(date) {
  const out = [], seen = new Set();
  for (const a of S.actions) {
    if (!scheduledOn(a, date)) continue;
    const r = S.occ[a.id + '|' + date];
    if (r && r.status === 'moved') continue;
    out.push(mkOcc(a, date)); seen.add(a.id);
  }
  for (const k of idx().movedIn[date] || []) {
    const aid = k.slice(0, k.lastIndexOf('|'));
    const a = actById(aid);
    if (a && !seen.has(aid)) { out.push(mkOcc(a, date)); seen.add(aid); }
  }
  return out;
}
const sortOccs = (list) => list.sort((x, y) => {
  const rank = (o) => (o.status === 'pending' ? 0 : o.status === 'done' ? 2 : 1);
  return rank(x) - rank(y) || (y.a.priority - x.a.priority) || String(x.time).localeCompare(String(y.time));
});
function topAction(list) {
  const p = list.filter((o) => o.status === 'pending');
  p.sort((x, y) => (y.a.priority - x.a.priority) || String(x.time).localeCompare(String(y.time)) || String(x.g.deadline).localeCompare(String(y.g.deadline)));
  return p[0] || null;
}
function occByKey(key) {
  const p = key.lastIndexOf('|'), a = actById(key.slice(0, p));
  return a ? mkOcc(a, key.slice(p + 1)) : null;
}

/* ---------- mutations ---------- */
function xpFor(minutes) { return XP_RULES[sizeOf(minutes)]; }
function addXP(ref, src, amt) { if (amt > 0) S.xp.push({ id: uid(), ref, src, amt, day: D.today(), at: Date.now() }); }
function removeXP(ref) { S.xp = S.xp.filter((x) => x.ref !== ref); }
const xpTotal = () => S.xp.reduce((s, x) => s + x.amt, 0);

function markDone(key) {
  const o = occByKey(key);
  if (!o || o.status === 'done') return null;
  const before = goalProgress(o.g);
  S.occ[key] = { ...(o.r || {}), status: 'done', at: Date.now() };
  delete S.occ[key].reason;
  let amt = xpFor(o.a.minutes);
  const notes = [];
  if (o.a.manual && Date.now() - o.a.createdAt < 120000) { amt = 0; notes.push('برای اقدامی که همین حالا ساخته شده XP داده نمی‌شود.'); }
  const todayXP = S.xp.filter((x) => x.src === 'action' && x.day === D.today()).reduce((s, x) => s + x.amt, 0);
  if (amt > 0 && todayXP + amt > XP_RULES.dailyCap) { amt = Math.max(0, XP_RULES.dailyCap - todayXP); notes.push('به سقف XP روزانه رسیدی.'); }
  addXP(key, 'action', amt);
  IDX = null;
  const res = { key, xp: amt, notes, msDone: null, goalDone: false, before, a: o.a, g: o.g };
  checkMilestone(o.ms, res);
  checkGoal(o.g, res);
  res.after = goalProgress(o.g);
  commit();
  return res;
}
function checkMilestone(ms, res) {
  IDX = null;
  if (!ms.completedAt && msProgress(ms) >= 1) {
    ms.completedAt = Date.now(); addXP('ms:' + ms.id, 'milestone', XP_RULES.milestone);
    if (res) { res.msDone = ms; res.xp += XP_RULES.milestone; }
  }
}
function checkGoal(g, res) {
  if (g.status !== 'active') return;
  const reached = g.measure === 'value'
    ? (g.targetValue >= g.startValue ? g.currentValue >= g.targetValue : g.currentValue <= g.targetValue)
    : msOf(g).every((m) => m.completedAt);
  if (reached) {
    g.status = 'completed'; g.endedAt = D.today(); addXP('goal:' + g.id, 'goal', XP_RULES.goal);
    if (res) { res.goalDone = true; res.xp += XP_RULES.goal; }
  }
}
function undoDone(key) {
  const o = occByKey(key);
  if (!o || o.status !== 'done') return;
  delete S.occ[key];
  removeXP(key);
  IDX = null;
  if (o.ms.completedAt && msProgress(o.ms) < 1) { o.ms.completedAt = null; removeXP('ms:' + o.ms.id); }
  if (o.g.status === 'completed' && o.g.measure !== 'value' && !msOf(o.g).every((m) => m.completedAt)) {
    o.g.status = 'active'; delete o.g.endedAt; removeXP('goal:' + o.g.id);
  }
  commit();
}
function snooze(key, minutes) {
  const o = occByKey(key);
  const r = o.r || {};
  const count = (r.snoozes || 0) + 1;
  if (count > 3) return false;
  S.occ[key] = { ...r, status: 'snoozed', until: D.addMin(D.nowHM(), minutes), snoozes: count };
  commit();
  return true;
}
function setStatus(key, status, reason) {
  const o = occByKey(key);
  if (o.status === 'done') { removeXP(key); }
  S.occ[key] = { ...(o.r || {}), status, reason: reason || undefined, at: Date.now() };
  commit();
}
function moveOcc(key, toDate, time) {
  const o = occByKey(key);
  if (toDate === o.date) { S.occ[key] = { ...(o.r || {}), time }; commit(); return true; }
  if (ruleMatch(o.a, toDate) && !(S.occ[o.a.id + '|' + toDate] || {}).status) return false;
  S.occ[key] = { status: 'moved', to: toDate, at: Date.now() };
  S.occ[o.a.id + '|' + toDate] = { status: 'pending', movedFrom: o.date, time: time || o.time };
  commit();
  return true;
}
function logValue(g, value, note) {
  g.currentValue = value;
  g.logs = g.logs || [];
  const today = D.today();
  g.logs = g.logs.filter((l) => l.date !== today);
  g.logs.push({ date: today, value, note: note || '' });
  const res = { goalDone: false, xp: 0 };
  checkGoal(g, res);
  commit();
  return res;
}
function deleteGoal(g) {
  const ids = new Set(actsOfGoal(g).map((a) => a.id));
  S.actions = S.actions.filter((a) => a.goalId !== g.id);
  S.milestones = S.milestones.filter((m) => m.goalId !== g.id);
  S.goals = S.goals.filter((x) => x.id !== g.id);
  for (const k of Object.keys(S.occ)) if (ids.has(k.slice(0, k.lastIndexOf('|')))) { delete S.occ[k]; removeXP(k); }
  S.xp = S.xp.filter((x) => !(x.ref === 'goal:' + g.id));
  commit();
}
function splitAction(a) {
  const done = doneCount(a.id), remaining = Math.max(1, (a.target || 1) - done);
  const half = clamp(round5(a.minutes / 2), 5, 60);
  const today = D.today();
  a.pausedAt = today; a.status = 'split';
  const base = { goalId: a.goalId, msId: a.msId, desc: a.desc, minutes: half, priority: a.priority, kind: a.kind, rec: JSON.parse(JSON.stringify(a.rec)), recHist: [], remind: a.remind, target: remaining, status: 'active', createdAt: Date.now(), manual: false, from: today };
  const t2 = D.addMin(a.time || '18:00', 120);
  S.actions.push({ ...base, id: uid(), title: a.title + ' — بخش ۱', time: a.time });
  S.actions.push({ ...base, id: uid(), title: a.title + ' — بخش ۲', time: t2 > '21:30' ? a.time : t2 });
  commit();
}
function changeRec(a, rec) {
  const today = D.today();
  a.recHist = a.recHist || [];
  a.recHist.push({ until: D.add(today, -1), rec: a.rec });
  a.rec = rec;
  const ms = msById(a.msId);
  if (rec.type !== 'once') {
    const from = today > ms.start ? today : ms.start;
    const days = rec.type === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : rec.days;
    a.target = doneCount(a.id) + countDays(from, ms.end, days);
  } else a.target = Math.max(1, doneCount(a.id) + 1);
}
const recText = (rec) => {
  if (!rec) return '';
  if (rec.type === 'once') return 'یک‌بار، ' + D.rel(rec.date);
  if (rec.type === 'daily') return 'هر روز';
  if (rec.days.length === 7) return 'هر روز';
  if (rec.days.length === 6) return 'هر روز به‌جز ' + WEEKDAYS[[0, 1, 2, 3, 4, 5, 6].find((d) => !rec.days.includes(d))];
  return rec.days.map((d) => WEEKDAYS[d]).join('، ');
};

/* ---------- progress & stats ---------- */
function msProgress(ms) {
  let t = 0, d = 0;
  for (const a of actsOfMs(ms)) {
    if (a.status === 'split') { d += Math.min(doneCount(a.id), a.target || 1); t += Math.min(doneCount(a.id), a.target || 1); continue; }
    const tg = a.target || 1; t += tg; d += Math.min(doneCount(a.id), tg);
  }
  return t ? d / t : 0;
}
function goalProgress(g) {
  if (g.measure === 'value' && g.targetValue != null && g.targetValue !== g.startValue) {
    return clamp((g.currentValue - g.startValue) / (g.targetValue - g.startValue), 0, 1);
  }
  let t = 0, d = 0;
  for (const ms of msOf(g)) {
    const w = actsOfMs(ms).reduce((s, a) => s + (a.target || 1), 0) || 1;
    t += w; d += w * msProgress(ms);
  }
  return t ? d / t : 0;
}
function expectedProgress(g) {
  const total = D.diff(g.startDate, g.deadline) + 1;
  return clamp((D.diff(g.startDate, D.today()) + 1) / total, 0, 1);
}
function currentMilestone(g) { return msOf(g).find((m) => !m.completedAt && m.end >= D.today()) || msOf(g).find((m) => !m.completedAt) || null; }
function goalDoneOccs(g) {
  const ids = new Set(actsOfGoal(g).map((a) => a.id));
  return Object.entries(S.occ).filter(([k, r]) => r.status === 'done' && ids.has(k.slice(0, k.lastIndexOf('|'))));
}
function forecast(g) {
  const today = D.today();
  if (g.status === 'completed') return { done: true };
  const elapsed = D.diff(g.startDate, today) + 1;
  const dones = goalDoneOccs(g);
  if (elapsed < 7 || dones.length < 5) return null;
  const p = goalProgress(g);
  let perDay;
  if (g.measure === 'value' && g.logs && g.logs.length > 1) {
    const from = D.add(today, -14);
    const base = g.logs.filter((l) => l.date <= from).pop() || g.logs[0];
    const days = Math.max(1, D.diff(base.date, today));
    perDay = ((g.currentValue - base.value) / (g.targetValue - g.startValue)) / days;
  } else {
    const total = actsOfGoal(g).reduce((s, a) => s + (a.target || 1), 0) || 1;
    const recent = dones.filter(([k]) => k.slice(k.lastIndexOf('|') + 1) > D.add(today, -14)).length;
    perDay = recent / 14 / total;
  }
  if (!(perDay > 0)) return { stalled: true };
  const date = D.add(today, Math.ceil((1 - p) / perDay));
  return { date, onTime: date <= g.deadline };
}
function dayInfo(date) {
  const list = occurrencesOn(date);
  return { scheduled: list.length, done: list.filter((o) => o.status === 'done').length, skipped: list.filter((o) => o.status === 'skipped').length };
}
function firstDay() {
  if (!S.goals.length) return D.today();
  return S.goals.reduce((m, g) => (createdDay(g.createdAt) < m ? createdDay(g.createdAt) : m), D.today());
}
function streak() {
  const today = D.today(), first = firstDay();
  let s = dayInfo(today).done > 0 ? 1 : 0, freezeAt = null;
  for (let d = D.add(today, -1), guard = 0; d >= first && guard < 400; d = D.add(d, -1), guard += 1) {
    const i = dayInfo(d);
    if (i.done > 0) s += 1;
    else if (i.scheduled === 0 || i.scheduled === i.skipped) continue;
    else if (s > 0 && (freezeAt === null || D.diff(d, freezeAt) >= 7)) freezeAt = d;
    else break;
  }
  return s;
}
const activeDaysCount = () => idx().doneDates.size;
function rateWindow(days) {
  const today = D.today();
  let done = 0, missed = 0;
  for (let i = 1; i <= days; i += 1) {
    const d = D.add(today, -i);
    if (d < firstDay()) break;
    for (const o of occurrencesOn(d)) { if (o.status === 'done') done += 1; else if (o.status === 'missed') missed += 1; }
  }
  for (const o of occurrencesOn(today)) if (o.status === 'done') done += 1;
  return done + missed ? done / (done + missed) : null;
}
const level = () => { const t = xpTotal(); return { level: Math.floor(t / XP_RULES.level) + 1, into: t % XP_RULES.level, total: t }; };

/* ---------- adaptive suggestions ---------- */
function isRejected(id) { const r = S.sugg[id]; return r && r.until && r.until > D.today(); }
function samplesFor(a) {
  const out = [];
  const created = createdDay(a.createdAt);
  for (let d = D.add(D.today(), -1), g = 0; out.length < 7 && g < 60 && d >= created; d = D.add(d, -1), g += 1) {
    if (!scheduledOn(a, d)) continue;
    const key = a.id + '|' + d, st = occStatus(key, d);
    if (st === 'done' || st === 'missed') out.push({ st, reason: (S.occ[key] || {}).reason });
  }
  return out;
}
function scaleTitle(title, factor) {
  return title.replace(/[\d۰-۹]+/, (m) => fa(Math.max(1, Math.round(Number(en(m)) * factor))));
}
function suggestions() {
  const out = [], today = D.today();
  for (const a of S.actions) {
    if (a.status !== 'active' || a.kind === 'log' || a.rec.type === 'once') continue;
    const g = goalById(a.goalId);
    if (!g || g.status !== 'active') continue;
    const sm = samplesFor(a);
    if (sm.length < 4) continue;
    const doneN = sm.filter((s) => s.st === 'done').length, rate = doneN / sm.length;
    const last3 = sm.slice(0, 3).every((s) => s.st === 'missed');
    if (!(last3 || rate < 0.5)) continue;
    const reasons = sm.filter((s) => s.st === 'missed' && s.reason).map((s) => s.reason);
    const timeR = reasons.filter((r) => r === 'time' || r === 'forgot').length;
    const why = `در ${fa(sm.length)} نوبت اخیر ${fa(doneN)} بار انجام شده` + (last3 ? '؛ ۳ نوبت آخر انجام نشده' : '') + '.';
    const daily = a.rec.type === 'daily' || (a.rec.days || []).length >= 6;
    let s = null;
    if (timeR >= 2 && timeR * 2 >= reasons.length) {
      const times = S.profile.times.filter((t) => t !== a.time);
      const nt = times[0] || D.addMin(a.time || '18:00', 120);
      s = { id: 'time:' + a.id, type: 'time', icon: '🕒', title: 'جابه‌جایی ساعت اقدام', before: faTime(a.time), after: faTime(nt), data: { time: nt } };
    } else if (daily && rate < 0.4) {
      s = { id: 'freq:' + a.id, type: 'freq', icon: '📆', title: 'کاهش تعداد دفعات', before: 'هر روز', after: '۳ روز در هفته (شنبه، دوشنبه، چهارشنبه)', data: { days: [0, 2, 4] } };
    } else if (a.minutes > 5) {
      const nm = clamp(round5(a.minutes / 2), 5, 60);
      s = { id: 'shrink:' + a.id, type: 'shrink', icon: '🔽', title: 'کوچک‌کردن اقدام', before: `${a.title} · ${fa(a.minutes)} دقیقه`, after: `${scaleTitle(a.title, nm / a.minutes)} · ${fa(nm)} دقیقه`, data: { minutes: nm, title: scaleTitle(a.title, nm / a.minutes) } };
    }
    if (s && !isRejected(s.id)) out.push({ ...s, actionId: a.id, goalId: g.id, subject: a.title, why });
  }
  const pend = occurrencesOn(today).filter((o) => o.status === 'pending');
  const load = pend.reduce((t, o) => t + o.a.minutes, 0);
  if (load > S.profile.dailyMinutes && pend.length > 1) {
    const victim = pend.slice().sort((x, y) => (x.a.priority - y.a.priority) || (y.a.minutes - x.a.minutes))[0];
    const id = 'over:' + today;
    if (!isRejected(id)) out.push({ id, type: 'overload', icon: '⚖️', title: 'سبک‌کردن برنامه امروز', subject: victim.a.title, why: `برنامه امروز ${fa(load)} دقیقه است، بیشتر از ${fa(S.profile.dailyMinutes)} دقیقه زمان در دسترس تو.`, before: 'امروز', after: 'فردا', data: { key: victim.key } });
  }
  for (const g of S.goals.filter((x) => x.status === 'active')) {
    const el = D.diff(g.startDate, today) + 1;
    if (el < 14) continue;
    const p = goalProgress(g), e = expectedProgress(g);
    if (e - p > 0.2) {
      const total = D.diff(g.startDate, g.deadline) + 1;
      const extra = Math.max(7, Math.round(total * (e - p)));
      const nd = D.add(g.deadline, extra);
      const id = 'extend:' + g.id;
      if (!isRejected(id)) out.push({ id, type: 'extend', icon: '🗓️', title: 'تمدید مهلت هدف', subject: g.title, goalId: g.id, why: `پیشرفت ${fa(Math.round(p * 100))}٪ است در حالی که طبق زمان باید حدود ${fa(Math.round(e * 100))}٪ باشد.`, before: D.fmt(g.deadline), after: D.fmt(nd), data: { deadline: nd } });
    }
  }
  return out;
}
function applySuggestion(s) {
  const a = s.actionId ? actById(s.actionId) : null;
  if (s.type === 'shrink' && a) { a.minutes = s.data.minutes; a.title = s.data.title; }
  else if (s.type === 'time' && a) { a.time = s.data.time; }
  else if (s.type === 'freq' && a) { changeRec(a, { type: 'weekly', days: s.data.days }); }
  else if (s.type === 'overload') { moveOcc(s.data.key, D.add(D.today(), 1)); }
  else if (s.type === 'extend') { extendGoal(goalById(s.goalId), s.data.deadline); }
  S.sugg[s.id] = { status: 'accepted', at: Date.now() };
  commit();
}
function rejectSuggestion(s) { S.sugg[s.id] = { status: 'rejected', until: D.add(D.today(), 7) }; commit(); }
function extendGoal(g, newDeadline) {
  const today = D.today();
  const rem = msOf(g).filter((m) => !m.completedAt && m.end >= today);
  g.deadline = newDeadline;
  if (!rem.length) return;
  const start = rem[0].start, total = D.diff(start, newDeadline) + 1;
  rem.forEach((m, i) => {
    m.start = i === 0 ? start : D.add(start, Math.round((i * total) / rem.length));
    m.end = D.add(start, Math.round(((i + 1) * total) / rem.length) - 1);
    for (const a of actsOfMs(m)) {
      if (a.rec.type === 'once' || a.status !== 'active') continue;
      const from = today > m.start ? today : m.start;
      const days = a.rec.type === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : a.rec.days;
      a.target = doneCount(a.id) + countDays(from, m.end, days);
    }
  });
}

/* ---------- reminders (computed here, scheduled natively) ---------- */
function inQuiet(hm) {
  const { quietStart: qs, quietEnd: qe } = S.profile;
  if (!qs || !qe || qs === qe) return false;
  return qs > qe ? (hm >= qs || hm < qe) : (hm >= qs && hm < qe);
}
function buildReminders() {
  const p = S.profile, items = [], today = D.today(), now = D.nowHM();
  for (let i = 0; i < 7; i += 1) {
    const d = D.add(today, i);
    const pend = occurrencesOn(d).filter((o) => o.status === 'pending');
    const mains = [], follows = [];
    for (const o of pend) {
      if (!o.a.remind || !o.time) continue;
      const time = o.r && o.r.status === 'snoozed' && o.r.until ? o.r.until : o.time;
      if (!(d === today && time <= now) && !inQuiet(time)) {
        mains.push({ id: hash('m' + o.key), date: d, time, kind: 'main', key: o.key, pr: o.a.priority,
          title: `وقت «${o.a.title}» رسیده`, body: `فقط همین یک قدم را شروع کن · ${fa(o.a.minutes)} دقیقه` });
      }
      if (p.followUp && o.a.kind !== 'log') {
        const ft = D.addMin(o.time, 120);
        if (ft <= '21:59' && ft > o.time && !inQuiet(ft) && !(d === today && ft <= now)) {
          follows.push({ id: hash('f' + o.key), date: d, time: ft, kind: 'follow', key: o.key, pr: o.a.priority,
            title: 'هنوز فرصت داری', body: `«${o.a.title}» هنوز مانده. اگر امروز جا نمی‌شود، زمانش را جابه‌جا کن.` });
        }
      }
    }
    mains.sort((x, y) => (y.pr - x.pr) || x.time.localeCompare(y.time));
    let list = mains.slice(0, p.maxNotif);
    let left = p.maxNotif - list.length;
    if (p.checkin && left > 0 && pend.length >= 2 && !(d === today && p.checkinTime <= now) && !inQuiet(p.checkinTime)) {
      list.push({ id: hash('c' + d), date: d, time: p.checkinTime, kind: 'checkin', key: '', count: pend.length,
        title: 'برنامه امروز سنگین شده؟', body: 'چند اقدام هنوز مانده؛ می‌توانیم برنامه را سبک‌تر کنیم.' });
      left -= 1;
    }
    follows.sort((x, y) => y.pr - x.pr);
    list = list.concat(follows.slice(0, Math.max(0, left)));
    list.forEach((x) => { delete x.pr; items.push(x); });
  }
  return items;
}
function syncReminders() {
  if (!Native || !S) return;
  try { Native.syncReminders(JSON.stringify(buildReminders())); } catch (e) { /* ignore */ }
}
function consumeNativeEvents() {
  if (!Native) return 0;
  let evs = [];
  try { evs = JSON.parse(Native.consumeEvents() || '[]'); } catch (e) { evs = []; }
  let n = 0;
  for (const ev of evs) {
    const o = occByKey(ev.key || '');
    if (!o) continue;
    if (ev.type === 'done' && o.status !== 'done') { markDone(ev.key); n += 1; }
    if (ev.type === 'snooze' && o.status === 'pending') { S.occ[ev.key] = { ...(o.r || {}), status: 'snoozed', until: ev.until, snoozes: ((o.r || {}).snoozes || 0) + 1 }; n += 1; }
  }
  if (n) commit();
  return n;
}

/* ---------- rule-based coach ---------- */
function coachReply(text) {
  const t = normText(text);
  const cards = [];
  const active = S.goals.filter((g) => g.status === 'active');
  const has = (re) => re.test(t);
  if (has(/خلاصه|پیشرفت|وضعیت|گزارش|چطور پیش/)) {
    if (!active.length) cards.push({ type: 'text', text: 'هنوز هدف فعالی نداری. یک هدف بنویس تا با هم دقیقش کنیم.' });
    for (const g of active) {
      const p = goalProgress(g), e = expectedProgress(g), f = forecast(g);
      let state = p >= e - 0.05 ? 'طبق برنامه یا جلوتر هستی 👏' : `حدود ${fa(Math.round((e - p) * 100))} واحد درصد عقب‌تر از برنامه‌ای.`;
      if (f && f.date) state += ` با سرعت فعلی حدود ${D.fmt(f.date)} می‌رسی.`;
      cards.push({ type: 'goal', goalId: g.id, text: `${fa(Math.round(p * 100))}٪ پیشرفت — ${state}` });
    }
    cards.push({ type: 'text', text: `Streak فعلی: ${fa(streak())} روز · سطح ${fa(level().level)}` });
    return cards;
  }
  if (has(/عقب|نمی[‌ ]?رسم|سخت|سنگین|وقت ندارم|خسته|انگیزه|تنبل|حوصله/)) {
    const ss = suggestions();
    if (has(/انگیزه|حوصله|تنبل/)) {
      const g = active.find((x) => x.why);
      cards.push({ type: 'text', text: 'طبیعی است. انگیزه بعد از شروع می‌آید، نه قبل از آن. فقط کوچک‌ترین قدم امروز را انجام بده.' + (g ? ` یادت باشد چرا شروع کردی: «${g.why}»` : '') });
    } else cards.push({ type: 'text', text: 'عقب افتادن یعنی برنامه باید با شرایط واقعی تو جور شود، نه اینکه تو مقصری. این پیشنهادها را ببین:' });
    if (ss.length) cards.push({ type: 'suggestions', ids: ss.map((s) => s.id) });
    else cards.push({ type: 'text', text: 'فعلاً الگوی تکراری عدم انجام ندیدم. اگر اقدامی برایت بزرگ است، می‌توانم خردش کنم: بنویس «خرد کن».' });
    const top = topAction(occurrencesOn(D.today()));
    if (top) cards.push({ type: 'occ', key: top.key, text: 'کوچک‌ترین قدم امروز:' });
    return cards;
  }
  if (has(/خرد|کوچک کن|شکستن|تقسیم|بزرگه|بزرگ است/)) {
    const big = S.actions.filter((a) => a.status === 'active' && a.minutes >= 20 && a.kind !== 'log').sort((x, y) => y.minutes - x.minutes).slice(0, 5);
    if (!big.length) cards.push({ type: 'text', text: 'اقدام بزرگی (۲۰ دقیقه یا بیشتر) در برنامه‌ات نیست. همه قدم‌ها به اندازه کافی کوچک‌اند.' });
    else cards.push({ type: 'split', ids: big.map((a) => a.id), text: 'این اقدام‌ها را می‌توانم به دو بخش کوچک‌تر تقسیم کنم:' });
    return cards;
  }
  if (has(/امروز|الان|چه کار|چیکار|چی کار|چکار/)) {
    const list = occurrencesOn(D.today());
    const top = topAction(list);
    if (top) cards.push({ type: 'occ', key: top.key, text: `از ${fa(list.filter((o) => o.status === 'pending').length)} اقدام باقی‌مانده، این یکی از همه مهم‌تر است:` });
    else cards.push({ type: 'text', text: list.length ? 'همه اقدام‌های امروز را انجام دادی. عالی بود! 🎉' : 'امروز اقدامی در برنامه نیست. می‌توانی استراحت کنی یا یک هدف جدید بسازی.' });
    return cards;
  }
  if (t.length >= 6) {
    const p = parseGoal(text);
    const missing = [];
    if (p.number == null) missing.push('معیار موفقیت (یک عدد و واحد)');
    if (!p.deadline) missing.push('مهلت');
    cards.push({ type: 'smart', parsed: p, missing });
    return cards;
  }
  cards.push({ type: 'text', text: 'می‌توانم هدفت را SMART کنم، بگویم امروز چه کنی، برنامه سنگین را سبک کنم یا اقدام بزرگ را خرد کنم. یکی از دکمه‌های پایین را بزن یا هدفت را بنویس.' });
  return cards;
}
