/* Goal-to-Action — UI: screens, sheets, events. */
'use strict';

const app = document.getElementById('app');
const IC = {
  today: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18M9 15l2 2 4-4"/>',
  goals: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  coach: '<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  progress: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
  settings: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  back: '<path d="M9 5l7 7-7 7"/>',
  chev: '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  more: '<circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/>',
  skip: '<path d="M6 5v14l9-7zM18 5v14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  send: '<path d="M20 4L3 11l7 2.5L12.5 21z"/><path d="M20 4l-10 9.5"/>',
  split: '<path d="M12 3v6M12 9l-6 6v6M12 9l6 6v6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  undo: '<path d="M9 7H15a5 5 0 0 1 0 10H8"/><path d="M12 4L9 7l3 3"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>',
  font: '<path d="M4 20l6-16h2l6 16M7 14h8"/>',
  down: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
  up: '<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${IC[n] || ''}</svg>`;

/* ---------- small components ---------- */
function ring(p, size = 64, stroke = 7, label, color) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - clamp(p, 0, 1));
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--surface-2)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color || 'url(#gradRing)'}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .6s"/>
  </svg><span class="val" style="font-size:${Math.round(size / 4.3)}px">${label != null ? label : fa(Math.round(p * 100)) + '٪'}</span></div>`;
}
const bar = (p, mark, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(p, 0, 1) * 100}%"></i>${mark != null ? `<span class="mark" style="right:${clamp(mark, 0, 1) * 100}%"></span>` : ''}</div>`;
const pct = (p) => fa(Math.round(clamp(p, 0, 1) * 100)) + '٪';
const topBar = (title, sub = '', opts = {}) => `<header class="top">
  ${opts.noBack ? '' : `<button class="iconbtn" data-a="back" aria-label="بازگشت">${ic('back')}</button>`}
  <div class="titles"><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${opts.right || ''}</header>`;
const STATUS_BADGE = {
  done: '<span class="badge ok">انجام شد</span>', skipped: '<span class="badge warn">رد شد</span>',
  missed: '<span class="badge bad">انجام نشد</span>', moved: '<span class="badge">جابه‌جا شد</span>',
};
const catIcon = (c) => (CATS[c] || CATS.other).icon;
const goalStatusText = (g) => ({ active: 'فعال', paused: 'متوقف', completed: 'تکمیل‌شده', archived: 'بایگانی' }[g.status]);

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2300);
}
function haptic() { try { if (Native) Native.haptic(); else if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* */ } }

/* ---------- navigation ---------- */
const TABS = ['today', 'goals', 'coach', 'progress', 'settings'];
const Nav = {
  stack: [{ name: 'today', params: {} }],
  cur() { return this.stack[this.stack.length - 1]; },
  go(name, params = {}) { this.stack.push({ name, params }); render(); window.scrollTo(0, 0); },
  replace(name, params = {}) { this.stack[this.stack.length - 1] = { name, params }; render(); window.scrollTo(0, 0); },
  tab(name) { this.stack = [{ name, params: {} }]; render(); window.scrollTo(0, 0); },
  back() {
    if (Sheet.isOpen()) { Sheet.close(); return true; }
    if (this.stack.length > 1) { this.stack.pop(); render(); return true; }
    if (this.cur().name !== 'today' && S.profile.onboarded) { this.tab('today'); return true; }
    return false;
  },
};
window.__back = () => Nav.back();

