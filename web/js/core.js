/* Goal-to-Action — core utilities: digits, Jalali calendar, dates, persistence. */
'use strict';

const FA_DIG = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIG = '٠١٢٣٤٥٦٧٨٩';
const fa = (x) => String(x).replace(/(\d)\.(\d)/g, '$1٫$2').replace(/\d/g, (d) => FA_DIG[d]);
const en = (s) => String(s == null ? '' : s)
  .replace(/[۰-۹]/g, (d) => FA_DIG.indexOf(d))
  .replace(/[٠-٩]/g, (d) => AR_DIG.indexOf(d))
  .replace(/٫/g, '.').replace(/٬/g, ',');
const faNum = (n, dec = 1) => {
  if (n == null || isNaN(n)) return '—';
  const r = Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec);
  const [i, f] = String(Math.abs(r)).split('.');
  const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return (r < 0 ? '−' : '') + fa(grouped + (f ? '٫' + f : ''));
};
const parseNum = (s) => {
  const v = parseFloat(en(s).replace(/,/g, '').trim());
  return isNaN(v) ? null : v;
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 1) & 0x07ffffff; };
const round5 = (m) => Math.max(5, Math.round(m / 5) * 5);

/* ---------- Jalali calendar (algorithm of jalaali-js, MIT) ---------- */
const Jalali = (() => {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const div = (a, b) => ~~(a / b);
  const mod = (a, b) => a - ~~(a / b) * b;
  function jalCal(jy) {
    const bl = breaks.length, gy = jy + 621;
    let leapJ = -14, jp = breaks[0], jm, jump, n, i;
    for (i = 1; i < bl; i += 1) {
      jm = breaks[i]; jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    let leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap, gy, march };
  }
  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }
  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }
  function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy, jm, jd }; }
      k -= 186;
    } else {
      jy -= 1; k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  }
  return {
    toJalali: (gy, gm, gd) => d2j(g2d(gy, gm, gd)),
    toGregorian: (jy, jm, jd) => d2g(j2d(jy, jm, jd)),
    monthLength: (jy, jm) => (jm <= 6 ? 31 : jm <= 11 ? 30 : (jalCal(jy).leap === 0 ? 30 : 29)),
  };
})();

const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/* ---------- dates as local 'YYYY-MM-DD' strings ---------- */
const pad2 = (n) => (n < 10 ? '0' : '') + n;
const D = {
  str(dt) { return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()); },
  parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0); },
  today() { return D.str(new Date()); },
  add(s, n) { const d = D.parse(s); d.setDate(d.getDate() + n); return D.str(d); },
  diff(a, b) { return Math.round((D.parse(b) - D.parse(a)) / 86400000); }, // b - a in days
  wd(s) { return (D.parse(s).getDay() + 1) % 7; }, // 0 = Saturday
  j(s) { const d = D.parse(s); return Jalali.toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()); },
  fromJ(jy, jm, jd) { const g = Jalali.toGregorian(jy, jm, jd); return g.gy + '-' + pad2(g.gm) + '-' + pad2(g.gd); },
  fmt(s, o = {}) {
    if (!s) return '—';
    const j = D.j(s);
    let out = fa(j.jd) + ' ' + J_MONTHS[j.jm - 1];
    if (o.year !== false) out += ' ' + fa(j.jy);
    if (o.weekday) out = WEEKDAYS[D.wd(s)] + ' ' + out;
    return out;
  },
  rel(s) {
    const t = D.today(), n = D.diff(t, s);
    if (n === 0) return 'امروز';
    if (n === 1) return 'فردا';
    if (n === -1) return 'دیروز';
    if (n === 2) return 'پس‌فردا';
    return D.fmt(s, { year: D.j(s).jy !== D.j(t).jy });
  },
  endOfJMonth(jy, jm) { return D.fromJ(jy, jm, Jalali.monthLength(jy, jm)); },
  nowHM() { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); },
  addMin(hm, m) { const [h, mi] = hm.split(':').map(Number); let t = h * 60 + mi + m; t = clamp(t, 0, 23 * 60 + 59); return pad2(Math.floor(t / 60)) + ':' + pad2(t % 60); },
  hmMin(hm) { const [h, m] = hm.split(':').map(Number); return h * 60 + m; },
};
const faTime = (hm) => (hm ? fa(hm) : '');

/* ---------- persistence: native file store on Android, localStorage in a browser ---------- */
const Native = typeof window.Android !== 'undefined' ? window.Android : null;
const Persist = {
  load() {
    try {
      const s = Native ? Native.loadState() : localStorage.getItem('g2a_state');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  },
  save(state) {
    const s = JSON.stringify(state);
    try { if (Native) Native.saveState(s); else localStorage.setItem('g2a_state', s); } catch (e) { /* quota */ }
  },
  fonts: {
    list() {
      try { return Native ? JSON.parse(Native.listFonts()) : JSON.parse(localStorage.getItem('g2a_fonts') || '[]'); } catch (e) { return []; }
    },
    load(name) { try { return Native ? Native.loadFont(name) : localStorage.getItem('g2a_font_' + name); } catch (e) { return null; } },
    save(name, b64) {
      if (Native) { Native.saveFont(name, b64); return true; }
      try {
        const l = Persist.fonts.list(); if (!l.includes(name)) l.push(name);
        localStorage.setItem('g2a_font_' + name, b64); localStorage.setItem('g2a_fonts', JSON.stringify(l));
        return true;
      } catch (e) { return false; }
    },
    clear() {
      if (Native) { Native.clearFonts(); return; }
      Persist.fonts.list().forEach((n) => localStorage.removeItem('g2a_font_' + n));
      localStorage.removeItem('g2a_fonts');
    },
  },
};
