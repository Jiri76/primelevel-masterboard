// Insider Edge layout guard.
//
// Opens the real page at desktop width, opens the newest report, and measures
// every spacing and font size against LOCKED-SPEC below (see
// INSIDER-EDGE-SPACING-SPEC.md). Exits 1 (fails the workflow) if anything has
// drifted. Spacings are measured BY EYE: from the bottom (baseline) of the
// letters above to the top of the tallest letters below, or to the edge of the
// card / underline -- exactly how the person reading the page sees them.
import { chromium } from 'playwright';

const URL = process.env.SPACING_URL || 'http://localhost:8091/insider-edge.html';
const TOL_100 = 1;   // px, for every 100px gap
const TOL_30 = 1.5;  // px, for every 30px gap (line boxes round to whole px)

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForSelector('.report-tile', { timeout: 30000 });
// 1) Before any report is open: title -> "Click a date to open a report." must be 100px.
const empty = await page.evaluate(() => {
  const es = document.querySelector('.empty-state'), h1 = document.querySelector('h1');
  if (!es) return null;
  const c = document.createElement('canvas').getContext('2d');
  const met = (el, txt) => { const s = getComputedStyle(el); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; const m = c.measureText(txt); return { a: m.actualBoundingBoxAscent, fa: m.fontBoundingBoxAscent }; };
  const rect = (el) => { const g = document.createRange(); g.selectNodeContents(el.firstChild || el); return g.getClientRects()[0]; };
  const hb = rect(h1).top + scrollY + met(h1, 'x').fa;
  const eb = rect(es).top + scrollY + met(es, 'x').fa;
  return (eb - met(es, es.textContent.trim()).a) - hb;
});
await page.click('.report-tile');
await page.waitForSelector('.report-body', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const m = await page.evaluate(() => {
  const cs = getComputedStyle, doc = document;
  const c = doc.createElement('canvas').getContext('2d');
  const met = (el, txt) => {
    const s = cs(el);
    c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const t = c.measureText(txt);
    return { a: t.actualBoundingBoxAscent, fa: t.fontBoundingBoxAscent };
  };
  const tns = (el) => {
    const w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? 1 : 2) });
    const a = []; let n; while ((n = w.nextNode())) a.push(n); return a;
  };
  // text lines of an element: [{ base: baseline y, top: top of tallest letters y }]
  const lines = (el) => {
    const out = [];
    tns(el).forEach((tn) => {
      const mm = met(tn.parentElement, tn.nodeValue.trim());
      const g = doc.createRange(); g.selectNodeContents(tn);
      [...g.getClientRects()].forEach((rc) => {
        if (rc.width < 1) return;
        const b = rc.top + scrollY + met(tn.parentElement, 'x').fa;
        let cl = out.find((x) => Math.abs(x.base - b) < 3);
        if (!cl) { cl = { base: b, top: b - mm.a }; out.push(cl); } else cl.top = Math.min(cl.top, b - mm.a);
      });
    });
    return out.sort((x, y) => x.base - y.base);
  };
  const R = (e) => { const b = e.getBoundingClientRect(); return { t: b.top + scrollY, b: b.bottom + scrollY }; };
  const L = lines, first = (e) => L(e)[0], last = (e) => { const l = L(e); return l[l.length - 1]; };

  const h1 = doc.querySelector('h1'), band = doc.querySelector('.report-header-band');
  const title = doc.querySelector('.report-content-title'), date = doc.querySelector('.report-content-date');
  const card = doc.querySelector('.report-content'), body = doc.querySelector('.report-body');
  const hs = [...body.querySelectorAll('h3')];
  const g100 = {}, g30 = {}, g15 = {}, fonts = {};
  const pageFonts = { 'page title "Insider Edge"': cs(h1).fontSize, 'title inside the dark band': cs(title).fontSize, 'date line under the title': cs(date).fontSize };

  g100['page top -> "Insider Edge" letters'] = first(h1).top;
  g100['"Insider Edge" bottom -> card top'] = R(band).t - last(h1).base;
  g100['card top -> title letters'] = first(title).top - R(band).t;
  g100['date line bottom -> band bottom'] = R(band).b - last(date).base;
  if (hs.length) g100['band bottom -> first heading letters'] = first(hs[0]).top - R(band).b;
  hs.forEach((h, i) => {
    const n = h.textContent.trim().slice(0, 18);
    if (i > 0) g100[`last line -> "${n}" letters`] = first(h).top - last(h.previousElementSibling).base;
    g100[`"${n}" underline -> first line letters`] = first(h.nextElementSibling).top - R(h).b;
  });
  const chk = [...body.querySelectorAll('p')].filter((p) => p.querySelector(':scope > em'));
  if (chk.length) {
    g100['last Verdict line -> first check line'] = first(chk[0]).top - last(chk[0].previousElementSibling).base;
    g100['last check line -> card bottom'] = R(card).b - last(chk[chk.length - 1]).base;
    chk.forEach((p, i) => { if (i > 0) g30[`check line ${i} -> ${i + 1}`] = first(p).top - last(chk[i - 1]).base; });
  }
  g15['title -> date line'] = first(date).top - last(title).base;
  hs.forEach((h) => { g15[`"${h.textContent.trim().slice(0, 18)}" letters -> underline`] = R(h).b - parseFloat(cs(h).borderBottomWidth) - last(h).base; });
  g100['card bottom -> page bottom'] = doc.documentElement.scrollHeight - R(card).b;

  // entries: ticker line -> text, text -> next ticker, line pitch inside paragraphs
  const entries = [...body.querySelectorAll('li, p')].filter((e) => e.querySelector(':scope > .entry-head'));
  const pitches = new Set();
  entries.forEach((e, i) => {
    const head = e.querySelector(':scope > .entry-head'), hl = L(head), l = L(e);
    const rest = l.filter((x) => x.base > hl[hl.length - 1].base + 3);
    const name = e.textContent.trim().split(/\s/)[0];
    if (hl.length === 1 && rest.length) g30[`${name}: ticker line -> its text`] = rest[0].top - hl[0].base;
    rest.slice(1).forEach((x, k) => pitches.add(Math.round(x.base - rest[k].base)));
    const prev = entries[i - 1];
    if (prev && prev.nextElementSibling === e) {
      const pl = L(prev);
      if (L(prev.querySelector(':scope > .entry-head')).length === 1)
        g30[`${prev.textContent.trim().split(/\s/)[0]} text -> ${name}`] = l[0].top - pl[pl.length - 1].base;
    }
  });

  // font sizes by category
  const cat = {};
  const w = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? 1 : 2) });
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentElement;
    let k = 'text';
    if (p.closest('h3')) k = 'heading';
    else if (p.closest('.verdict-ticker') || p.closest('.verdict-stars')) k = 'ticker';
    else if (p.tagName === 'STRONG' && p.matches('li strong:first-child, li > span > strong:first-child')) k = 'ticker';
    (cat[k] = cat[k] || new Set()).add(cs(p).fontSize);
  }
  Object.keys(cat).forEach((k) => (fonts[k] = [...cat[k]]));
  return { g100, g30, g15, pageFonts, fonts, pitches: [...pitches], nHeadings: hs.length, nEntries: entries.length, nCheck: chk.length };
});