/* ---------- sheets ---------- */
const Sheet = {
  el: null,
  isOpen() { return !!this.el; },
  open(html) {
    this.close();
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="backdrop" data-a="closeSheet"></div><div class="sheet" role="dialog"><div class="grip"></div>${html}</div>`;
    document.body.appendChild(wrap);
    this.el = wrap;
  },
  close() { if (this.el) { this.el.remove(); this.el = null; } },
};

/* ---------- render ---------- */
let SPLASHED = false;
function render() {
  if (!S.profile.onboarded) { app.innerHTML = Screens.onboard(); return; }
  const cur = Nav.cur();
  const fn = Screens[cur.name] || Screens.today;
  const out = fn(cur.params || {});
  const showNav = TABS.includes(cur.name);
  app.innerHTML = `<main class="screen ${showNav ? 'with-nav' : ''} ${out.cls || ''}">${out.html}</main>${out.footer ? `<div class="footer"><div>${out.footer}</div></div>` : ''}${out.extra || ''}${showNav ? navBar(cur.name) : ''}`;
  if (out.after) out.after();
}
function navBar(active) {
  const items = [['today', 'امروز'], ['goals', 'اهداف'], ['coach', 'مربی'], ['progress', 'پیشرفت'], ['settings', 'تنظیمات']];
  return `<nav class="nav"><div>${items.map(([k, l]) => `<button class="${k === active ? 'on' : ''}" data-a="tab" data-x="${k}">${ic(k)}<span>${l}</span></button>`).join('')}</div></nav>`;
}

/* ---------- screens ---------- */
let ONB = 0;
let DRAFT = null, PLAN = null, WSTEP = 0, WERR = '';
let GOAL_FILTER = 'active';
let COACH_LOG = [];
let TIMER = null;
const EXAMPLES = [
  'می‌خواهم تا پایان شهریور ۱۲ کتاب بخوانم',
  'طی ۶ ماه ۵ کیلو کم کنم',
  'تا آخر سال ۵۰ میلیون تومان پس‌انداز کنم',
  'در ۱۲ ماه زبان انگلیسی‌ام را برای مکالمه بهتر کنم',
  'هر روز ۱۰ دقیقه مدیتیشن کنم',
  'در ۴ ماه برنامه‌نویسی پایتون یاد بگیرم',
];

const Screens = {
  onboard() {
    const slides = [
      ['🎯', 'هدف بزرگت را بنویس', 'به زبان خودت بنویس چه می‌خواهی؛ مثلاً «می‌خواهم تا پایان سال ۱۲ کتاب بخوانم».'],
      ['🪜', 'به قدم‌های کوچک تبدیلش می‌کنیم', 'هدف دقیق (SMART) می‌شود و به مرحله‌ها و اقدام‌های ۵ تا ۶۰ دقیقه‌ای شکسته می‌شود.'],
      ['🔔', 'یادآوری می‌کنیم، اصلاح می‌کنیم', 'اگر عقب افتادی سرزنشت نمی‌کنیم؛ برنامه را با شرایط واقعی‌ات جور می‌کنیم.'],
    ];
    if (ONB < 3) {
      const [e, t, d] = slides[ONB];
      return `<div class="onb">
        <div class="row between"><span class="b" style="color:var(--primary-text)">هدف به اقدام</span><button class="btn ghost sm" data-a="onbSkip">رد کردن</button></div>
        <div class="art"><div class="orb">${e}</div></div>
        <div class="center stack"><h1>${t}</h1><p class="muted">${d}</p></div>
        <div class="dots">${[0, 1, 2, 3].map((i) => `<i class="${i === ONB ? 'on' : ''}"></i>`).join('')}</div>
        <button class="btn primary block" data-a="onbNext">${ONB === 2 ? 'شروع کن' : 'بعدی'}</button>
      </div>`;
    }
    const p = S.profile;
    return `<div class="onb"><div class="stack" style="flex:1">
      <div><h1>کمی درباره روزهایت</h1><p class="muted small">با این اطلاعات برنامه‌ای می‌سازیم که واقعاً جا شود. بعداً از تنظیمات قابل تغییر است.</p></div>
      <label class="field"><span>اسمت چیست؟ (اختیاری)</span><input data-f="p.name" value="${esc(p.name)}" placeholder="مثلاً سارا" maxlength="30"></label>
      <div class="field"><span>روزانه چقدر وقت برای هدف‌هایت داری؟</span>${minutesChips(p.dailyMinutes, 'setProfMin')}</div>
      <div class="field"><span>کدام روزهای هفته؟</span>${daysPicker(p.days, 'togProfDay')}</div>
      <div class="field"><span>ساعت‌های مناسب برای انجام اقدام‌ها</span><div class="three">${p.times.map((t, i) => `<input type="time" value="${t}" data-f="p.times.${i}">`).join('')}</div><p class="hint">یادآوری‌ها در این ساعت‌ها تنظیم می‌شوند.</p></div>
    </div>
    <div class="dots">${[0, 1, 2, 3].map((i) => `<i class="${i === 3 ? 'on' : ''}"></i>`).join('')}</div>
    <button class="btn primary block" data-a="onbDone">ساخت اولین هدف</button></div>`;
  },

  today() {
    const p = S.profile, t = D.today();
    const occs = sortOccs(occurrencesOn(t));
    const st = streak(), lv = level();
    const hello = `<div class="hello"><div><p class="muted small">${D.fmt(t, { weekday: true })}</p><h1>سلام${p.name ? '، ' + esc(p.name) : ''} 👋</h1></div>
      <div class="pills"><span class="pill streak">🔥 ${fa(st)}</span><span class="pill xp">⭐ سطح ${fa(lv.level)}</span></div></div>`;
    if (!S.goals.length) {
      return { html: hello + `<div class="card empty"><div class="art">🌱</div><h2>اولین هدفت را بساز</h2><p class="muted small" style="margin:6px 0 16px">هدفت را به زبان خودت بنویس؛ بقیه‌اش با ما.</p>
        <button class="btn primary block" data-a="newGoal">${ic('plus')} ساخت اولین هدف</button></div>
        <div class="section"><div class="section-h"><h2>چند نمونه</h2></div><div class="chips">${EXAMPLES.slice(0, 4).map((e) => `<button class="chip" data-a="example" data-x="${esc(e)}">${esc(e)}</button>`).join('')}</div></div>` };
    }
    let html = hello;
    if (Native && occs.length && !Native.notificationsAllowed()) {
      html += `<div class="banner">${ic('bell')}<div class="grow">یادآوری‌ها خاموش است؛ بدون آن ممکن است اقدام‌ها از یادت بروند.</div><button class="btn sm" data-a="askNotif">روشن کن</button></div>`;
    }
    const counted = occs.filter((o) => o.status !== 'skipped' && o.status !== 'moved');
    const doneN = counted.filter((o) => o.status === 'done').length;
    const mins = counted.reduce((s, o) => s + o.a.minutes, 0);
    if (occs.length) {
      html += `<div class="card dayhead">${ring(counted.length ? doneN / counted.length : 0, 68, 7)}
        <div class="grow"><h3>${doneN === counted.length && counted.length ? 'امروز را کامل کردی! 🎉' : `${fa(doneN)} از ${fa(counted.length)} اقدام امروز`}</h3>
        <p class="muted small">${fa(mins)} دقیقه برنامه از ${fa(p.dailyMinutes)} دقیقه زمان در دسترس</p></div></div>`;
    }
    const sugs = suggestions();
    sugs.slice(0, 1).forEach((s) => { html += sugCard(s, true); });
    if (sugs.length > 1) html += `<div class="row between" style="margin:8px 4px 0"><span class="muted small">${fa(sugs.length - 1)} پیشنهاد دیگر</span><button class="link" data-a="go" data-x="adaptive">همه پیشنهادها</button></div>`;
    const topO = topAction(occs);
    if (topO) {
      html += `<div class="section"><div class="hero"><div class="tag">⭐ مهم‌ترین اقدام امروز</div><h2>${esc(topO.a.title)}</h2>
        <div class="meta">${catIcon(topO.g.category)} ${esc(topO.g.title)} · ${fa(topO.a.minutes)} دقیقه${topO.time ? ' · ساعت ' + faTime(topO.time) : ''}</div>
        <div class="btns"><button class="btn white" data-a="startTimer" data-k="${topO.key}">${ic('play', 'sm')} شروع</button><button class="btn" style="background:rgba(255,255,255,.18);color:#fff" data-a="done" data-k="${topO.key}">${ic('check', 'sm')} انجام شد</button></div></div></div>`;
    } else if (occs.length) {
      html += `<div class="section card ok center"><div style="font-size:40px">🏆</div><h3>همه اقدام‌های امروز ثبت شد</h3><p class="muted small">فردا با انرژی ادامه بده.</p></div>`;
    }
    html += `<div class="section"><div class="section-h"><h2>اقدامات امروز</h2><span class="muted small">${fa(occs.length)} اقدام</span></div>`;
    html += occs.length ? occs.map((o) => occRow(o, topO && o.key === topO.key)).join('') : `<div class="card center muted">امروز اقدامی در برنامه نیست ✨</div>`;
    html += '</div>';
    const y = D.add(t, -1);
    const missedY = occurrencesOn(y).filter((o) => o.status === 'missed' && !(o.r && o.r.reason));
    if (missedY.length && y >= firstDay()) {
      html += `<div class="section card"><h3>دیروز ${fa(missedY.length)} اقدام انجام نشد</h3><p class="muted small">دلیلش را بگو تا برنامه را بهتر تنظیم کنیم.</p>
        ${missedY.slice(0, 3).map((o) => `<div style="margin-top:12px"><div class="b small">${esc(o.a.title)}</div><div class="chips" style="margin-top:6px">${MISS_REASONS.slice(0, 5).map(([k, l]) => `<button class="chip sm" data-a="reasonY" data-k="${o.key}" data-x="${k}">${l}</button>`).join('')}</div></div>`).join('')}</div>`;
    }
    const tm = occurrencesOn(D.add(t, 1));
    if (tm.length) html += `<div class="section card tight"><div class="row between"><span class="b">فردا</span><span class="muted small">${fa(tm.length)} اقدام · ${fa(tm.reduce((s, o) => s + o.a.minutes, 0))} دقیقه</span></div><p class="muted small ellipsis">${tm.slice(0, 3).map((o) => esc(o.a.title)).join('، ')}</p></div>`;
    return { html };
  },

  goals() {
    const f = GOAL_FILTER;
    const list = S.goals.filter((g) => f === 'all' || g.status === f);
    const tabs = [['active', 'فعال'], ['completed', 'تکمیل‌شده'], ['paused', 'متوقف'], ['archived', 'بایگانی'], ['all', 'همه']];
    let html = topBar('اهداف من', `${fa(S.goals.filter((g) => g.status === 'active').length)} هدف فعال`, { noBack: true, right: `<button class="iconbtn" data-a="newGoal" aria-label="هدف جدید">${ic('plus')}</button>` });
    html += `<div class="chips" style="margin-bottom:14px">${tabs.map(([k, l]) => `<button class="chip sm ${k === f ? 'on' : ''}" data-a="goalFilter" data-x="${k}">${l}</button>`).join('')}</div>`;
    if (!list.length) html += `<div class="card empty"><div class="art">🎯</div><h3>${f === 'active' ? 'هدف فعالی نداری' : 'چیزی اینجا نیست'}</h3><p class="muted small" style="margin:6px 0 14px">هدف بزرگت را بنویس تا به قدم‌های کوچک تبدیلش کنیم.</p><button class="btn primary" data-a="newGoal">${ic('plus')} هدف جدید</button></div>`;
    html += list.map((g) => goalCard(g)).join('<div style="height:10px"></div>');
    if (list.length) html += `<div style="height:16px"></div><button class="btn primary block" data-a="newGoal">${ic('plus')} هدف جدید</button>`;
    return { html };
  },

  goalNew() {
    const text = (DRAFT && DRAFT._text) || '';
    return {
      html: topBar('هدف جدید', 'به زبان خودت بنویس') + `
      <label class="field"><span>چه هدفی داری؟</span><textarea id="goalText" data-f="newText" maxlength="200" placeholder="مثلاً: می‌خواهم تا پایان شهریور ۱۲ کتاب بخوانم">${esc(text)}</textarea>
      <p class="hint row between"><span id="detect"></span><span id="cnt">${fa(text.length)}/۲۰۰</span></p></label>
      <div class="field"><span>دسته‌بندی</span><div class="chips" id="catChips">${catChips((DRAFT && DRAFT._cat) || '')}</div><p class="hint">اگر انتخاب نکنی، از روی متن تشخیص می‌دهیم.</p></div>
      <div class="section"><div class="section-h"><h2>نمونه هدف خوب</h2></div><div class="chips">${EXAMPLES.map((e) => `<button class="chip sm" data-a="example" data-x="${esc(e)}">${esc(e)}</button>`).join('')}</div></div>`,
      footer: `<button class="btn primary block" id="goalNext" data-a="goalNext" ${text.trim().length < 4 ? 'disabled' : ''}>ادامه</button>`,
      cls: 'with-footer', after: updateDetect,
    };
  },

  wizard() {
    const steps = [['S', 'مشخص'], ['M', 'سنجش‌پذیر'], ['A', 'شدنی'], ['R', 'مرتبط'], ['T', 'زمان‌دار']];
    const d = DRAFT;
    let body = '';
    const filled = (k) => (d.filled[k] ? `<span class="filled">${ic('check', 'sm')} از متن هدف استخراج شد</span>` : '');
    if (WSTEP === 0) {
      body = `<div class="row" style="margin-bottom:14px"><div class="letter">S</div><div><h2>هدف دقیقاً چیست؟</h2><p class="muted small">یک فعل و یک موضوع مشخص</p></div></div>
        <label class="field"><span>عنوان هدف</span><input data-f="d.title" value="${esc(d.title)}" maxlength="120"></label><div style="margin-top:8px">${filled('S')}</div>
        <div class="field" style="margin-top:16px"><span>دسته‌بندی</span><div class="chips">${Object.entries(CATS).map(([k, c]) => `<button class="chip ${d.category === k ? 'on' : ''}" data-a="wCat" data-x="${k}">${c.icon} ${c.label}</button>`).join('')}</div></div>
        <div class="card soft small" style="margin-top:16px">💡 «خواندن ۱۲ کتاب» بهتر از «کتاب بیشتر» است؛ هرچه دقیق‌تر، برنامه بهتر.</div>`;
    } else if (WSTEP === 1) {
      const hints = UNIT_HINTS[d.category] || UNIT_HINTS.other;
      body = `<div class="row" style="margin-bottom:14px"><div class="letter">M</div><div><h2>موفقیت را با چه می‌سنجیم؟</h2><p class="muted small">معیار روشن، پیشرفت را قابل دیدن می‌کند</p></div></div>
        <div class="seg"><button class="${d.measure === 'value' ? 'on' : ''}" data-a="wMeasure" data-x="value">عددی (مثلاً ۱۲ کتاب)</button><button class="${d.measure === 'actions' ? 'on' : ''}" data-a="wMeasure" data-x="actions">با انجام اقدام‌ها</button></div>
        <div style="margin-top:10px">${filled('M')}</div>`;
      if (d.measure === 'value') {
        body += `<label class="field" style="margin-top:14px"><span>واحد</span><input data-f="d.unit" value="${esc(d.unit)}" placeholder="مثلاً کتاب"></label>
          <div class="chips" style="margin-top:8px">${hints.map((h) => `<button class="chip sm ${d.unit === h ? 'on' : ''}" data-a="wUnit" data-x="${h}">${h}</button>`).join('')}</div>
          <div class="two" style="margin-top:14px"><label class="field"><span>مقدار فعلی</span><input inputmode="decimal" data-f="d.startValue" value="${d.startValue == null ? '' : fa(d.startValue)}" placeholder="۰"></label>
          <label class="field" style="margin-top:0"><span>مقدار هدف</span><input inputmode="decimal" id="tv" data-f="d.targetValue" value="${d.targetValue == null ? '' : fa(d.targetValue)}" placeholder="—"></label></div>
          ${d.delta ? `<p class="hint">هدف: ${fa(d.delta)} ${esc(d.unit)} ${d.direction === 'down' ? 'کاهش' : 'افزایش'}؛ با وارد کردن مقدار فعلی، مقدار هدف خودکار حساب می‌شود.</p>` : ''}`;
      } else {
        body += `<div class="card soft small" style="margin-top:14px">پیشرفت با انجام اقدام‌های هر مرحله سنجیده می‌شود. برای هدف‌هایی مثل عادت‌سازی یا مهارت مناسب است.</div>`;
      }
    } else if (WSTEP === 2) {
      body = `<div class="row" style="margin-bottom:14px"><div class="letter">A</div><div><h2>چقدر وقت داری؟</h2><p class="muted small">برنامه باید با زندگی واقعی‌ات جور باشد</p></div></div>
        <div class="field"><span>زمان روزانه برای این هدف</span>${minutesChips(d.dailyMinutes, 'wMin')}</div>
        <div class="field"><span>روزهای فعال هفته</span>${daysPicker(d.days, 'wDay')}</div>
        <label class="field"><span>محدودیت‌ها (اختیاری)</span><textarea data-f="d.constraints" placeholder="مثلاً: شنبه‌ها تا دیروقت سر کارم" style="min-height:70px">${esc(d.constraints)}</textarea></label>
        <div class="card soft small" style="margin-top:14px">ظرفیت هفتگی: <b>${fa(d.dailyMinutes * d.days.length)} دقیقه</b> (حدود ${faNum((d.dailyMinutes * d.days.length) / 60)} ساعت)</div>
        <div style="margin-top:8px">${filled('A')}</div>`;
    } else if (WSTEP === 3) {
      const why = ['برای سلامتی‌ام', 'برای پیشرفت شغلی', 'برای اعتمادبه‌نفس', 'برای خانواده‌ام', 'برای آرامش ذهنی', 'برای استقلال مالی'];
      body = `<div class="row" style="margin-bottom:14px"><div class="letter">R</div><div><h2>چرا برایت مهم است؟</h2><p class="muted small">وقتی انگیزه‌ات کم شد، همین را یادت می‌آوریم</p></div></div>
        <label class="field"><span>دلیل اهمیت (اختیاری ولی توصیه‌شده)</span><textarea id="whyIn" data-f="d.why" maxlength="160" placeholder="مثلاً: می‌خواهم در سفر کاری راحت صحبت کنم">${esc(d.why)}</textarea></label>
        <div class="chips" style="margin-top:10px">${why.map((w) => `<button class="chip sm" data-a="wWhy" data-x="${w}">${w}</button>`).join('')}</div>`;
    } else {
      const today = D.today();
      const dl = [['۱ ماه', addJMonths(d.startDate, 1)], ['۳ ماه', addJMonths(d.startDate, 3)], ['۶ ماه', addJMonths(d.startDate, 6)], ['۱ سال', addJMonths(d.startDate, 12)], ['پایان سال', D.endOfJMonth(D.j(today).jy, 12)]];
      const nextSat = D.add(today, (7 - D.wd(today)) % 7 || 7);
      const span = d.deadline ? D.diff(d.startDate, d.deadline) + 1 : 0;
      body = `<div class="row" style="margin-bottom:14px"><div class="letter">T</div><div><h2>تا چه زمانی؟</h2><p class="muted small">مهلت مشخص، برنامه را واقعی می‌کند</p></div></div>
        <div class="field"><span>شروع</span><div class="chips">${[['امروز', today], ['فردا', D.add(today, 1)], ['شنبه آینده', nextSat]].map(([l, v]) => `<button class="chip ${d.startDate === v ? 'on' : ''}" data-a="wStart" data-x="${v}">${l}</button>`).join('')}</div><p class="hint">${D.fmt(d.startDate, { weekday: true })}</p></div>
        <div class="field"><span>مهلت</span><div class="chips">${dl.map(([l, v]) => `<button class="chip ${d.deadline === v ? 'on' : ''}" data-a="wDeadline" data-x="${v}">${l}</button>`).join('')}</div></div>
        <div class="field"><span>یا تاریخ دلخواه</span>${jPicker('dl', d.deadline || addJMonths(today, 3))}</div>
        ${d.deadline ? `<div class="card soft small" style="margin-top:14px">${D.fmt(d.startDate)} تا <b>${D.fmt(d.deadline)}</b> — ${fa(span)} روز (حدود ${fa(Math.round(span / 7))} هفته)</div>` : ''}
        <div style="margin-top:8px">${filled('T')}</div>`;
    }
    return {
      html: topBar('دقیق‌کردن هدف', `گام ${fa(WSTEP + 1)} از ۵`) + `<div class="stepper">${steps.map(([k, l], i) => `<div class="${i <= WSTEP ? 'on' : ''}"><span class="ltr">${k}</span> ${l}</div>`).join('')}</div>` + body + (WERR ? `<div class="err">${WERR}</div>` : ''),
      footer: `<div class="btns">${WSTEP > 0 ? '<button class="btn outline" data-a="wPrev">قبلی</button>' : ''}<button class="btn primary" data-a="wNext">${WSTEP === 4 ? 'مشاهده نتیجه' : 'بعدی'}</button></div>`,
      cls: 'with-footer',
    };
  },

  result() {
    const d = DRAFT, pl = PLAN;
    const checks = smartChecks(d, pl);
    const fcls = { green: 'ok', yellow: 'warn', red: 'bad' }[pl.feasibility];
    const ftxt = {
      green: ['✅', 'برنامه با زمانی که داری جور است.'],
      yellow: ['⚠️', 'برنامه فشرده است و جای خطای کمی داری.'],
      red: ['⛔', 'با این زمان‌بندی به هدف نمی‌رسی. یکی از این‌ها را انتخاب کن:'],
    }[pl.feasibility];
    const actCount = pl.milestones.reduce((s, m) => s + m.actions.length, 0);
    let html = topBar('هدف نهایی', 'نتیجه SMART');
    html += `<div class="card grad"><div class="muted small">🎯 هدف SMART تو</div><h2 style="line-height:1.8;margin-top:6px">${esc(smartSentence(d))}</h2></div>`;
    html += `<div class="card checks">${checks.map((c) => `<div class="ck"><div class="dot ${c.ok ? 'ok' : 'no'}">${c.k}</div><div class="grow"><div class="b small">${c.label} ${c.ok ? '✓' : ''}</div><div class="muted small">${esc(c.val)}</div></div></div>`).join('')}</div>`;
    html += `<div class="card ${fcls}"><div class="row"><span style="font-size:22px">${ftxt[0]}</span><div class="grow"><div class="b">${ftxt[1]}</div><div class="small muted">زمان لازم حدود ${fa(Math.round(pl.need / 60))} ساعت از ${fa(Math.round(pl.capacity / 60))} ساعت ظرفیت (${fa(Math.round(pl.ratio * 100))}٪)</div></div></div>
      ${pl.fixes.length ? `<div class="chips" style="margin-top:12px">${pl.fixes.map((f, i) => `<button class="chip sm" data-a="applyFix" data-x="${i}">${esc(f.label)}</button>`).join('')}</div>` : ''}
      ${pl.note ? `<p class="small muted" style="margin-top:10px">${esc(pl.note)}</p>` : ''}</div>`;
    html += `<div class="section"><div class="section-h"><h2>مسیر پیشنهادی</h2><span class="muted small">${fa(pl.milestones.length)} مرحله · ${fa(actCount)} اقدام</span></div><div class="tl">`;
    html += pl.milestones.map((m, i) => `<div class="tl-item ${i === 0 ? 'cur' : ''}"><span class="tl-node">${fa(i + 1)}</span><div class="card tight"><div class="b">${esc(m.title)}</div><div class="muted xs">${D.fmt(m.start, { year: false })} تا ${D.fmt(m.end)}</div>
      <div class="small" style="margin-top:6px">${m.actions.filter((a) => a.kind !== 'log').slice(0, 3).map((a) => `• ${esc(a.title)} <span class="muted">(${fa(a.minutes)} دقیقه، ${recText(a.rec)})</span>`).join('<br>')}</div></div></div>`).join('');
    html += '</div><p class="hint" style="margin-top:10px">بعد از ساخت، همه مرحله‌ها و اقدام‌ها قابل ویرایش‌اند.</p></div>';
    return { html, footer: `<div class="btns"><button class="btn outline" data-a="back">ویرایش</button><button class="btn primary" data-a="createGoal">${ic('flag', 'sm')} ساخت مسیر</button></div>`, cls: 'with-footer' };
  },

  goal({ id }) {
    const g = goalById(id);
    if (!g) return { html: topBar('هدف') + '<div class="card">این هدف پیدا نشد.</div>' };
    const p = goalProgress(g), e = expectedProgress(g), fc = forecast(g);
    const left = D.diff(D.today(), g.deadline);
    let status = '';
    if (g.status === 'completed') status = '<span class="badge ok">تکمیل‌شده 🎉</span>';
    else if (g.status === 'paused') status = '<span class="badge warn">متوقف</span>';
    else if (g.status === 'archived') status = '<span class="badge">بایگانی</span>';
    else if (p >= e - 0.05) status = '<span class="badge ok">طبق برنامه</span>';
    else status = `<span class="badge warn">${fa(Math.round((e - p) * 100))} واحد عقب‌تر</span>`;
    let html = topBar(g.title, `${catIcon(g.category)} ${(CATS[g.category] || CATS.other).label}`, { right: `<button class="iconbtn" data-a="goalMenu" data-x="${g.id}" aria-label="گزینه‌ها">${ic('more')}</button>` });
    html += `<div class="card"><div class="row">${ring(p, 84, 8)}<div class="grow gap8"><div>${status}</div>
      <div class="small">پیشرفت مورد انتظار تا امروز: <b>${pct(e)}</b></div>
      <div class="small muted">${D.fmt(g.startDate, { year: false })} تا ${D.fmt(g.deadline)}${g.status === 'active' ? ` · ${left >= 0 ? fa(left) + ' روز مانده' : 'مهلت گذشته'}` : ''}</div></div></div>
      <div style="margin-top:14px">${bar(p, e)}</div><p class="hint">خط کوچک روی نوار، پیشرفت مورد انتظار است.</p>
      ${fc && fc.date ? `<p class="small" style="margin-top:8px">📈 با سرعت فعلی حدود <b>${D.fmt(fc.date)}</b> می‌رسی${fc.onTime ? ' — قبل از مهلت 👏' : ' — بعد از مهلت'}.</p>` : fc && fc.stalled ? '<p class="small" style="margin-top:8px">📉 در دو هفته اخیر پیشرفتی ثبت نشده.</p>' : '<p class="small muted" style="margin-top:8px">پیش‌بینی زمان رسیدن بعد از ۷ روز و ۵ ثبت انجام نمایش داده می‌شود.</p>'}</div>`;
    if (g.measure === 'value') {
      html += `<div class="card"><div class="row between"><div><div class="muted small">مقدار فعلی</div><div class="b" style="font-size:20px">${faNum(g.currentValue)} <span class="small muted">از ${faNum(g.targetValue)} ${esc(g.unit)}</span></div></div><button class="btn sm" data-a="logValue" data-x="${g.id}">ثبت مقدار جدید</button></div></div>`;
    }
    if (g.why) html += `<div class="card soft"><div class="small muted">چرا برایم مهم است</div><div class="b">«${esc(g.why)}»</div></div>`;
    if (g.status === 'paused') html += `<div class="banner" style="margin-top:12px">${ic('pause')}<div class="grow">این هدف متوقف است و اقدامی برایش برنامه‌ریزی نمی‌شود.</div><button class="btn sm" data-a="resumeGoal" data-x="${g.id}">ادامه</button></div>`;
    const ms = msOf(g), cur = currentMilestone(g);
    html += `<div class="section"><div class="section-h"><h2>مسیر هدف</h2><span class="muted small">${fa(ms.filter((m) => m.completedAt).length)} از ${fa(ms.length)} مرحله</span></div><div class="tl">`;
    html += ms.map((m, i) => {
      const mp = msProgress(m), cls = m.completedAt ? 'done' : cur && cur.id === m.id ? 'cur' : '';
      return `<button class="tl-item ${cls}" data-a="go" data-x="milestone" data-id="${m.id}"><span class="tl-node">${m.completedAt ? '✓' : fa(i + 1)}</span>
        <div class="card tight"><div class="row between"><div class="b grow">${esc(m.title)}</div><span class="small muted">${pct(mp)}</span></div>
        <div class="muted xs" style="margin:2px 0 8px">${D.fmt(m.start, { year: false })} تا ${D.fmt(m.end)}${cls === 'cur' ? ' · مرحله جاری' : ''}</div>${bar(mp, null, m.completedAt ? 'ok' : '')}</div></button>`;
    }).join('');
    html += '</div></div>';
    return { html };
  },

  milestone({ id }) {
    const m = msById(id);
    if (!m) return { html: topBar('مرحله') + '<div class="card">پیدا نشد.</div>' };
    const g = goalById(m.goalId), mp = msProgress(m);
    const acts = actsOfMs(m).filter((a) => a.status !== 'split');
    let html = topBar(m.title, `${D.fmt(m.start, { year: false })} تا ${D.fmt(m.end)}`);
    html += `<div class="card"><div class="row between"><span class="small muted">${catIcon(g.category)} ${esc(g.title)}</span>${m.completedAt ? '<span class="badge ok">تکمیل شد</span>' : ''}</div>
      <div class="row" style="margin-top:10px"><div class="grow">${bar(mp, null, m.completedAt ? 'ok' : '')}</div><b>${pct(mp)}</b></div></div>`;
    html += `<div class="section"><div class="section-h"><h2>اقدام‌ها</h2><button class="link" data-a="addAction" data-x="${m.id}">+ افزودن اقدام</button></div>`;
    html += acts.map((a) => {
      const dn = Math.min(doneCount(a.id), a.target || 1);
      return `<button class="occ" style="width:100%;text-align:start" data-a="go" data-x="action" data-id="${a.id}"><div class="grow"><div class="occ-title">${esc(a.title)}</div>
        <div class="occ-meta">${recText(a.rec)} · ${fa(a.minutes)} دقیقه${a.time ? ' · ' + faTime(a.time) : ''}${a.status === 'paused' ? ' · متوقف' : ''}</div></div>
        <span class="badge ${dn >= (a.target || 1) ? 'ok' : 'pri'}">${fa(dn)}/${fa(a.target || 1)}</span>${ic('chev', 'sm')}</button>`;
    }).join('') || '<div class="card muted center">اقدامی ندارد.</div>';
    html += '</div>';
    return { html };
  },

  action({ id }) {
    const a = actById(id);
    if (!a) return { html: topBar('اقدام') + '<div class="card">پیدا نشد.</div>' };
    const g = goalById(a.goalId), m = msById(a.msId), size = sizeOf(a.minutes);
    const dn = doneCount(a.id), t = D.today();
    const todayOcc = occurrencesOn(t).find((o) => o.a.id === a.id);
    const hist = [];
    for (let d = D.add(t, -1), guard = 0; hist.length < 14 && guard < 60 && d >= createdDay(a.createdAt); d = D.add(d, -1), guard += 1) {
      if (scheduledOn(a, d)) hist.unshift(occStatus(a.id + '|' + d, d));
    }
    const pri = ['', 'کم', 'متوسط', 'زیاد'][a.priority] || 'متوسط';
    let html = topBar('جزئیات اقدام', `${catIcon(g.category)} ${esc(g.title)}`);
    html += `<div class="card"><h2 style="line-height:1.7">${esc(a.title)}</h2>${a.desc ? `<p class="muted small" style="margin-top:4px">${esc(a.desc)}</p>` : ''}
      <div class="chips" style="margin-top:12px"><span class="badge pri">${ic('clock', 'sm')} ${fa(a.minutes)} دقیقه</span><span class="badge">اندازه ${SIZE_LABEL[size]} · ${fa(xpFor(a.minutes))} امتیاز</span><span class="badge">اولویت ${pri}</span>
      <span class="badge">${ic('cal', 'sm')} ${recText(a.rec)}</span>${a.time ? `<span class="badge">${ic('bell', 'sm')} ${a.remind ? faTime(a.time) : 'یادآوری خاموش'}</span>` : ''}${a.kind === 'log' ? '<span class="badge warn">ثبت مقدار</span>' : ''}</div>
      <div class="small muted" style="margin-top:10px">مرحله: ${esc(m.title)}</div>
      <div class="row" style="margin-top:12px"><div class="grow">${bar(Math.min(dn, a.target || 1) / (a.target || 1))}</div><span class="small b">${fa(Math.min(dn, a.target || 1))} از ${fa(a.target || 1)}</span></div></div>`;
    if (hist.length) html += `<div class="card"><div class="b small" style="margin-bottom:8px">نوبت‌های اخیر</div><div class="hist">${hist.map((s) => `<i class="${s}" title="${s}"></i>`).join('')}</div><p class="hint">سبز: انجام شد · قرمز: انجام نشد · زرد: رد شد</p></div>`;
    html += '<div class="section stack">';
    if (todayOcc && todayOcc.status === 'pending') html += `<div class="btns"><button class="btn outline" data-a="startTimer" data-k="${todayOcc.key}">${ic('play', 'sm')} شروع با تایمر</button><button class="btn primary" data-a="done" data-k="${todayOcc.key}">${ic('check', 'sm')} انجام شد</button></div>`;
    html += `<div class="card" style="padding:6px 10px">
      <button class="menu-item" data-a="editAction" data-x="${a.id}"><span class="mi">${ic('edit', 'sm')}</span>ویرایش اقدام</button>
      ${a.minutes >= 20 && a.status === 'active' ? `<button class="menu-item" data-a="splitAction" data-x="${a.id}"><span class="mi">${ic('split', 'sm')}</span><div>خرد کردن به دو بخش<small>دو اقدام ${fa(clamp(round5(a.minutes / 2), 5, 60))} دقیقه‌ای</small></div></button>` : ''}
      <button class="menu-item" data-a="toggleAction" data-x="${a.id}"><span class="mi">${ic(a.status === 'paused' ? 'play' : 'pause', 'sm')}</span>${a.status === 'paused' ? 'ادامه اقدام' : 'توقف موقت'}</button>
      <button class="menu-item red" data-a="deleteAction" data-x="${a.id}"><span class="mi">${ic('trash', 'sm')}</span>حذف اقدام</button></div></div>`;
    return { html };
  },

  actionEdit({ id, msId }) {
    const a = id ? actById(id) : null;
    const m = msById(a ? a.msId : msId);
    const F = window.__AF || (window.__AF = a ? { title: a.title, desc: a.desc, minutes: a.minutes, priority: a.priority, rec: JSON.parse(JSON.stringify(a.rec)), time: a.time || '18:00', remind: a.remind, target: a.target }
      : { title: '', desc: '', minutes: 15, priority: 2, rec: { type: 'weekly', days: goalById(m.goalId).days.slice() }, time: S.profile.times[0] || '18:00', remind: true, target: null });
    const r = F.rec;
    let html = topBar(a ? 'ویرایش اقدام' : 'اقدام جدید', esc(m.title));
    html += `<label class="field"><span>عنوان اقدام</span><input data-f="af.title" value="${esc(F.title)}" placeholder="مثلاً ۱۵ دقیقه پیاده‌روی بعد از ناهار" maxlength="90"></label>
      <p class="hint">اقدام باید مشخص و قابل انجام باشد؛ «ورزش کن» کلی است، «۱۵ دقیقه پیاده‌روی» خوب است.</p>
      <div class="field" style="margin-top:14px"><span>زمان تخمینی</span><div class="chips">${[5, 10, 15, 20, 30, 45, 60].map((n) => `<button class="chip ${F.minutes === n ? 'on' : ''}" data-a="afMin" data-x="${n}">${fa(n)} دقیقه</button>`).join('')}</div></div>
      <div class="field"><span>اولویت</span><div class="seg" style="grid-template-columns:1fr 1fr 1fr">${[[1, 'کم'], [2, 'متوسط'], [3, 'زیاد']].map(([v, l]) => `<button class="${F.priority === v ? 'on' : ''}" data-a="afPri" data-x="${v}">${l}</button>`).join('')}</div></div>
      <div class="field"><span>تکرار</span><div class="seg" style="grid-template-columns:1fr 1fr 1fr">${[['once', 'یک‌بار'], ['daily', 'هر روز'], ['weekly', 'روزهای منتخب']].map(([v, l]) => `<button class="${r.type === v ? 'on' : ''}" data-a="afRec" data-x="${v}">${l}</button>`).join('')}</div>
      ${r.type === 'weekly' ? `<div style="margin-top:10px">${daysPicker(r.days || [], 'afDay')}</div>` : ''}
      ${r.type === 'once' ? `<div style="margin-top:10px">${jPicker('af', r.date || D.today())}</div>` : ''}</div>
      <div class="field"><span>ساعت</span><input type="time" data-f="af.time" value="${F.time}"></div>
      <div class="set-row"><div class="grow"><div class="b">یادآوری</div><div class="muted xs">اعلان در ساعت تعیین‌شده</div></div><button class="toggle ${F.remind ? 'on' : ''}" data-a="afRemind"></button></div>
      <label class="field"><span>توضیح (اختیاری)</span><textarea data-f="af.desc" style="min-height:64px">${esc(F.desc)}</textarea></label>
      <div class="err" id="afErr"></div>`;
    return { html, footer: `<button class="btn primary block" data-a="saveAction" data-x="${a ? a.id : ''}" data-ms="${m.id}">ذخیره</button>`, cls: 'with-footer' };
  },

  timer({ key }) {
    const o = occByKey(key);
    if (!o) return { html: topBar('تایمر') };
    if (!TIMER || TIMER.key !== key) TIMER = { key, total: o.a.minutes * 60, left: o.a.minutes * 60, running: true, last: Date.now() };
    const T = TIMER;
    const mm = Math.floor(T.left / 60), ss = T.left % 60;
    return {
      html: topBar('تمرکز', esc(o.a.title)) + `<div class="timer-ring">${ring(1 - T.left / T.total, 230, 14, `<span class="t" id="tt">${fa(pad2(mm))}:${fa(pad2(ss))}</span>`)}</div>
        <p class="center muted">${T.left > 0 ? 'فقط روی همین یک قدم تمرکز کن.' : 'وقت تمام شد! انجامش دادی؟'}</p>`,
      footer: `<div class="btns"><button class="btn outline" data-a="timerToggle">${ic(T.running ? 'pause' : 'play', 'sm')} ${T.running ? 'مکث' : 'ادامه'}</button><button class="btn primary" data-a="done" data-k="${key}">${ic('check', 'sm')} انجام شد</button></div>`,
      cls: 'with-footer', after: tickTimer,
    };
  },

  progress() {
    const lv = level(), st = streak(), r7 = rateWindow(7);
    const totalDone = Object.values(S.occ).filter((r) => r.status === 'done').length;
    let html = topBar('پیشرفت', 'تصویر واقعی مسیرت', { noBack: true });
    html += `<div class="card grad"><div class="row between"><div><div class="muted small">سطح</div><div style="font-size:30px;font-weight:800;line-height:1.3">${fa(lv.level)}</div></div>
      <div style="text-align:left"><div class="muted small">مجموع امتیاز</div><div class="b ltr" style="font-size:20px">${fa(lv.total)} XP</div></div></div>
      <div style="margin-top:12px;background:rgba(255,255,255,.22);height:8px;border-radius:9px;overflow:hidden"><div style="height:100%;width:${(lv.into / XP_RULES.level) * 100}%;background:#fff;border-radius:9px;margin-inline-start:0"></div></div>
      <div class="muted xs" style="margin-top:6px">${fa(XP_RULES.level - lv.into)} امتیاز تا سطح بعد</div></div>`;
    html += `<div class="stats" style="margin-top:12px">
      <div class="stat"><div class="v" style="color:var(--streak)">🔥 ${fa(st)}</div><div class="l">روز پیاپی (Streak)</div></div>
      <div class="stat"><div class="v">${fa(activeDaysCount())}</div><div class="l">روز فعال</div></div>
      <div class="stat"><div class="v">${fa(totalDone)}</div><div class="l">اقدام انجام‌شده</div></div>
      <div class="stat"><div class="v">${r7 == null ? '—' : pct(r7)}</div><div class="l">نرخ انجام ۷ روز اخیر</div></div></div>
      <p class="hint">در هر ۷ روز، یک روز غیبت Streak را صفر نمی‌کند. روزهای بدون برنامه هم حساب نمی‌شوند.</p>`;
    html += `<div class="section card"><div class="row between"><h3>۱۴ روز اخیر</h3><span class="muted xs">تعداد اقدام انجام‌شده</span></div>${chart14()}</div>`;
    const sugs = suggestions();
    if (sugs.length) html += `<button class="card row" style="width:100%;text-align:start;margin-top:12px" data-a="go" data-x="adaptive"><span style="font-size:22px">🛠️</span><div class="grow"><div class="b">پیشنهادهای اصلاح برنامه</div><div class="muted small">${fa(sugs.length)} پیشنهاد برای سبک‌تر و واقعی‌تر شدن برنامه</div></div>${ic('chev')}</button>`;
    const act = S.goals.filter((g) => g.status === 'active' || g.status === 'completed');
    html += `<div class="section"><div class="section-h"><h2>اهداف</h2></div>`;
    html += act.length ? act.map((g) => {
      const p = goalProgress(g), e = expectedProgress(g), fc = forecast(g), ms = msOf(g);
      const behind = (() => { let n = 0; for (let i = 1; i <= 7; i += 1) n += occurrencesOn(D.add(D.today(), -i)).filter((o) => o.g.id === g.id && o.status === 'missed').length; return n; })();
      return `<button class="card goal" data-a="go" data-x="goal" data-id="${g.id}"><div class="row"><div class="gi">${catIcon(g.category)}</div><div class="grow"><h3 class="ellipsis">${esc(g.title)}</h3>
        <div class="muted xs">${g.measure === 'value' ? `${faNum(g.currentValue)} از ${faNum(g.targetValue)} ${esc(g.unit)} · ` : ''}${fa(ms.filter((m) => m.completedAt).length)}/${fa(ms.length)} مرحله${behind ? ` · ${fa(behind)} عقب‌افتاده` : ''}</div></div>${ring(p, 52, 5)}</div>
        <div style="margin-top:10px">${bar(p, e)}</div><div class="muted xs" style="margin-top:6px">${g.status === 'completed' ? 'تکمیل شد 🎉' : fc && fc.date ? `پیش‌بینی رسیدن: ${D.fmt(fc.date)}` : `مورد انتظار: ${pct(e)}`}</div></button>`;
    }).join('<div style="height:10px"></div>') : '<div class="card muted center">هنوز هدفی نداری.</div>';
    html += '</div>';
    return { html };
  },

  adaptive() {
    const sugs = suggestions();
    let html = topBar('اصلاح برنامه', 'پیشنهادها بر اساس رفتار واقعی تو');
    html += '<div class="card soft small">هیچ تغییری بدون تأیید تو اعمال نمی‌شود. پیشنهادی که رد کنی تا ۷ روز تکرار نمی‌شود.</div>';
    html += sugs.length ? sugs.map((s) => sugCard(s, false)).join('') : '<div class="card empty"><div class="art">👌</div><h3>فعلاً پیشنهادی نیست</h3><p class="muted small">برنامه‌ات با روند فعلی‌ات جور است.</p></div>';
    return { html };
  },

  coach() {
    if (!COACH_LOG.length) COACH_LOG.push({ from: 'bot', cards: [{ type: 'text', text: `سلام${S.profile.name ? ' ' + esc(S.profile.name) : ''}! من مربی برنامه‌ریزی تو هستم. هدفت را بنویس تا SMART‌اش کنم، یا بپرس امروز چه کنی.` }] });
    const quick = ['امروز چه کار کنم؟', 'عقب افتادم', 'خلاصه پیشرفتم', 'اقدام بزرگ را خرد کن', 'می‌خواهم تا آخر سال ۲۰ کتاب بخوانم'];
    let html = topBar('مربی', 'مربی آفلاین · قاعده‌محور', { noBack: true });
    html += `<div class="chat" id="chat">${COACH_LOG.map(renderMsg).join('')}</div>`;
    return {
      html, cls: 'coach',
      extra: `<div class="composer"><div><div class="qchips">${quick.map((q) => `<button class="chip sm" data-a="coachQuick" data-x="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        <div class="row"><input id="coachIn" placeholder="هدف یا سؤالت را بنویس…" enterkeyhint="send"><button class="send" data-a="coachSend" aria-label="ارسال">${ic('send')}</button></div></div></div>`,
      after: () => { window.scrollTo(0, document.body.scrollHeight); },
    };
  },

  settings() {
    const p = S.profile;
    const notifOk = Native ? Native.notificationsAllowed() : null;
    const exactOk = Native ? Native.exactAlarmsAllowed() : null;
    const fonts = Persist.fonts.list();
    let html = topBar('تنظیمات', '', { noBack: true });
    html += `<div class="section-h"><h2>پروفایل و برنامه</h2></div><div class="card">
      <label class="field"><span>نام</span><input data-f="p.name" value="${esc(p.name)}" maxlength="30"></label>
      <div class="field"><span>زمان روزانه در دسترس</span>${minutesChips(p.dailyMinutes, 'setProfMin')}</div>
      <div class="field"><span>روزهای فعال (پیش‌فرض هدف‌های جدید)</span>${daysPicker(p.days, 'togProfDay')}</div>
      <div class="field"><span>ساعت‌های مناسب</span><div class="three">${p.times.map((t, i) => `<input type="time" value="${t}" data-f="p.times.${i}">`).join('')}</div></div></div>`;
    html += `<div class="section"><div class="section-h"><h2>اعلان‌ها</h2></div><div class="card" style="padding-top:4px;padding-bottom:4px">
      <div class="set-row"><div class="grow"><div class="b">اجازه اعلان</div><div class="muted xs">${notifOk == null ? 'در نسخه اندروید فعال است' : notifOk ? 'روشن ✓' : 'خاموش — یادآوری‌ها نمایش داده نمی‌شوند'}</div></div>${notifOk === false ? '<button class="btn sm" data-a="askNotif">روشن کن</button>' : ''}</div>
      ${Native && Native.sdk() >= 31 ? `<div class="set-row"><div class="grow"><div class="b">یادآوری در دقیقه دقیق</div><div class="muted xs">${exactOk ? 'فعال ✓' : 'غیرفعال — ممکن است اعلان چند دقیقه دیرتر برسد'}</div></div>${exactOk ? '' : '<button class="btn sm" data-a="exactAlarm">فعال کن</button>'}</div>` : ''}
      <div class="set-row"><div class="grow"><div class="b">حداکثر اعلان در روز</div></div><div class="stepnum"><button data-a="maxN" data-x="-1">−</button><b>${fa(p.maxNotif)}</b><button data-a="maxN" data-x="1">+</button></div></div>
      <div class="set-row" style="display:block"><div class="b">ساعات سکوت</div><div class="muted xs">در این بازه اعلانی ارسال نمی‌شود</div>
        <div class="two" style="margin-top:8px"><label class="field"><span class="xs muted">از</span><input type="time" data-f="p.quietStart" value="${p.quietStart}"></label><label class="field" style="margin-top:0"><span class="xs muted">تا</span><input type="time" data-f="p.quietEnd" value="${p.quietEnd}"></label></div></div>
      <div class="set-row"><div class="grow"><div class="b">جمع‌بندی عصر</div><div class="muted xs">اگر ۲ اقدام یا بیشتر مانده باشد</div></div><button class="toggle ${p.checkin ? 'on' : ''}" data-a="togSet" data-x="checkin"></button></div>
      ${p.checkin ? `<div style="padding:0 0 12px"><input type="time" data-f="p.checkinTime" value="${p.checkinTime}"></div>` : ''}
      <div class="set-row"><div class="grow"><div class="b">پیگیری ۲ ساعت بعد</div><div class="muted xs">اگر اقدام هنوز ثبت نشده باشد</div></div><button class="toggle ${p.followUp ? 'on' : ''}" data-a="togSet" data-x="followUp"></button></div>
      ${Native ? `<div class="set-row"><div class="grow"><div class="b">بهینه‌سازی باتری</div><div class="muted xs">در برخی گوشی‌ها (شیائومی، هوآوی، سامسونگ) برای رسیدن به‌موقع اعلان، اپ را از بهینه‌سازی خارج کن</div></div><button class="btn sm" data-a="battery">${ic('battery', 'sm')}</button></div>` : ''}
      </div></div>`;
    html += `<div class="section"><div class="section-h"><h2>ظاهر</h2></div><div class="card">
      <div class="field"><span>حالت نمایش</span><div class="seg" style="grid-template-columns:1fr 1fr 1fr">${[['light', 'روشن'], ['dark', 'تیره'], ['system', 'مثل سیستم']].map(([v, l]) => `<button class="${p.theme === v ? 'on' : ''}" data-a="theme" data-x="${v}">${l}</button>`).join('')}</div></div>
      <div class="field"><span>فونت</span><div class="row"><div class="grow"><div class="b">${fonts.length ? esc(p.fontLabel || 'فونت واردشده') : 'وزیرمتن (پیش‌فرض)'}</div><div class="muted xs">${fonts.length ? fa(fonts.length) + ' فایل' : 'برای استفاده از «پیدا»، فایل فونت را وارد کن'}</div></div>
      <label class="btn sm" for="fontIn">${ic('font', 'sm')} وارد کردن</label>${fonts.length ? '<button class="btn sm ghost" data-a="resetFont">حذف</button>' : ''}</div>
      <input type="file" id="fontIn" class="hidden" multiple accept=".ttf,.otf,.woff,.woff2">
      <p class="hint">فایل‌های TTF، OTF یا WOFF2 فونت پیدا (یا هر فونت دیگر) را انتخاب کن؛ وزن‌ها از روی نام فایل تشخیص داده می‌شوند. فقط فونتی را وارد کن که مجوز استفاده‌اش را داری.</p></div></div></div>`;
    html += `<div class="section"><div class="section-h"><h2>داده‌ها</h2></div><div class="card" style="padding:6px 10px">
      <button class="menu-item" data-a="exportData"><span class="mi">${ic('down', 'sm')}</span><div>پشتیبان‌گیری (خروجی JSON)<small>همه هدف‌ها، اقدام‌ها و سوابق</small></div></button>
      <label class="menu-item" for="importIn"><span class="mi">${ic('up', 'sm')}</span><div>بازیابی از فایل پشتیبان<small>جایگزین داده‌های فعلی می‌شود</small></div></label>
      <input type="file" id="importIn" class="hidden" accept=".json,application/json">
      <button class="menu-item red" data-a="wipe"><span class="mi">${ic('trash', 'sm')}</span><div>حذف همه داده‌ها<small>غیرقابل بازگشت</small></div></button></div></div>`;
    html += `<div class="section card small"><div class="b">درباره</div><p class="muted" style="margin-top:6px">هدف به اقدام · نسخه ${fa(Native ? Native.version() : 'وب')}<br>نسخه نمونه اولیه: همه داده‌ها فقط روی همین گوشی ذخیره می‌شوند. مربی این نسخه قاعده‌محور و آفلاین است و به مدل زبانی وصل نیست.</p>
      <p class="muted xs" style="margin-top:8px">فونت وزیرمتن — مجوز SIL Open Font License 1.1 · الگوریتم تقویم جلالی بر پایه jalaali-js (MIT)</p></div>`;
    return { html, after: bindFileInputs };
  },
};

/* ---------- component helpers ---------- */
function minutesChips(val, act) {
  return `<div class="chips">${[10, 15, 20, 30, 45, 60, 90].map((n) => `<button class="chip ${val === n ? 'on' : ''}" data-a="${act}" data-x="${n}">${fa(n)} دقیقه</button>`).join('')}</div>`;
}
function daysPicker(days, act) {
  return `<div class="days">${WEEKDAYS_SHORT.map((l, i) => `<button class="chip ${days.includes(i) ? 'on' : ''}" data-a="${act}" data-x="${i}" aria-label="${WEEKDAYS[i]}">${l}</button>`).join('')}</div>`;
}
function catChips(sel) {
  return Object.entries(CATS).map(([k, c]) => `<button class="chip sm ${sel === k ? 'on' : ''}" data-a="newCat" data-x="${k}">${c.icon} ${c.label}</button>`).join('');
}
function jPicker(id, value) {
  const j = D.j(value), ty = D.j(D.today()).jy;
  const ml = Jalali.monthLength(j.jy, j.jm);
  return `<div class="three" data-jp="${id}">
    <select data-jp="${id}" data-part="d">${Array.from({ length: ml }, (_, i) => `<option value="${i + 1}" ${i + 1 === j.jd ? 'selected' : ''}>${fa(i + 1)}</option>`).join('')}</select>
    <select data-jp="${id}" data-part="m">${J_MONTHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === j.jm ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <select data-jp="${id}" data-part="y">${[0, 1, 2, 3].map((k) => `<option value="${ty + k}" ${ty + k === j.jy ? 'selected' : ''}>${fa(ty + k)}</option>`).join('')}</select></div>`;
}
function readJPicker(id) {
  const get = (p) => +document.querySelector(`select[data-jp="${id}"][data-part="${p}"]`).value;
  const y = get('y'), m = get('m');
  return D.fromJ(y, m, Math.min(get('d'), Jalali.monthLength(y, m)));
}
function occRow(o, isTop) {
  const done = o.status === 'done';
  return `<div class="occ ${o.status} ${isTop ? 'top' : ''}" data-a="occMenu" data-k="${o.key}">
    <button class="check" data-a="${done ? 'undo' : 'done'}" data-k="${o.key}" aria-label="${done ? 'لغو انجام' : 'انجام شد'}">${ic('check')}</button>
    <div class="grow"><div class="occ-title">${esc(o.a.title)}</div><div class="occ-meta">${catIcon(o.g.category)} ${esc(o.g.title)} · ${fa(o.a.minutes)} دقیقه${o.time ? ' · ' + faTime(o.r && o.r.status === 'snoozed' && o.r.until ? o.r.until : o.time) : ''}${o.r && o.r.movedFrom ? ' · جابه‌جاشده' : ''}${o.r && o.r.status === 'snoozed' ? ' · به تعویق افتاد' : ''}</div></div>
    ${STATUS_BADGE[o.status] || (o.a.priority === 3 ? '<span class="badge pri">مهم</span>' : '')}</div>`;
}
function goalCard(g) {
  const p = goalProgress(g), cur = currentMilestone(g);
  return `<button class="card goal" data-a="go" data-x="goal" data-id="${g.id}"><div class="row"><div class="gi">${catIcon(g.category)}</div>
    <div class="grow"><h3>${esc(g.title)}</h3><div class="muted xs">${(CATS[g.category] || CATS.other).label} · تا ${D.fmt(g.deadline)}</div></div>
    <span class="badge ${g.status === 'completed' ? 'ok' : g.status === 'active' ? 'pri' : ''}">${goalStatusText(g)}</span></div>
    <div class="row" style="margin-top:12px"><div class="grow">${bar(p, g.status === 'active' ? expectedProgress(g) : null)}</div><b class="small">${pct(p)}</b></div>
    ${cur && g.status === 'active' ? `<div class="muted xs" style="margin-top:6px">مرحله جاری: ${esc(cur.title)}</div>` : ''}</button>`;
}
function sugCard(s, compact) {
  return `<div class="card sug" style="margin-top:12px"><div class="row"><span style="font-size:20px">${s.icon}</span><div class="grow"><div class="b">${compact ? 'برنامه را سبک‌تر کنیم؟' : esc(s.title)}</div><div class="muted xs">${esc(s.subject)}</div></div></div>
    <p class="small" style="margin-top:8px">${esc(s.why)}</p>
    <div class="ba"><div><div class="muted xs">الان</div>${esc(s.before)}</div><span class="muted">←</span><div class="after"><div class="muted xs">پیشنهاد</div>${esc(s.after)}</div></div>
    <div class="btns"><button class="btn sm primary" data-a="sugApply" data-x="${s.id}">اعمال</button><button class="btn sm outline" data-a="sugReject" data-x="${s.id}">نه، ممنون</button></div></div>`;
}
function chart14() {
  const t = D.today(), data = [];
  for (let i = 13; i >= 0; i -= 1) { const d = D.add(t, -i); data.push({ d, n: occurrencesOn(d).filter((o) => o.status === 'done').length }); }
  const max = Math.max(1, ...data.map((x) => x.n)), W = 320, H = 130, bw = W / 14;
  const bars = data.map((x, i) => {
    const h = (x.n / max) * (H - 34), xPos = W - (i + 1) * bw + 4;
    return `<rect x="${xPos}" y="${H - 20 - h}" width="${bw - 8}" height="${Math.max(h, 2)}" rx="4" fill="${x.d === t ? 'url(#gradRing)' : 'var(--primary)'}" opacity="${x.n ? 1 : 0.18}"/>
      ${x.n ? `<text x="${xPos + (bw - 8) / 2}" y="${H - 24 - h}" text-anchor="middle">${fa(x.n)}</text>` : ''}
      <text x="${xPos + (bw - 8) / 2}" y="${H - 4}" text-anchor="middle">${WEEKDAYS_SHORT[D.wd(x.d)]}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${bars}</svg>`;
}
function renderMsg(m) {
  if (m.from === 'me') return `<div class="msg me">${esc(m.text)}</div>`;
  return m.cards.map((c) => {
    if (c.type === 'text') return `<div class="msg bot">${c.text}</div>`;
    if (c.type === 'goal') { const g = goalById(c.goalId); return g ? `<div class="msg bot card-msg"><div class="b">${catIcon(g.category)} ${esc(g.title)}</div><div class="small">${c.text}</div>${bar(goalProgress(g), expectedProgress(g))}</div>` : ''; }
    if (c.type === 'suggestions') { const all = suggestions(); return all.filter((s) => c.ids.includes(s.id)).map((s) => `<div class="msg bot card-msg" style="padding:0;background:none;box-shadow:none">${sugCard(s, false)}</div>`).join(''); }
    if (c.type === 'occ') { const o = occByKey(c.key); return o ? `<div class="msg bot">${c.text}</div><div class="msg bot card-msg" style="padding:0;background:none;box-shadow:none">${occRow(o)}</div>` : ''; }
    if (c.type === 'split') return `<div class="msg bot">${c.text}</div>` + c.ids.map((id) => { const a = actById(id); return a && a.status === 'active' ? `<div class="msg bot card-msg"><div class="row"><div class="grow"><div class="b small">${esc(a.title)}</div><div class="muted xs">${fa(a.minutes)} دقیقه ← دو بخش ${fa(clamp(round5(a.minutes / 2), 5, 60))} دقیقه‌ای</div></div><button class="btn sm" data-a="splitAction" data-x="${a.id}">خرد کن</button></div></div>` : ''; }).join('');
    if (c.type === 'smart') {
      const p = c.parsed;
      return `<div class="msg bot card-msg"><div class="muted xs">پیشنهاد SMART</div><div class="b" style="margin:4px 0">${esc(p.title)}</div>
        <div class="chips" style="margin:8px 0"><span class="badge pri">${catIcon(p.category)} ${CATS[p.category].label}</span>${p.number != null ? `<span class="badge ok">${faNum(p.number)} ${esc(p.unit)}</span>` : ''}${p.deadline ? `<span class="badge ok">تا ${D.fmt(p.deadline)}</span>` : ''}</div>
        ${c.missing.length ? `<p class="small">برای دقیق شدن، این‌ها را هم مشخص کن: <b>${c.missing.join('، ')}</b>.</p>` : '<p class="small">هدف تو تقریباً کامل است. فقط زمان روزانه و انگیزه را اضافه کن.</p>'}
        <button class="btn sm primary" style="margin-top:10px" data-a="coachGoal" data-x="${esc(p.raw)}">ساخت هدف با این پیشنهاد</button></div>`;
    }
    return '';
  }).join('');
}

/* ---------- live inputs ---------- */
function updateDetect() {
  const ta = document.getElementById('goalText');
  if (!ta) return;
  const v = ta.value;
  document.getElementById('cnt').textContent = fa(v.length) + '/۲۰۰';
  document.getElementById('goalNext').disabled = v.trim().length < 4;
  const el = document.getElementById('detect');
  if (v.trim().length < 6) { el.textContent = ''; return; }
  const p = parseGoal(v);
  const bits = [CATS[p.category].icon + ' ' + CATS[p.category].label];
  if (p.number != null) bits.push(faNum(p.number) + (p.unit ? ' ' + p.unit : ''));
  if (p.deadline) bits.push('تا ' + D.fmt(p.deadline));
  el.textContent = 'تشخیص: ' + bits.join(' · ');
}
document.addEventListener('input', (e) => {
  const el = e.target, f = el.dataset && el.dataset.f;
  if (!f) return;
  const v = el.value;
  if (f === 'newText') { DRAFT = DRAFT || {}; DRAFT._text = v; updateDetect(); return; }
  if (f.startsWith('p.')) {
    const k = f.slice(2);
    if (k.startsWith('times.')) S.profile.times[+k.split('.')[1]] = v || S.profile.times[+k.split('.')[1]];
    else S.profile[k] = v;
    clearTimeout(window.__pt); window.__pt = setTimeout(commit, 400);
    return;
  }
  if (f.startsWith('d.')) {
    const k = f.slice(2);
    if (k === 'startValue' || k === 'targetValue') {
      DRAFT[k] = parseNum(v);
      if (k === 'startValue' && DRAFT.delta && DRAFT.startValue != null) {
        DRAFT.targetValue = Math.round((DRAFT.startValue + (DRAFT.direction === 'down' ? -1 : 1) * DRAFT.delta) * 10) / 10;
        const tv = document.getElementById('tv'); if (tv) tv.value = fa(DRAFT.targetValue);
      }
    } else DRAFT[k] = v;
    return;
  }
  if (f.startsWith('af.')) { window.__AF[f.slice(3)] = v; }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.jp) {
    const id = el.dataset.jp, val = readJPicker(id);
    if (id === 'dl') { DRAFT.deadline = val; render(); }
    if (id === 'af') { window.__AF.rec.date = val; }
    if (id === 'mv') { window.__MV = val; }
    if (id === 'gdl') { window.__GDL = val; }
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'coachIn') { e.preventDefault(); A.coachSend(); }
});

/* ---------- actions ---------- */
function afterDone(res) {
  if (!res) return;
  haptic();
  const occs = occurrencesOn(D.today());
  const next = topAction(occs);
  const conf = Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 4.6) % 100}%;background:${['#4F46E5', '#7C3AED', '#16A34A', '#F59E0B', '#EA580C'][i % 5]};animation-delay:${(i % 6) * 0.08}s"></i>`).join('');
  let msg = 'عالی! یک قدم دیگر به هدفت نزدیک شدی.';
  if (res.goalDone) msg = 'تبریک! به هدفت رسیدی 🏁';
  else if (res.msDone) msg = 'یک مرحله مهم را تمام کردی. مرحله بعدی آماده است.';
  Sheet.open(`<div class="celebrate"><div class="confetti">${conf}</div><div class="big">${res.goalDone ? '🏆' : res.msDone ? '🎖️' : '🎉'}</div>
    <h2 style="margin-top:8px">${msg}</h2>${res.xp ? `<div class="xpgain"><span class="ltr">+${fa(res.xp)} XP</span></div>` : ''}
    ${res.notes.map((n) => `<p class="muted xs">${n}</p>`).join('')}
    <div class="card soft" style="margin-top:12px;text-align:start"><div class="row between small"><span class="ellipsis grow">${catIcon(res.g.category)} ${esc(res.g.title)}</span><b>${pct(res.after)}</b></div><div style="margin-top:8px" id="celBar">${bar(res.before)}</div></div>
    <div class="row" style="justify-content:center;margin-top:10px"><span class="pill streak">🔥 ${fa(streak())} روز پیاپی</span></div></div>
    <div class="stack" style="margin-top:16px">${next ? `<button class="btn primary block" data-a="nextAction" data-k="${next.key}">اقدام بعدی: ${esc(next.a.title)}</button>` : ''}<button class="btn outline block" data-a="closeSheet">بستن</button></div>`);
  setTimeout(() => { const b = document.querySelector('#celBar i'); if (b) b.style.width = clamp(res.after, 0, 1) * 100 + '%'; }, 80);
}
function doDone(key) {
  const o = occByKey(key);
  if (!o) return;
  if (o.a.kind === 'log') { openLogSheet(o.g, key); return; }
  const res = markDone(key);
  TIMER = null;
  if (Nav.cur().name === 'timer') Nav.stack.pop();
  render();
  afterDone(res);
}
function openLogSheet(g, key) {
  Sheet.open(`<h2>ثبت مقدار فعلی</h2><p class="muted small">${esc(g.title)}</p>
    <label class="field" style="margin-top:14px"><span>مقدار فعلی (${esc(g.unit)})</span><input id="logIn" inputmode="decimal" value="${fa(g.currentValue)}"></label>
    <p class="hint">قبلی: ${faNum(g.currentValue)} · هدف: ${faNum(g.targetValue)} ${esc(g.unit)}</p><div class="err" id="logErr"></div>
    <button class="btn primary block" style="margin-top:14px" data-a="saveLog" data-x="${g.id}" data-k="${key || ''}">ثبت</button>`);
  setTimeout(() => { const i = document.getElementById('logIn'); if (i) { i.focus(); i.select(); } }, 150);
}
function occMenu(key) {
  const o = occByKey(key);
  if (!o) return;
  const done = o.status === 'done';
  const snz = (o.r && o.r.snoozes) || 0;
  Sheet.open(`<div class="b" style="font-size:16px">${esc(o.a.title)}</div><p class="muted small">${catIcon(o.g.category)} ${esc(o.g.title)} · ${fa(o.a.minutes)} دقیقه · ${D.rel(o.date)}</p>
    <div style="margin-top:10px">
    ${done ? `<button class="menu-item" data-a="undo" data-k="${key}"><span class="mi">${ic('undo', 'sm')}</span>لغو «انجام شد»</button>` : `<button class="menu-item" data-a="done" data-k="${key}"><span class="mi">${ic('check', 'sm')}</span>انجام شد</button>
    <button class="menu-item" data-a="startTimer" data-k="${key}"><span class="mi">${ic('play', 'sm')}</span>شروع با تایمر</button>
    ${o.date === D.today() ? `<div class="menu-item" style="cursor:default"><span class="mi">${ic('clock', 'sm')}</span><div class="grow">بعداً${snz ? ` <small>${fa(3 - snz)} بار دیگر ممکن است</small>` : ''}</div><div class="chips">${[10, 30, 60].map((m) => `<button class="chip sm" data-a="snooze" data-k="${key}" data-x="${m}" ${snz >= 3 ? 'disabled' : ''}>${fa(m)} دقیقه</button>`).join('')}</div></div>` : ''}
    <button class="menu-item" data-a="moveSheet" data-k="${key}"><span class="mi">${ic('cal', 'sm')}</span><div>جابه‌جایی به روز یا ساعت دیگر</div></button>
    <button class="menu-item" data-a="skip" data-k="${key}"><span class="mi">${ic('skip', 'sm')}</span><div>رد کردن<small>شکست ثبت نمی‌شود و Streak حفظ می‌شود</small></div></button>
    <button class="menu-item" data-a="missSheet" data-k="${key}"><span class="mi">${ic('x', 'sm')}</span><div>انجام نشد<small>با ثبت دلیل، برنامه بهتر تنظیم می‌شود</small></div></button>`}
    <button class="menu-item" data-a="openAction" data-x="${o.a.id}"><span class="mi">${ic('chev', 'sm')}</span>جزئیات اقدام</button></div>`);
}

