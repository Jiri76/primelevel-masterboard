// Insider Edge layout guard.
//
// Opens the real page, opens a report, and measures every spacing and font
// size against the locked values (see INSIDER-EDGE-SPACING-SPEC.md).
// SIX WIDTHS (owner's rule 9; all six since 17 Nov 2026, mirrored from the
// Inbox Report guard): 320, 375 (phones, iPhone), 768, 1024, 1440, 1920
// (computers and tablets); WIDTHS=… to change. On a PHONE (720 and under)
// every 100 inside the report card is 70 by eye (owner, 2026-10-05: "one nice
// rhythm"), the page's own 100s stay 100, titles 44 (38 under 360) / 26.
// Below 1728 wide the date tiles sit between the page title and the card, so
// "title -> card" and the "Click a date" message are checked only at 1728+
// (the opening page guard checks title -> tiles).
// Since 2026-10-12 it also checks, on both, that every line of report text
// stays inside the text column (a long web address once ran under the card's
// edge on phones; the "no picks" sample now carries one). Since 2026-10-20 it
// also checks the colours: every heading, its line and the Verdict's stars in
// company navy (gold is branding only).
// Exits 1 (fails the workflow) if anything has drifted. Spacings are measured
// BY EYE: from the bottom (baseline) of the letters above to the top of the
// tallest letters below, or to the edge of the card / underline -- exactly how
// the person reading the page sees them.
//
// Since 2026-10-02 Insider Edge sits behind door.js (one front door), and this
// guard's throwaway browser is never signed in: it enters as a pretend owner
// ("pretend key"). Since 2026-10-05 the real reports are OWNER-ONLY and this
// project is public, so the report it measures is a MADE-UP sample with the
// real report's exact shape (tools/fixtures/insider-edge-samples.mjs):
// SAMPLE=picks (default) or SAMPLE=nopicks. LOCAL ONLY, never in this public
// repo or its logs: HTML_FILE=<a real report's html_content saved from the
// database> (+ ROW_ID, CREATED_AT, TITLE) measures a REAL report the same way
// (the audit skill's step). Since 17 Nov 2026 also: no word is split in the
// middle, and no sideways scroll. Nothing is read from or written to the real
// database.
import { chromium, devices } from 'playwright';
import { readFileSync } from 'fs';
import { ownerFake, useStandIn } from './guard-supabase.mjs';
import { withPicks, noPicks } from './fixtures/insider-edge-samples.mjs';

const URL = process.env.SPACING_URL || 'http://localhost:8091/insider-edge.html';
const WIDTHS = (process.env.WIDTHS || '320,375,768,1024,1440,1920').split(',').map(Number);
const REAL = process.env.HTML_FILE ? { id: Number(process.env.ROW_ID || 1), title: process.env.TITLE || 'Insider Edge', created_at: process.env.CREATED_AT || new Date().toISOString(), html_content: readFileSync(process.env.HTML_FILE, 'utf8') } : null;
const SAMPLE = REAL || (process.env.SAMPLE === 'nopicks' ? noPicks : withPicks);
const standIn = () => ownerFake({ insider_edge_reports: [SAMPLE] });
console.log(REAL ? `REAL report "${REAL.title}" (local only)` : `Sample report: ${process.env.SAMPLE === 'nopicks' ? 'no picks' : 'with picks'} (made up, not a real report)`);
const TOL_100 = 1;   // px, for every 100px gap
const TOL_30 = 1.5;  // px, for every 30px gap (line boxes round to whole px)

// Before any report is open: title -> "Click a date to open a report." must be 100px.
const emptyGap = () => {
  const es = document.querySelector('.empty-state'), h1 = document.querySelector('h1');
  if (!es) return null;
  const c = document.createElement('canvas').getContext('2d');
  const met = (el, txt) => { const s = getComputedStyle(el); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; const m = c.measureText(txt); return { a: m.actualBoundingBoxAscent, fa: m.fontBoundingBoxAscent }; };
  const rect = (el) => { const g = document.createRange(); g.selectNodeContents(el.firstChild || el); return g.getClientRects()[0]; };
  const hb = rect(h1).top + scrollY + met(h1, 'x').fa;
  const eb = rect(es).top + scrollY + met(es, 'x').fa;
  return (eb - met(es, es.textContent.trim()).a) - hb;
};