await browser.close();

const fails = [];
const row = (label, v, want, tol) => {
  const ok = Math.abs(v - want) <= tol;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${want}px  ${v.toFixed(1).padStart(6)}  ${label}`);
  if (!ok) fails.push(`${label}: ${v.toFixed(1)}px, expected ${want}px`);
};
console.log(`Report has ${m.nHeadings} headings, ${m.nEntries} entries, ${m.nCheck} check lines\n`);
if (empty !== null) row('title -> "Click a date to open a report." message (no report open)', empty, 100, TOL_100);
Object.entries(m.g100).forEach(([k, v]) => row(k, v, 100, TOL_100));
Object.entries(m.g30).forEach(([k, v]) => row(k, v, 30, TOL_30));
Object.entries(m.g15).forEach(([k, v]) => row(k, v, 15, TOL_30));

const wantPage = { 'page title "Insider Edge"': '60px', 'title inside the dark band': '35px', 'date line under the title': '15px' };
Object.entries(wantPage).forEach(([k, px]) => {
  const ok = m.pageFonts[k] === px;
  console.log(`${ok ? 'PASS' : 'FAIL'}  font ${k}: ${m.pageFonts[k]} (expected ${px})`);
  if (!ok) fails.push(`font ${k}: ${m.pageFonts[k]}, expected ${px}`);
});

const want = { heading: '25px', ticker: '20px', text: '15px' };
Object.entries(want).forEach(([k, px]) => {
  const got = m.fonts[k];
  if (!got) return; // e.g. an empty report has no headings/tickers
  const ok = got.length === 1 && got[0] === px;
  console.log(`${ok ? 'PASS' : 'FAIL'}  font ${k}: ${got.join(', ')} (expected ${px})`);
  if (!ok) fails.push(`font ${k}: ${got.join(', ')}, expected ${px}`);
});
const pitchOk = m.pitches.every((p) => p === 24);
console.log(`${pitchOk ? 'PASS' : 'FAIL'}  line pitch inside paragraphs: ${m.pitches.join(', ') || '(none)'} (expected 24)`);
if (!pitchOk) fails.push(`line pitch: ${m.pitches.join(', ')}, expected 24`);

if (fails.length) {
  console.error(`\n${fails.length} spacing/font check(s) FAILED:\n - ${fails.join('\n - ')}`);
  process.exit(1);
}
console.log('\nAll spacing and font-size checks passed.');