const A = {
  back() { Nav.back(); },
  tab(el) { Sheet.close(); Nav.tab(el.dataset.x); },
  go(el) { Sheet.close(); Nav.go(el.dataset.x, { id: el.dataset.id }); },
  closeSheet() { Sheet.close(); },
  onbNext() { ONB += 1; render(); },
  onbSkip() { ONB = 3; render(); },
  onbDone() { S.profile.onboarded = true; commit(); Nav.stack = [{ name: 'today', params: {} }]; Nav.go('goalNew'); },
  setProfMin(el) { S.profile.dailyMinutes = +el.dataset.x; commit(); render(); },
  togProfDay(el) {
    const d = +el.dataset.x, a = S.profile.days;
    S.profile.days = a.includes(d) ? (a.length > 1 ? a.filter((x) => x !== d) : a) : a.concat(d).sort();
    commit(); render();
  },
  newGoal() { DRAFT = { _text: '', _cat: '' }; Nav.go('goalNew'); },
  example(el) {
    if (Nav.cur().name !== 'goalNew') { DRAFT = { _text: el.dataset.x, _cat: '' }; Nav.go('goalNew'); return; }
    DRAFT._text = el.dataset.x; const ta = document.getElementById('goalText'); ta.value = el.dataset.x; updateDetect();
  },
  newCat(el) { DRAFT._cat = DRAFT._cat === el.dataset.x ? '' : el.dataset.x; document.getElementById('catChips').innerHTML = catChips(DRAFT._cat); },
  goalNext() {
    const text = DRAFT._text.trim(), cat = DRAFT._cat;
    const p = parseGoal(text);
    if (cat) p.category = cat;
    DRAFT = draftFromParse(p); DRAFT._text = text; DRAFT._cat = cat;
    WSTEP = 0; WERR = '';
    Nav.go('wizard');
  },
  coachGoal(el) {
    const p = parseGoal(el.dataset.x);
    DRAFT = draftFromParse(p); DRAFT._text = el.dataset.x; WSTEP = 0; WERR = '';
    Nav.go('wizard');
  },
  wCat(el) { DRAFT.category = el.dataset.x; render(); },
  wMeasure(el) {
    DRAFT.measure = el.dataset.x;
    if (DRAFT.measure === 'value') { if (DRAFT.startValue == null && !DRAFT.delta) DRAFT.startValue = 0; if (!DRAFT.unit) DRAFT.unit = (UNIT_HINTS[DRAFT.category] || ['واحد'])[0]; }
    WERR = ''; render();
  },
  wUnit(el) { DRAFT.unit = el.dataset.x; render(); },
  wMin(el) { DRAFT.dailyMinutes = +el.dataset.x; render(); },
  wDay(el) { const d = +el.dataset.x, a = DRAFT.days; DRAFT.days = a.includes(d) ? a.filter((x) => x !== d) : a.concat(d).sort(); render(); },
  wWhy(el) { DRAFT.why = DRAFT.why ? DRAFT.why + '، ' + el.dataset.x.replace(/^برای /, '') : el.dataset.x; render(); },
  wStart(el) { DRAFT.startDate = el.dataset.x; render(); },
  wDeadline(el) { DRAFT.deadline = el.dataset.x; render(); },
  wPrev() { WERR = ''; WSTEP -= 1; render(); },
  wNext() {
    const d = DRAFT;
    WERR = '';
    if (WSTEP === 0 && d.title.trim().split(/\s+/).length < 2) WERR = 'عنوان را کمی دقیق‌تر بنویس (حداقل دو کلمه، مثل «خواندن ۱۲ کتاب»).';
    if (WSTEP === 1 && d.measure === 'value') {
      if (!String(d.unit || '').trim()) WERR = 'واحد اندازه‌گیری را مشخص کن.';
      else if (d.startValue == null || d.targetValue == null) WERR = 'مقدار فعلی و مقدار هدف را وارد کن.';
      else if (d.startValue === d.targetValue) WERR = 'مقدار هدف باید با مقدار فعلی فرق داشته باشد.';
    }
    if (WSTEP === 2 && !d.days.length) WERR = 'حداقل یک روز از هفته را انتخاب کن.';
    if (WSTEP === 4) {
      if (!d.deadline) WERR = 'مهلت را مشخص کن.';
      else {
        const span = D.diff(d.startDate, d.deadline);
        if (span < 7) WERR = 'مهلت باید حداقل ۷ روز بعد از شروع باشد.';
        else if (span > 1095) WERR = 'مهلت حداکثر ۳ سال است؛ برای هدف‌های بلندتر، یک بخش سه‌ساله تعریف کن.';
      }
    }
    if (WERR) { render(); return; }
    if (WSTEP < 4) { WSTEP += 1; render(); window.scrollTo(0, 0); return; }
    PLAN = planGoal(DRAFT);
    Nav.go('result');
  },
  applyFix(el) {
    const f = PLAN.fixes[+el.dataset.x];
    if (f.kind === 'deadline') DRAFT.deadline = f.value;
    if (f.kind === 'minutes') DRAFT.dailyMinutes = f.value;
    if (f.kind === 'target') DRAFT.targetValue = f.value;
    PLAN = planGoal(DRAFT); render(); toast('برنامه دوباره محاسبه شد');
  },
  createGoal() {
    const g = createGoal(DRAFT, PLAN);
    DRAFT = null; PLAN = null;
    Nav.stack = [{ name: 'today', params: {} }, { name: 'goal', params: { id: g.id } }];
    render(); window.scrollTo(0, 0);
    toast('مسیر هدف ساخته شد 🎯');
    if (Native && !Native.notificationsAllowed() && !S.profile.notifAsked) {
      S.profile.notifAsked = true; commit();
      Sheet.open(`<div class="center"><div style="font-size:48px">🔔</div><h2>یادآوری‌ها را روشن کنیم؟</h2><p class="muted small" style="margin:8px 0 16px">سر وقت هر اقدام یک اعلان کوتاه می‌فرستیم. حداکثر ${fa(S.profile.maxNotif)} اعلان در روز و هیچ اعلانی در ساعات سکوت.</p></div>
        <button class="btn primary block" data-a="askNotif">بله، روشن کن</button><button class="btn ghost block" data-a="closeSheet">بعداً</button>`);
    }
  },
  goalFilter(el) { GOAL_FILTER = el.dataset.x; render(); },
  goalMenu(el) {
    const g = goalById(el.dataset.x);
    Sheet.open(`<div class="b" style="font-size:16px">${esc(g.title)}</div><div style="margin-top:8px">
      <button class="menu-item" data-a="editGoal" data-x="${g.id}"><span class="mi">${ic('edit', 'sm')}</span>ویرایش عنوان و انگیزه</button>
      ${g.status === 'active' ? `<button class="menu-item" data-a="deadlineSheet" data-x="${g.id}"><span class="mi">${ic('cal', 'sm')}</span><div>تغییر مهلت<small>مرحله‌های باقی‌مانده متناسب جابه‌جا می‌شوند</small></div></button>` : ''}
      ${g.status === 'active' ? `<button class="menu-item" data-a="pauseGoal" data-x="${g.id}"><span class="mi">${ic('pause', 'sm')}</span>توقف موقت</button>` : ''}
      ${g.status === 'paused' ? `<button class="menu-item" data-a="resumeGoal" data-x="${g.id}"><span class="mi">${ic('play', 'sm')}</span>ادامه هدف</button>` : ''}
      ${g.status !== 'archived' ? `<button class="menu-item" data-a="archiveGoal" data-x="${g.id}"><span class="mi">${ic('down', 'sm')}</span>بایگانی</button>` : ''}
      <button class="menu-item red" data-a="deleteGoal" data-x="${g.id}"><span class="mi">${ic('trash', 'sm')}</span>حذف هدف</button></div>`);
  },
  editGoal(el) {
    const g = goalById(el.dataset.x);
    Sheet.open(`<h2>ویرایش هدف</h2><label class="field" style="margin-top:12px"><span>عنوان</span><input id="egT" value="${esc(g.title)}" maxlength="120"></label>
      <label class="field"><span>چرا برایت مهم است؟</span><textarea id="egW" maxlength="160">${esc(g.why)}</textarea></label>
      <button class="btn primary block" style="margin-top:14px" data-a="saveGoalEdit" data-x="${g.id}">ذخیره</button>`);
  },
  saveGoalEdit(el) {
    const g = goalById(el.dataset.x), t = document.getElementById('egT').value.trim();
    if (t.length < 3) { toast('عنوان خیلی کوتاه است'); return; }
    g.title = t; g.why = document.getElementById('egW').value.trim(); commit(); Sheet.close(); render();
  },
  deadlineSheet(el) {
    const g = goalById(el.dataset.x);
    window.__GDL = g.deadline;
    Sheet.open(`<h2>تغییر مهلت</h2><p class="muted small">مهلت فعلی: ${D.fmt(g.deadline)}</p><div style="margin-top:12px">${jPicker('gdl', g.deadline)}</div>
      <button class="btn primary block" style="margin-top:14px" data-a="saveDeadline" data-x="${g.id}">ذخیره</button>`);
  },
  saveDeadline(el) {
    const g = goalById(el.dataset.x), nd = window.__GDL;
    if (nd <= D.add(D.today(), 6)) { toast('مهلت باید حداقل ۷ روز بعد از امروز باشد'); return; }
    extendGoal(g, nd); commit(); Sheet.close(); render(); toast('مهلت به‌روز شد');
  },
  pauseGoal(el) { const g = goalById(el.dataset.x); g.status = 'paused'; g.pausedAt = D.today(); commit(); Sheet.close(); render(); },
  resumeGoal(el) { const g = goalById(el.dataset.x); g.status = 'active'; delete g.pausedAt; commit(); Sheet.close(); render(); },
  archiveGoal(el) { const g = goalById(el.dataset.x); g.status = 'archived'; g.endedAt = D.today(); commit(); Sheet.close(); Nav.back(); },
  deleteGoal(el) {
    Sheet.open(`<h2>حذف هدف؟</h2><p class="muted small" style="margin:8px 0 16px">همه مرحله‌ها، اقدام‌ها و سوابق این هدف حذف می‌شوند و قابل بازگشت نیست.</p>
      <div class="btns"><button class="btn outline" data-a="closeSheet">انصراف</button><button class="btn danger" data-a="deleteGoalYes" data-x="${el.dataset.x}">حذف</button></div>`);
  },
  deleteGoalYes(el) { deleteGoal(goalById(el.dataset.x)); Sheet.close(); Nav.stack = [{ name: 'goals', params: {} }]; render(); toast('هدف حذف شد'); },
  logValue(el) { openLogSheet(goalById(el.dataset.x)); },
  saveLog(el) {
    const g = goalById(el.dataset.x), v = parseNum(document.getElementById('logIn').value);
    if (v == null) { document.getElementById('logErr').textContent = 'یک عدد معتبر وارد کن.'; return; }
    const key = el.dataset.k;
    const before = goalProgress(g);
    const r1 = logValue(g, v);
    Sheet.close();
    if (key) {
      const res = markDone(key);
      if (res) { res.before = before; res.after = goalProgress(g); if (r1.goalDone && !res.goalDone) { res.goalDone = true; res.xp += XP_RULES.goal; } }
      render(); afterDone(res);
    } else { render(); toast(r1.goalDone ? 'تبریک! به هدفت رسیدی 🏁' : 'مقدار جدید ثبت شد'); }
  },
  occMenu(el) { occMenu(el.dataset.k); },
  openAction(el) { Sheet.close(); Nav.go('action', { id: el.dataset.x }); },
  done(el) { Sheet.close(); doDone(el.dataset.k); },
  nextAction(el) { Sheet.close(); occMenu(el.dataset.k); },
  undo(el) { Sheet.close(); undoDone(el.dataset.k); render(); toast('ثبت انجام لغو شد'); },
  snooze(el) { if (snooze(el.dataset.k, +el.dataset.x)) toast(`${fa(el.dataset.x)} دقیقه دیگر یادآوری می‌کنیم`); else toast('حداکثر ۳ بار در روز می‌توانی تعویق بدهی'); Sheet.close(); render(); },
  skip(el) { setStatus(el.dataset.k, 'skipped'); Sheet.close(); render(); toast('رد شد؛ Streak تو حفظ می‌شود'); },
  missSheet(el) {
    Sheet.open(`<h2>چرا انجام نشد؟</h2><p class="muted small">صادقانه بگو؛ از روی همین، برنامه را اصلاح می‌کنیم.</p><div style="margin-top:10px">${MISS_REASONS.map(([k, l]) => `<button class="menu-item" data-a="miss" data-k="${el.dataset.k}" data-x="${k}">${l}</button>`).join('')}</div>`);
  },
  miss(el) { setStatus(el.dataset.k, 'missed', el.dataset.x); Sheet.close(); render(); toast('ثبت شد. اگر تکرار شود، پیشنهاد اصلاح می‌دهیم.'); },
  reasonY(el) { setStatus(el.dataset.k, 'missed', el.dataset.x); render(); },
  moveSheet(el) {
    const o = occByKey(el.dataset.k), t = D.today();
    window.__MV = D.add(t, 1);
    Sheet.open(`<h2>جابه‌جایی اقدام</h2><p class="muted small">${esc(o.a.title)}</p>
      <div class="chips" style="margin-top:12px">${[['امروز', t], ['فردا', D.add(t, 1)], ['پس‌فردا', D.add(t, 2)]].map(([l, v]) => `<button class="chip" data-a="mvPick" data-x="${v}">${l}</button>`).join('')}</div>
      <div class="field" style="margin-top:12px"><span>یا تاریخ دیگر</span>${jPicker('mv', D.add(t, 1))}</div>
      <label class="field"><span>ساعت</span><input type="time" id="mvTime" value="${o.time || '18:00'}"></label>
      <button class="btn primary block" style="margin-top:14px" data-a="moveDo" data-k="${el.dataset.k}">جابه‌جا کن</button>`);
  },
  mvPick(el) {
    window.__MV = el.dataset.x;
    const j = D.j(el.dataset.x);
    document.querySelector('select[data-jp="mv"][data-part="y"]').value = j.jy;
    document.querySelector('select[data-jp="mv"][data-part="m"]').value = j.jm;
    document.querySelector('select[data-jp="mv"][data-part="d"]').value = j.jd;
    document.querySelectorAll('[data-a="mvPick"]').forEach((c) => c.classList.toggle('on', c === el));
  },
  moveDo(el) {
    const to = window.__MV, time = document.getElementById('mvTime').value;
    if (to < D.today()) { toast('تاریخ گذشته را نمی‌شود انتخاب کرد'); return; }
    if (!moveOcc(el.dataset.k, to, time)) { toast('این اقدام در آن روز هم برنامه دارد؛ روز دیگری انتخاب کن'); return; }
    Sheet.close(); render(); toast('جابه‌جا شد به ' + D.rel(to));
  },
  startTimer(el) { Sheet.close(); TIMER = null; Nav.go('timer', { key: el.dataset.k }); },
  timerToggle() { TIMER.running = !TIMER.running; TIMER.last = Date.now(); render(); },
  sugApply(el) {
    const s = suggestions().find((x) => x.id === el.dataset.x);
    if (s) { applySuggestion(s); toast('برنامه به‌روز شد ✓'); }
    render();
  },
  sugReject(el) {
    const s = suggestions().find((x) => x.id === el.dataset.x);
    if (s) rejectSuggestion(s);
    render();
  },
  addAction(el) { window.__AF = null; Nav.go('actionEdit', { msId: el.dataset.x }); },
  editAction(el) { window.__AF = null; Nav.go('actionEdit', { id: el.dataset.x }); },
  afMin(el) { window.__AF.minutes = +el.dataset.x; render(); },
  afPri(el) { window.__AF.priority = +el.dataset.x; render(); },
  afRec(el) {
    const F = window.__AF, t = el.dataset.x;
    F.rec = t === 'once' ? { type: 'once', date: F.rec.date || D.today() } : t === 'daily' ? { type: 'daily' } : { type: 'weekly', days: F.rec.days || [0, 1, 2, 3, 4, 5] };
    render();
  },
  afDay(el) { const F = window.__AF, d = +el.dataset.x, a = F.rec.days || []; F.rec.days = a.includes(d) ? a.filter((x) => x !== d) : a.concat(d).sort(); render(); },
  afRemind() { window.__AF.remind = !window.__AF.remind; render(); },
  saveAction(el) {
    const F = window.__AF, err = document.getElementById('afErr');
    const title = String(F.title || '').trim();
    if (title.split(/\s+/).length < 2) { err.textContent = 'عنوان را مشخص‌تر بنویس (حداقل دو کلمه).'; return; }
    if (F.rec.type === 'weekly' && !(F.rec.days || []).length) { err.textContent = 'حداقل یک روز انتخاب کن.'; return; }
    const ms = msById(el.dataset.ms), today = D.today();
    const from = today > ms.start ? today : ms.start;
    const days = F.rec.type === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : F.rec.days;
    if (el.dataset.x) {
      const a = actById(el.dataset.x);
      const recChanged = JSON.stringify(a.rec) !== JSON.stringify(F.rec);
      Object.assign(a, { title: fa(title), desc: F.desc, minutes: F.minutes, priority: F.priority, time: F.time, remind: F.remind });
      if (recChanged) changeRec(a, F.rec);
      commit(); window.__AF = null; Nav.back(); toast('ذخیره شد');
    } else {
      if (F.rec.type === 'once' && F.rec.date < today) { err.textContent = 'تاریخ گذشته است.'; return; }
      const target = F.rec.type === 'once' ? 1 : Math.max(1, countDays(from, ms.end, days));
      S.actions.push({ id: uid(), goalId: ms.goalId, msId: ms.id, title: fa(title), desc: F.desc, minutes: F.minutes, priority: F.priority, kind: 'task',
        rec: F.rec, recHist: [], time: F.time, remind: F.remind, target, status: 'active', createdAt: Date.now(), manual: true, from });
      if (ms.completedAt) { ms.completedAt = null; removeXP('ms:' + ms.id); }
      commit(); window.__AF = null; Nav.back(); toast('اقدام اضافه شد');
    }
  },
  splitAction(el) {
    const a = actById(el.dataset.x);
    splitAction(a); Sheet.close();
    if (Nav.cur().name === 'action') Nav.back(); else render();
    toast('به دو بخش کوچک‌تر تقسیم شد');
  },
  toggleAction(el) {
    const a = actById(el.dataset.x);
    if (a.status === 'paused') { a.status = 'active'; delete a.pausedAt; } else { a.status = 'paused'; a.pausedAt = D.today(); }
    commit(); render();
  },
  deleteAction(el) {
    Sheet.open(`<h2>حذف اقدام؟</h2><p class="muted small" style="margin:8px 0 16px">سوابق انجام این اقدام هم حذف می‌شود.</p><div class="btns"><button class="btn outline" data-a="closeSheet">انصراف</button><button class="btn danger" data-a="deleteActionYes" data-x="${el.dataset.x}">حذف</button></div>`);
  },
  deleteActionYes(el) {
    const id = el.dataset.x;
    S.actions = S.actions.filter((a) => a.id !== id);
    for (const k of Object.keys(S.occ)) if (k.startsWith(id + '|')) { delete S.occ[k]; removeXP(k); }
    commit(); Sheet.close(); Nav.back(); toast('اقدام حذف شد');
  },
  coachQuick(el) { coachAsk(el.dataset.x); },
  coachSend() { const i = document.getElementById('coachIn'); if (i && i.value.trim()) coachAsk(i.value.trim()); },
  askNotif() { Sheet.close(); if (!Native) return; if (Native.sdk() >= 33) Native.requestNotifications(); else Native.openNotificationSettings(); },
  exactAlarm() { Native.openExactAlarmSettings(); },
  battery() { Native.openBatterySettings(); },
  maxN(el) { S.profile.maxNotif = clamp(S.profile.maxNotif + +el.dataset.x, 1, 10); commit(); render(); },
  togSet(el) { S.profile[el.dataset.x] = !S.profile[el.dataset.x]; commit(); render(); },
  theme(el) { S.profile.theme = el.dataset.x; commit(); applyTheme(); render(); },
  resetFont() { Persist.fonts.clear(); S.profile.fontLabel = ''; commit(); toast('فونت پیش‌فرض برگشت؛ برای اعمال کامل، اپ را دوباره باز کن'); document.documentElement.style.setProperty('--font', "'Vazirmatn', system-ui, sans-serif"); render(); },
  exportData() {
    const name = 'goal-to-action-backup-' + D.today() + '.json';
    const content = JSON.stringify({ app: 'goal-to-action', format: 1, exportedAt: new Date().toISOString(), state: S }, null, 1);
    if (Native) Native.exportFile(name, content);
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'application/json' })); a.download = name; a.click(); toast('فایل پشتیبان ذخیره شد'); }
  },
  wipe() {
    Sheet.open(`<h2>حذف همه داده‌ها؟</h2><p class="muted small" style="margin:8px 0 16px">همه هدف‌ها، اقدام‌ها، امتیازها و تنظیمات پاک می‌شوند. اگر لازم داری، اول پشتیبان بگیر.</p>
      <div class="btns"><button class="btn outline" data-a="closeSheet">انصراف</button><button class="btn danger" data-a="wipeYes">حذف همه</button></div>`);
  },
  wipeYes() { S = defaultState(); commit(); Sheet.close(); ONB = 0; Nav.stack = [{ name: 'today', params: {} }]; render(); },
};
window.__onTheme = () => applyTheme();
window.__onExport = (ok) => toast(ok ? 'فایل پشتیبان ذخیره شد ✓' : 'ذخیره فایل انجام نشد');
window.__onPermission = (ok) => { toast(ok ? 'یادآوری‌ها روشن شد 🔔' : 'اجازه اعلان داده نشد؛ از تنظیمات قابل تغییر است'); syncReminders(); render(); };
window.__nativeOpen = (key) => { consumeNativeEvents(); const o = occByKey(key); if (o) { Nav.tab('today'); occMenu(key); } };
window.__onResume = () => { consumeNativeEvents(); if (!Sheet.isOpen() && Nav.cur().name !== 'timer') render(); syncReminders(); };

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (!fn) return;
  e.preventDefault(); e.stopPropagation();
  fn(el, e);
});