const measureReport = () => {
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

  // every line of report text stays inside the text column (2026-10-12: a
  // long web address in a real Notebook line ran under the card's edge on phones)
  const bb = body.getBoundingClientRect(), bs = cs(body);
  const colL = bb.left + parseFloat(bs.paddingLeft), colR = bb.right - parseFloat(bs.paddingRight);
  const outside = [];
  tns(body).forEach((tn) => {
    const g = doc.createRange(); g.selectNodeContents(tn);
    [...g.getClientRects()].forEach((rc) => {
      if (rc.width > 0 && (rc.left < colL - 1 || rc.right > colR + 1)) outside.push(`"${tn.nodeValue.trim().slice(0, 40)}" runs ${Math.round(Math.max(colL - rc.left, rc.right - colR))}px past the text column`);
    });
  });
  // No word split in the middle (copied from the Inbox Report guard, 17 Oct
  // 2026: "Urgenc / y"). In a table any split counts (the column should have
  // grown); elsewhere only a word short enough to fit on one line of its box.
  // A break next to a hyphen, dash, quote mark or bracket is a normal line
  // break, not a split.
  const split = [];
  tns(body).forEach((t) => {
    const re = /[^\s\-–—]+/g; let m;
    while ((m = re.exec(t.nodeValue))) {
      const g = doc.createRange(); g.setStart(t, m.index); g.setEnd(t, m.index + m[0].length);
      if (new Set([...g.getClientRects()].filter((rc) => rc.width > 0).map((rc) => Math.round(rc.top))).size < 2) continue;
      let at = -1;
      for (let k = 1; k < m[0].length; k++) {
        const a = doc.createRange(); a.setStart(t, m.index + k - 1); a.setEnd(t, m.index + k);
        const z = doc.createRange(); z.setStart(t, m.index + k); z.setEnd(t, m.index + k + 1);
        const ra = a.getClientRects()[0], rz = z.getClientRects()[0];
        if (ra && rz && Math.round(rz.top) > Math.round(ra.top) + 2) { at = k; break; }
      }
      if (at < 0 || !/[\p{L}\p{N}]/u.test(m[0][at - 1]) || !/[\p{L}\p{N}]/u.test(m[0][at])) continue;
      const s = cs(t.parentElement); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const box = t.parentElement.closest('p, li, blockquote, td, th, summary, h3, div'), bst = cs(box);
      const boxW = box.clientWidth - parseFloat(bst.paddingLeft) - parseFloat(bst.paddingRight);
      const inTable = !!t.parentElement.closest('table');
      if (inTable || c.measureText(m[0]).width <= boxW - 1) split.push(`"${m[0].slice(0, at)} / ${m[0].slice(at)}"${inTable ? ' (table)' : ''}`);
    }
  });
  // Colours (owner, 2026-10-20: gold is branding only): EVERY heading,
  // Verdict included, its 2px line and the Verdict's stars, company navy.
  const hex = (v) => '#' + v.match(/\d+/g).slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
  const set = (a) => [...new Set(a)].join(' / ');
  const stars = [...body.querySelectorAll('.verdict-stars')];
  const colours = {
    'every heading': set(hs.map((h) => hex(cs(h).color))),
    'every heading line': set(hs.map((h) => `${parseFloat(cs(h).borderBottomWidth)}px ${hex(cs(h).borderBottomColor)}`)),
    ...(stars.length ? { 'Verdict stars': set(stars.map((s) => hex(cs(s).color))) } : {}),
  };
  return { g100, g30, g15, pageFonts, fonts, pitches: [...pitches], nHeadings: hs.length, nEntries: entries.length, nCheck: chk.length, outside, split, colours, sideways: doc.documentElement.scrollWidth - doc.documentElement.clientWidth };
};