function coachAsk(text) {
  COACH_LOG.push({ from: 'me', text });
  COACH_LOG.push({ from: 'bot', cards: coachReply(text) });
  if (COACH_LOG.length > 40) COACH_LOG = COACH_LOG.slice(-40);
  render();
}

function tickTimer() {
  clearInterval(window.__ti);
  window.__ti = setInterval(() => {
    if (!TIMER || Nav.cur().name !== 'timer') { clearInterval(window.__ti); return; }
    if (!TIMER.running) return;
    const now = Date.now(), dt = Math.floor((now - TIMER.last) / 1000);
    if (dt < 1) return;
    TIMER.last += dt * 1000;
    TIMER.left = Math.max(0, TIMER.left - dt);
    if (TIMER.left === 0) { TIMER.running = false; haptic(); render(); return; }
    const el = document.getElementById('tt');
    if (el) { const mm = Math.floor(TIMER.left / 60), ss = TIMER.left % 60; el.textContent = fa(pad2(mm)) + ':' + fa(pad2(ss)); }
    const circ = document.querySelectorAll('.timer-ring circle')[1];
    if (circ) { const c = +circ.getAttribute('stroke-dasharray'); circ.setAttribute('stroke-dashoffset', c * (TIMER.left / TIMER.total)); }
  }, 250);
}

/* ---------- files: fonts and backup ---------- */
function fontWeight(name) {
  const n = name.toLowerCase();
  if (/variable|\[wght\]|vf\b/.test(n)) return '100 900';
  if (/thin|hairline/.test(n)) return '100';
  if (/extralight|ultralight|extlt/.test(n)) return '200';
  if (/semibold|demibold|smbd/.test(n)) return '600';
  if (/extrabold|ultrabold|extbd|xbold/.test(n)) return '800';
  if (/black|heavy/.test(n)) return '900';
  if (/light/.test(n)) return '300';
  if (/medium|med\b/.test(n)) return '500';
  if (/bold/.test(n)) return '700';
  return '400';
}
const fontMime = (n) => (/\.woff2$/i.test(n) ? 'font/woff2' : /\.woff$/i.test(n) ? 'font/woff' : /\.otf$/i.test(n) ? 'font/otf' : 'font/ttf');
async function loadUserFonts() {
  const list = Persist.fonts.list();
  if (!list.length) return;
  let ok = 0;
  for (const name of list) {
    const b64 = Persist.fonts.load(name);
    if (!b64) continue;
    try {
      const ff = new FontFace('AppFont', `url(data:${fontMime(name)};base64,${b64})`, { weight: fontWeight(name) });
      await ff.load(); document.fonts.add(ff); ok += 1;
    } catch (e) { /* skip broken file */ }
  }
  if (ok) document.documentElement.style.setProperty('--font', "'AppFont', 'Vazirmatn', system-ui, sans-serif");
}
function readAsBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function bindFileInputs() {
  const fi = document.getElementById('fontIn');
  if (fi) fi.onchange = async () => {
    const files = Array.from(fi.files || []);
    if (!files.length) return;
    let ok = 0, label = '';
    for (const f of files) {
      if (!/\.(ttf|otf|woff2?)$/i.test(f.name)) continue;
      try {
        const b64 = await readAsBase64(f);
        const ff = new FontFace('AppFont', `url(data:${fontMime(f.name)};base64,${b64})`, { weight: fontWeight(f.name) });
        await ff.load();
        if (!Persist.fonts.save(f.name, b64)) continue;
        document.fonts.add(ff); ok += 1;
        label = label || f.name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[-_ ]?(thin|extralight|ultralight|light|regular|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|fd|web|variable|vf|\[wght\])+/gi, '').trim();
      } catch (e) { /* invalid font */ }
    }
    if (ok) {
      S.profile.fontLabel = label || 'فونت واردشده'; commit();
      document.documentElement.style.setProperty('--font', "'AppFont', 'Vazirmatn', system-ui, sans-serif");
      toast(`${fa(ok)} فایل فونت اعمال شد ✓`); render();
    } else toast('فایل فونت معتبری پیدا نشد');
  };
  const ii = document.getElementById('importIn');
  if (ii) ii.onchange = async () => {
    const f = ii.files && ii.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || data.app !== 'goal-to-action' || !data.state || !Array.isArray(data.state.goals)) throw new Error('bad');
      Sheet.open(`<h2>بازیابی پشتیبان؟</h2><p class="muted small" style="margin:8px 0 16px">${fa(data.state.goals.length)} هدف از تاریخ ${D.fmt(D.str(new Date(data.exportedAt)))} پیدا شد. داده‌های فعلی جایگزین می‌شوند.</p>
        <div class="btns"><button class="btn outline" data-a="closeSheet">انصراف</button><button class="btn primary" id="impYes">بازیابی</button></div>`);
      document.getElementById('impYes').onclick = () => {
        S = Object.assign(defaultState(), data.state); S.profile = Object.assign(defaultState().profile, data.state.profile);
        commit(); Sheet.close(); applyTheme(); render(); toast('بازیابی انجام شد ✓');
      };
    } catch (e) { toast('این فایل، پشتیبان معتبر این اپ نیست'); }
  };
}

/* ---------- theme & boot ---------- */
function applyTheme() {
  const pref = S.profile.theme;
  let sysDark = false;
  try { sysDark = Native ? Native.isNightMode() : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) { /* */ }
  const dark = pref === 'dark' || (pref === 'system' && sysDark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  if (Native) try { Native.setSystemBars(dark ? '#12111A' : '#F7F7FB', dark); } catch (e) { /* */ }
}

function boot() {
  S = Persist.load();
  if (!S || !S.profile) S = defaultState();
  S = Object.assign(defaultState(), S);
  S.profile = Object.assign(defaultState().profile, S.profile);
  applyTheme();
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  loadUserFonts();
  consumeNativeEvents();
  render();
  syncReminders();
  const sp = document.getElementById('splash');
  setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 400); }, 650);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !Native) window.__onResume(); });
}
boot();