// CHROME_PATH lets it run on a computer that has Chrome but no Playwright browser.
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
async function open(w) {
  const ctx = await browser.newContext(w <= 720 ? { ...devices['iPhone 13'], viewport: { width: w, height: 900 } } : { viewport: { width: w, height: 1080 } });
  const page = await ctx.newPage();
  await useStandIn(page, standIn());
  await page.route(/supabase\.co/, (route) => route.abort()); // the stand-in answers everything; nothing reaches the real database
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.report-tile', { timeout: 30000 });
  const empty = w >= 1728 ? await page.evaluate(emptyGap) : null;
  await page.click('.report-tile');
  await page.waitForSelector('.report-body', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return { page, empty };
}

const fails = [];
const row = (label, v, want, tol) => {
  const ok = Math.abs(v - want) <= tol;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${want}px  ${v.toFixed(1).padStart(6)}  ${label}`);
  if (!ok) fails.push(`${label}: ${v.toFixed(1)}px, expected ${want}px`);
};
const same = (label, got, want) => {
  const ok = got === want;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${got} (expected ${want})`);
  if (!ok) fails.push(`${label}: ${got}, expected ${want}`);
};
const WANT_COLOURS = { 'every heading': '#1E2633', 'every heading line': '2px #1E2633', 'Verdict stars': '#1E2633' };
// The page's own gaps stay 100 on every screen; inside the card, 100 on a
// computer and 70 on a phone (owner, 2026-10-05: "one nice rhythm").
const PAGE_LEVEL = { 'page top -> "Insider Edge" letters': 100, 'card bottom -> page bottom': 100 };

for (const w of WIDTHS) {
  const phone = w <= 720, P = `${w}: `;
  console.log(`\n${phone ? 'PHONE' : 'COMPUTER'} (${w} wide): ${phone ? 70 : 100} inside the card, 100 for the page`);
  const { page, empty } = await open(w);
  const m = await page.evaluate(measureReport);
  console.log(`${P}report has ${m.nHeadings} headings, ${m.nEntries} entries, ${m.nCheck} check lines`);
  if (empty !== null) row(`${P}title -> "Click a date to open a report." message (no report open)`, empty, 100, TOL_100);
  Object.entries(m.g100).forEach(([k, v]) => {
    if (k === '"Insider Edge" bottom -> card top' && w < 1728) return; // the date tiles sit between them
    row(P + k, v, phone && !PAGE_LEVEL[k] ? 70 : 100, TOL_100);
  });
  Object.entries(m.g30).forEach(([k, v]) => row(P + k, v, 30, TOL_30));
  Object.entries(m.g15).forEach(([k, v]) => row(P + k, v, 15, TOL_30));
  Object.entries(phone ? { 'page title "Insider Edge"': w < 360 ? '38px' : '44px', 'title inside the dark band': '26px', 'date line under the title': '15px' } : { 'page title "Insider Edge"': '50px', 'title inside the dark band': '35px', 'date line under the title': '15px' })
    .forEach(([k, px]) => same(`${P}font ${k}`, m.pageFonts[k], px));
  Object.entries({ heading: '25px', ticker: '20px', text: '15px' }).forEach(([k, px]) => { if (m.fonts[k]) same(`${P}font ${k}`, m.fonts[k].join(', '), px); });
  same(`${P}line pitch inside paragraphs`, m.pitches.every((p) => p === 24) ? 'yes' : m.pitches.join(', '), 'yes');
  same(`${P}every line inside the text column`, m.outside.length ? m.outside.join('; ') : 'yes', 'yes');
  same(`${P}no word split in the middle`, m.split.length ? m.split.join('; ') : 'yes', 'yes');
  Object.entries(m.colours).forEach(([k, v]) => same(`${P}colour ${k}`, v, WANT_COLOURS[k]));
  same(`${P}sideways scroll`, String(m.sideways), '0');
  await page.context().close();
}
await browser.close();

if (fails.length) {
  console.error(`\n${fails.length} spacing/font/colour check(s) FAILED:\n - ${fails.join('\n - ')}`);
  process.exit(1);
}
console.log('\nAll spacing, font-size and colour checks passed.');
