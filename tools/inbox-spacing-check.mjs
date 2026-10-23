// Inbox Report layout guard (REPORT-CARD-STANDARD.md).
//
// The Inbox Report's card is Insider Edge's LOCKED report card (owner,
// 2026-10-15: "the same colours, the same padding, the same size of the
// letters, fonts, everything"): this opens the real page, opens a report and
// measures it BY EYE, exactly like tools/spacing-check.mjs does for Insider
// Edge -- from the baseline of the letters above to the top of the tallest
// letters below, or to the edge of a box (an email card, a badge, the band)
// or of a heading's line, exactly as the reader sees it.
//   COMPUTER (1920): 100 around the band and above / below every heading,
//                    30 between items, 15 from a heading's letters to its line
//   PHONE (iPhone, 375): the same with 70 instead of 100 inside the card
//   both: text 15px, headings 25px, badges 13px, band title 35 / 26px, date
//         15px, page title 50 / 44px; 24px lines; the band's date written
//         "14 Oct 2026"; the Insider Edge colours, and every email card in
//         the sign-in box's white #E9E9EB, with the original email and the
//         draft reply on company white #F9F9FA inside it, with no line around
//         them (the white alone marks them, owner 2026-10-20); ONE red on
//         light backgrounds #C62828 (High badge, High stripe, "Worry: Yes",
//         red warnings), ONE orange #BC4C00 (Medium badge, Medium stripe,
//         "Worry: Watch"; no gold in badges), ONE green #188038 (Low badge,
//         Low stripe, "Worry: No"), ONE solid grey #616161 ("Probably spam"
//         badge + stripe, card never faded) and ONE white #F9F9FA in every
//         badge; Who badges navy #1E2633 with white words, Draft badges
//         white with navy words and outline; no line of text
//         outside the column; the summary table's badges read "High" / "Yes"
//         on the computer (under the titles row) and "Urgency: High" /
//         "Worry: Yes" on the phone (titles row hidden), side by side, or
//         Worry under Urgency when the pair is too long for the line; every
//         email card's first badges read "Urgency: High" + "Worry: Yes".
// The report is a MADE-UP sample with the real report's exact shape
// (tools/fixtures/inbox-report-samples.mjs; the real reports are owner-only and
// this project is public): SAMPLE=full (default), SAMPLE=quiet (no emails) or
// SAMPLE=overdue (no new emails, one overdue card, only short badges in the
// table, the shape that broke "Urgency" on 17 Oct 2026). Also: no word is
// split in the middle; and (full day) a card whose email the morning check
// found deleted shows "This email has been deleted (checked …)" instead of its
// link (owner, 2026-10-23).
// It is measured twice, with the draft reply folded and opened.
// Nothing is read from or written to the real database. Exits 1 on any drift.
import { chromium, devices } from 'playwright';
import { ownerFake, useStandIn } from './guard-supabase.mjs';
import { fullReport, quietReport, overdueReport } from './fixtures/inbox-report-samples.mjs';

const URL = process.env.SPACING_URL || 'http://localhost:8091/inbox-report.html';
const SAMPLES = { full: [fullReport, 'a full day'], quiet: [quietReport, 'a day with no emails'], overdue: [overdueReport, 'no new emails, one overdue email (short badges only)'] };
const [SAMPLE, SAMPLE_NAME] = SAMPLES[process.env.SAMPLE] || SAMPLES.full;
console.log(`Sample report: ${SAMPLE_NAME} (made up, not a real report)`);
const TOL_BIG = 1;   // px, for every 100 (70 on phones) gap
const TOL_30 = 1.5;  // px, for every 30 and 15 gap (line boxes round to whole px)

const measure = () => {
  const cs = getComputedStyle, doc = document;
  const c = doc.createElement('canvas').getContext('2d');
  const met = (el, txt) => { const s = cs(el); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; const t = c.measureText(txt); return { a: t.actualBoundingBoxAscent, fa: t.fontBoundingBoxAscent }; };
  const tns = (el) => { const w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() ? 1 : 2) }); const a = []; let n; while ((n = w.nextNode())) a.push(n); return a; };
  // text lines of an element: [{ base: baseline y, top: top of the tallest letters y }]
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
  // By eye: the first line's letters, or a badge box on it, to the last
  // line's baseline, or a badge box on it.
  const eye = (el) => {
    const L = lines(el); let t = L.length ? L[0].top : Infinity, b = L.length ? L[L.length - 1].base : -Infinity;
    el.querySelectorAll('.badge').forEach((bd) => { const r = R(bd); t = Math.min(t, r.t); b = Math.max(b, r.b); });
    return { t, b };
  };
  const visible = (e) => cs(e).display !== 'none';
  // A top-level block of the report: where it starts and ends by eye.
  const block = (k) => {
    if (k.tagName === 'TABLE') {
      const th = k.querySelector('thead');
      const rows = [...k.querySelectorAll('tbody tr')];
      return { t: th && visible(th) ? eye(th).t : eye(rows[0]).t, b: R(k).b, name: 'the table' };
    }
    if (k.tagName === 'UL' && k.querySelector(':scope > li.entry')) return { t: R(k.querySelector(':scope > li.entry')).t, b: R([...k.querySelectorAll(':scope > li.entry')].pop()).b, name: 'email cards' };
    const e = eye(k); return { ...e, name: `"${k.textContent.trim().slice(0, 24)}"` };
  };

  const h1 = doc.querySelector('h1'), band = doc.querySelector('.report-header-band');
  const title = doc.querySelector('.report-content-title'), date = doc.querySelector('.report-content-date');
  const card = doc.querySelector('.report-content'), body = doc.querySelector('.report-body');
  const big = [], g30 = [], g15 = [];
  const T = lines(title), D = lines(date), B = R(band), C = R(card);
  big.push(['card top -> title letters', T[0].top - B.t]);
  g15.push(['title -> date line', D[0].top - T[T.length - 1].base]);
  big.push(['date line -> band bottom', B.b - D[D.length - 1].base]);
  const kids = [...body.children];
  let prev = null;
  kids.forEach((k, i) => {
    if (k.tagName === 'H3') {
      const L = lines(k), r = R(k), n = k.textContent.trim().slice(0, 18);
      if (i === 0) big.push([`band bottom -> "${n}" letters`, L[0].top - B.b]);
      else big.push([`${prev.name} -> "${n}" letters`, L[0].top - prev.b]);
      g15.push([`"${n}" letters -> its line`, r.b - parseFloat(cs(k).borderBottomWidth) - L[L.length - 1].base]);
      const next = kids[i + 1];
      if (next) big.push([`"${n}" line -> ${block(next).name}`, block(next).t - r.b]);
      prev = null; return;
    }
    const bl = block(k);
    if (i === 0) big.push([`band bottom -> ${bl.name}`, bl.t - B.b]);
    else if (prev) g30.push([`${prev.name} -> ${bl.name}`, bl.t - prev.b]);
    prev = bl;
  });
  const lastBlock = block(kids[kids.length - 1]);
  big.push([`${lastBlock.name} -> card bottom`, C.b - lastBlock.b]);

  // Email cards: card -> next card, and inside each card every part 30 apart
  // (edge -> first part, part -> part, last part -> edge; the white box and an
  // opened draft reply are parts too).
  // A folded draft reply shows only its "Read the draft reply" line.
  const part = (el) => (el.tagName === 'BLOCKQUOTE' ? R(el) : el.tagName === 'DETAILS' && !el.open ? eye(el.querySelector('summary')) : eye(el));
  body.querySelectorAll(':scope > ul > li.entry').forEach((li, ci) => {
    const r = R(li), parts = [...li.children], tag = `card ${ci + 1}`;
    const nextLi = li.nextElementSibling;
    if (nextLi) g30.push([`${tag} -> next card`, R(nextLi).t - r.b]);
    g30.push([`${tag}: edge -> badges`, part(parts[0]).t - r.t]);
    parts.slice(1).forEach((p, j) => g30.push([`${tag}: part ${j + 1} -> part ${j + 2}`, part(p).t - part(parts[j]).b]));
    g30.push([`${tag}: last line -> edge`, r.b - part(parts[parts.length - 1]).b]);
    li.querySelectorAll('details[open]').forEach((d) => {
      const s = eye(d.querySelector('summary')), q = R(d.querySelector('blockquote'));
      g30.push([`${tag}: "Read the draft reply" -> the draft's box`, q.t - s.b]);
      const after = lines(d).filter((x) => x.top > q.b);
      if (after.length) g30.push([`${tag}: the draft's box -> its flags`, after[0].top - q.b]);
    });
  });
  // A plain list (the Notebook): item -> item.
  body.querySelectorAll(':scope > ul:not(:has(> li.entry))').forEach((ul) => {
    const lis = [...ul.children];
    lis.slice(1).forEach((li, j) => g30.push([`list item ${j + 1} -> ${j + 2}`, eye(li).t - eye(lis[j]).b]));
  });

  // Line pitch inside paragraphs that wrap (no badges on them). A quoted
  // email keeps its own empty lines, which are two lines (48) apart.
  const pitches = new Set();
  body.querySelectorAll('p.gist, p.why, p.from, blockquote, .report-body > ul:not(:has(> li.entry)) > li').forEach((p) => {
    const L = lines(p); L.slice(1).forEach((x, k) => pitches.add(Math.round(x.base - L[k].base)));
  });

  // Font sizes by kind.
  const cat = {};
  tns(body).forEach((n) => {
    const p = n.parentElement;
    const k = p.closest('h3') ? 'heading' : p.closest('.badge') ? 'badge' : 'text';
    (cat[k] = cat[k] || new Set()).add(cs(p).fontSize);
  });
  const fonts = Object.fromEntries(Object.entries(cat).map(([k, v]) => [k, [...v]]));
  const pageFonts = { 'page title "Inbox Report"': cs(h1).fontSize, 'title inside the dark band': cs(title).fontSize, 'date line under the title': cs(date).fontSize };

  // Colours (Insider Edge's, and the email cards in the sign-in box's white).
  const hex = (v) => { const m = v.match(/\d+(\.\d+)?/g).map(Number); return '#' + m.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase(); };
  const firstCard = body.querySelector('li.entry');
  const colours = {
    'report paper': hex(cs(card).backgroundColor), 'dark band': hex(cs(band).backgroundColor), 'band title': hex(cs(title).color), 'date line': hex(cs(date).color),
    'report text': hex(cs(body).color), 'heading': hex(cs(body.querySelector('h3')).color),
    // EVERY heading's line: company navy, no other colour (owner, 2026-10-20).
    'heading line': [...new Set([...body.querySelectorAll('h3')].map((h) => `${parseFloat(cs(h).borderBottomWidth)}px ${hex(cs(h).borderBottomColor)}`))].join(' / '),
    ...(firstCard ? { 'email card': hex(cs(firstCard).backgroundColor) } : {}),
    // No outline around an email card, only its urgency stripe on the left
    // (owner, 2026-10-20): EVERY card, top, right and bottom.
    ...(firstCard ? { 'email card outline': [...body.querySelectorAll('li.entry')].every((li) => ['Top', 'Right', 'Bottom'].every((s) => parseFloat(cs(li)[`border${s}Width`]) === 0)) ? 'none' : [...new Set([...body.querySelectorAll('li.entry')].map((li) => `${cs(li).borderTopWidth} ${hex(cs(li).borderTopColor)}`))].join(' / ') } : {}),
    // "Read the draft reply" (its words and its ▶) and "Open the email" (its
    // words and its underline): company navy only (owner, 2026-10-20, chose
    // navy over gold: gold is branding, and too faint on the grey card).
    ...(body.querySelector('summary') ? { 'Read the draft reply': [...new Set([...body.querySelectorAll('summary')].flatMap((s) => [hex(cs(s).color), hex(getComputedStyle(s, '::marker').color)]))].join(' / ') } : {}),
    ...(body.querySelector('a') ? { 'Open the email': [...new Set([...body.querySelectorAll('a')].flatMap((a) => [hex(cs(a).color), hex(cs(a).textDecorationColor)]))].join(' / ') } : {}),
    // The original email and the draft reply, on company white inside the
    // grey card (owner, 2026-10-16): EVERY such box, fully white (not see-through).
    ...(body.querySelector('li.entry blockquote') ? { 'email and draft boxes': [...body.querySelectorAll('li.entry blockquote')].every((q) => cs(q).backgroundColor === 'rgb(249, 249, 250)') ? '#F9F9FA' : [...new Set([...body.querySelectorAll('li.entry blockquote')].map((q) => cs(q).backgroundColor))].join(' / ') } : {}),
    // ONE red on light backgrounds, #C62828 (owner, 2026-10-20): the High
    // badge, the High card's stripe, "Worry: Yes" (text and outline) and the
    // agent's red warnings; and ONE white, #F9F9FA, for every white in a badge.
    ...(body.querySelector('.badge.high') ? { 'High badge': hex(cs(body.querySelector('.badge.high')).backgroundColor), 'High badge text': hex(cs(body.querySelector('.badge.high')).color) } : {}),
    ...(body.querySelector('li.entry.high') ? { 'High card stripe': hex(cs(body.querySelector('li.entry.high')).borderLeftColor) } : {}),
    ...(body.querySelector('.badge.worry-yes') ? { 'Worry: Yes badge': [...new Set([...body.querySelectorAll('.badge.worry-yes')].flatMap((bd) => [hex(cs(bd).color), hex(cs(bd).borderTopColor)]))].join(' / ') } : {}),
    // ONE orange on light backgrounds, #BC4C00 (owner, 2026-10-20: no gold in
    // badges): the Medium badge, the Medium card's stripe and "Worry: Watch".
    ...(body.querySelector('.badge.medium') ? { 'Medium badge': hex(cs(body.querySelector('.badge.medium')).backgroundColor), 'Medium badge text': hex(cs(body.querySelector('.badge.medium')).color) } : {}),
    ...(body.querySelector('li.entry.medium') ? { 'Medium card stripe': hex(cs(body.querySelector('li.entry.medium')).borderLeftColor) } : {}),
    ...(body.querySelector('.badge.worry-watch') ? { 'Worry: Watch badge': [...new Set([...body.querySelectorAll('.badge.worry-watch')].flatMap((bd) => [hex(cs(bd).color), hex(cs(bd).borderTopColor)]))].join(' / ') } : {}),
    // ONE green on light backgrounds, #188038 (owner, 2026-10-20: the traffic
    // lights, red / orange / green): the Low badge, the Low card's stripe and
    // "Worry: No".
    ...(body.querySelector('.badge.low') ? { 'Low badge': hex(cs(body.querySelector('.badge.low')).backgroundColor), 'Low badge text': hex(cs(body.querySelector('.badge.low')).color) } : {}),
    ...(body.querySelector('li.entry.low') ? { 'Low card stripe': hex(cs(body.querySelector('li.entry.low')).borderLeftColor) } : {}),
    ...(body.querySelector('.badge.worry-no') ? { 'Worry: No badge': [...new Set([...body.querySelectorAll('.badge.worry-no')].flatMap((bd) => [hex(cs(bd).color), hex(cs(bd).borderTopColor)]))].join(' / ') } : {}),
    // ONE solid grey, #616161 (owner, 2026-10-20: "solid grey, no fading"):
    // the "Probably spam" badge and its card's stripe; the card at full strength.
    ...(body.querySelector('.badge.spam') ? { 'Spam badge': hex(cs(body.querySelector('.badge.spam')).backgroundColor), 'Spam badge text': hex(cs(body.querySelector('.badge.spam')).color) } : {}),
    ...(body.querySelector('li.entry.spam') ? { 'Spam card stripe': hex(cs(body.querySelector('li.entry.spam')).borderLeftColor), 'Spam card strength': [...body.querySelectorAll('li.entry.spam')].every((li) => cs(li).opacity === '1') ? 'solid' : 'faded' } : {}),
    // The Email list's row lines: thin company navy, no grey (owner,
    // 2026-10-20). Computers draw them under each cell, phones under each row.
    ...(body.querySelector('table.scan tbody tr') ? { 'Email list row lines': [...new Set([...body.querySelectorAll('table.scan tbody tr')].map((tr) => { const s = parseFloat(cs(tr).borderBottomWidth) > 0 ? cs(tr) : cs(tr.querySelector('td')); return `${parseFloat(s.borderBottomWidth)}px ${hex(s.borderBottomColor)}`; }))].join(' / ') } : {}),
    // The Who and Draft badges: ONLY company navy and company white (owner,
    // 2026-10-20). Who = navy fill + white words; Draft = white fill + navy
    // words and outline. Every such badge on the page, one value each.
    ...(body.querySelector('.badge.cat') ? { 'Who badge': [...new Set([...body.querySelectorAll('.badge.cat')].map((bd) => hex(cs(bd).backgroundColor)))].join(' / '), 'Who badge words': [...new Set([...body.querySelectorAll('.badge.cat')].map((bd) => hex(cs(bd).color)))].join(' / ') } : {}),
    ...(body.querySelector('.badge.draft') ? { 'Draft badge words and outline': [...new Set([...body.querySelectorAll('.badge.draft')].flatMap((bd) => [hex(cs(bd).color), hex(cs(bd).borderTopColor)]))].join(' / ') } : {}),
    ...(body.querySelector('[style]') ? { 'red warnings': [...new Set([...body.querySelectorAll('[style]')].map((el) => hex(cs(el).color)))].join(' / ') } : {}),
    ...(body.querySelector('.badge.worry-yes, .badge.worry-watch, .badge.worry-no, .badge.draft') ? { 'badge whites': [...new Set([...body.querySelectorAll('.badge.worry-yes, .badge.worry-watch, .badge.worry-no, .badge.draft')].map((bd) => hex(cs(bd).backgroundColor)))].join(' / ') } : {}),
    // ...and the white alone marks them: no line on any side (owner, 2026-10-20).
    ...(body.querySelector('li.entry blockquote') ? { 'email and draft boxes: line on the left': [...body.querySelectorAll('li.entry blockquote')].every((q) => ['Top', 'Right', 'Bottom', 'Left'].every((s) => parseFloat(cs(q)[`border${s}Width`]) === 0)) ? 'none' : [...new Set([...body.querySelectorAll('li.entry blockquote')].map((q) => `${cs(q).borderLeftWidth} ${hex(cs(q).borderLeftColor)}`))].join(' / ') } : {}),
  };

  // Every line of report text stays inside the text column.
  const bb = body.getBoundingClientRect(), bs = cs(body);
  const colL = bb.left + parseFloat(bs.paddingLeft), colR = bb.right - parseFloat(bs.paddingRight);
  const outside = [];
  tns(body).forEach((tn) => {
    const g = doc.createRange(); g.selectNodeContents(tn);
    [...g.getClientRects()].forEach((rc) => {
      if (rc.width > 0 && (rc.left < colL - 1 || rc.right > colR + 1)) outside.push(`"${tn.nodeValue.trim().slice(0, 40)}" runs ${Math.round(Math.max(colL - rc.left, rc.right - colR))}px past the text column`);
    });
  });
  // No word split in the middle (17 Oct 2026: with only a short "High" badge in
  // the table's first column, its heading broke into "Urgenc / y"). In the
  // table any split counts (the column should have grown); elsewhere only a
  // word short enough to fit on one line of its box. A break next to a
  // hyphen, dash, quote mark or bracket is a normal line break, not a split.
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
  // The summary table's badges as the reader sees them (a title the page puts
  // in front counts), and how each row's two badges sit: side by side on one
  // line, or (a pair too long for a narrow phone's line) Worry stacked
  // directly under Urgency, the same left edge.
  const badgeText = (bd) => { const bf = cs(bd, '::before').content; return ((bf && bf !== 'none' && bf !== 'normal' ? bf.replace(/^"|"$/g, '') : '') + bd.textContent).trim(); };
  const tableRows = [...body.querySelectorAll('table.scan tbody tr')];
  const tableBadges = tableRows.map((r) => [...r.querySelectorAll('.badge')].map(badgeText));
  const cardBadges = [...body.querySelectorAll('li.entry p.head')].map((h) => [...h.querySelectorAll('.badge')].slice(0, 2).map(badgeText));
  const badgesSit = tableRows.map((r) => {
    const [u, w] = [...r.querySelectorAll('.badge')].map((bd) => bd.getBoundingClientRect());
    if (Math.abs(w.top - u.top) < 3) return 'one line';
    return w.top >= u.bottom && Math.abs(w.left - u.left) < 1 ? 'stacked' : `out of place (${Math.round(w.left - u.left)}px, ${Math.round(w.top - u.top)}px)`;
  });
  return { big, g30, g15, pitches: [...pitches], fonts, pageFonts, colours, outside, split, tableBadges, badgesSit, cardBadges, dateText: date.textContent, sideways: doc.documentElement.scrollWidth - doc.documentElement.clientWidth };
};

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
async function open(phone) {
  const ctx = await browser.newContext(phone ? { ...devices['iPhone 13'], viewport: { width: 375, height: 900 } } : { viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await useStandIn(page, ownerFake({ email_reports: [SAMPLE] }));
  await page.route(/supabase\.co/, (route) => route.abort()); // the stand-in answers everything; nothing reaches the real database
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.report-tile', { timeout: 30000 });
  await page.click('.report-tile');
  await page.waitForSelector('.report-body', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return page;
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
const WANT_COLOURS = { 'report paper': '#F9F9FA', 'dark band': '#2A3441', 'band title': '#B29B68', 'date line': '#B29B68', 'report text': '#1E2633', heading: '#1E2633', 'heading line': '2px #1E2633', 'email card': '#E9E9EB', 'email card outline': 'none', 'Read the draft reply': '#1E2633', 'Open the email': '#1E2633', 'email and draft boxes': '#F9F9FA', 'email and draft boxes: line on the left': 'none', 'High badge': '#C62828', 'High badge text': '#F9F9FA', 'High card stripe': '#C62828', 'Worry: Yes badge': '#C62828', 'red warnings': '#C62828', 'badge whites': '#F9F9FA', 'Medium badge': '#BC4C00', 'Medium badge text': '#F9F9FA', 'Medium card stripe': '#BC4C00', 'Worry: Watch badge': '#BC4C00', 'Who badge': '#1E2633', 'Who badge words': '#F9F9FA', 'Draft badge words and outline': '#1E2633', 'Low badge': '#188038', 'Low badge text': '#F9F9FA', 'Low card stripe': '#188038', 'Worry: No badge': '#188038', 'Spam badge': '#616161', 'Spam badge text': '#F9F9FA', 'Spam card stripe': '#616161', 'Spam card strength': 'solid', 'Email list row lines': '1px #1E2633' };

for (const phone of [false, true]) {
  const BIG = phone ? 70 : 100, P = phone ? 'phone: ' : '';
  console.log(phone ? '\nPHONE (iPhone, 375 wide): 70 inside the card' : 'COMPUTER (1920 wide): 100 inside the card');
  const page = await open(phone);
  for (const opened of [false, true]) {
    if (opened) {
      const n = await page.evaluate(() => { const d = [...document.querySelectorAll('.report-body details')]; d.forEach((x) => { x.open = true; }); return d.length; });
      if (!n) continue;
      await page.waitForTimeout(300);
      console.log(`${P}-- with the draft reply opened --`);
    }
    const m = await page.evaluate(measure);
    if (!opened) {
      m.big.forEach(([k, v]) => row(P + k, v, BIG, TOL_BIG));
      m.g15.forEach(([k, v]) => row(P + k, v, 15, TOL_30));
      m.g30.forEach(([k, v]) => row(P + k, v, 30, TOL_30));
      Object.entries(phone ? { 'page title "Inbox Report"': '44px', 'title inside the dark band': '26px', 'date line under the title': '15px' } : { 'page title "Inbox Report"': '50px', 'title inside the dark band': '35px', 'date line under the title': '15px' })
        .forEach(([k, px]) => same(`${P}font ${k}`, m.pageFonts[k], px));
      Object.entries({ heading: '25px', text: '15px', badge: '13px' }).forEach(([k, px]) => { if (m.fonts[k]) same(`${P}font ${k}`, m.fonts[k].join(', '), px); });
      same(`${P}line pitch inside paragraphs (24, or 48 across an empty line in a quote)`, m.pitches.every((x) => x === 24 || x === 48) ? 'yes' : m.pitches.join(', '), 'yes');
      Object.entries(m.colours).forEach(([k, v]) => same(`${P}colour ${k}`, v, WANT_COLOURS[k]));
      same(`${P}date line written like Insider Edge's ("14 Oct 2026")`, /^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(m.dateText) ? 'yes' : `no: "${m.dateText}"`, 'yes');
      same(`${P}every line inside the text column`, m.outside.length ? m.outside.join('; ') : 'yes', 'yes');
      same(`${P}no word split in the middle`, m.split.length ? m.split.join('; ') : 'yes', 'yes');
      // Summary table badges: on phones (titles row hidden) they carry their
      // column's title, "Urgency: High" / "Worry: Yes" (owner, 2026-10-18);
      // computers show the bare words under the titles row.
      const urg = phone ? /^(Urgency: (High|Medium|Low)|Probably spam)$/ : /^(High|Medium|Low|Probably spam)$/;
      const wor = phone ? /^Worry: (Yes|Watch|No)$/ : /^(Yes|Watch|No)$/;
      const badRows = m.tableBadges.filter(([u, w]) => !urg.test(u) || !wor.test(w));
      same(`${P}table badges read ${phone ? '"Urgency: …" + "Worry: …"' : '"High…" + "Yes…" under their titles'}`, badRows.length ? badRows.map((x) => x.join(' + ')).join('; ') : 'yes', 'yes');
      // Email cards, on every screen: "Urgency: High" (owner, 2026-10-19), then "Worry: Yes".
      const badCards = m.cardBadges.filter(([u, w]) => !/^(Urgency: (High|Medium|Low)|Probably spam)$/.test(u) || !/^Worry: (Yes|Watch|No)$/.test(w));
      same(`${P}email card badges read "Urgency: …" + "Worry: …"`, badCards.length ? badCards.map((x) => x.join(' + ')).join('; ') : 'yes', 'yes');
      const okSit = phone ? ['one line', 'stacked'] : ['one line'];
      const badSit = m.badgesSit.map((s, i) => (okSit.includes(s) ? '' : `row ${i + 1} ${s}`)).filter(Boolean);
      same(`${P}each table row's two badges ${phone ? 'on one line, or Worry stacked under Urgency' : 'on one line'}`, badSit.length ? badSit.join('; ') : 'yes', 'yes');
      same(`${P}sideways scroll`, String(m.sideways), '0');
    } else {
      m.g30.filter(([k]) => /draft|card \d: (part|last)/.test(k) && k.includes('card 1')).forEach(([k, v]) => row(`${P}${k} (draft open)`, v, 30, TOL_30));
    }
  }
  // The card's clickable lines pop like Sign out and the back arrow (owner,
  // 2026-10-20): 1.05 under a mouse and on the Tab key, no ring of any colour.
  // Phones have no mouse, so no pop there. Checked last, after every gap is
  // measured (a popped line is 5% bigger).
  if (!phone) {
    const LINES = [['Read the draft reply', '.report-body li.entry summary'], ['Open the email', '.report-body li.entry p > a']];
    const POP = 'matrix(1.05, 0, 0, 1.05, 0, 0)';
    for (const [name, sel] of LINES) {
      // The words' centre, proven to be on screen and on the line itself; and a
      // parking spot on the card's left margin (inside the card, not clickable).
      const at = await page.evaluate((s) => {
        const el = document.querySelector(s); if (!el) return null;
        el.scrollIntoView({ block: 'center' });
        const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(), l = el.closest('li.entry').getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2, hit = document.elementFromPoint(x, y);
        return { x, y, hit: !!hit && (hit === el || el.contains(hit)) && y > 0 && y < innerHeight, px: l.left + 12, py: y, beside: r.right + 12 };
      }, sel);
      if (!at) continue; // this sample has no such line
      await page.mouse.move(at.x, at.y);
      await page.waitForTimeout(400);
      const hover = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, sel);
      same(`${P}"${name}" pops under the mouse`, at.hit ? hover : 'the pointer missed it', POP);
      // ONLY on its words (owner, 2026-10-20: "Read the draft reply" popped with
      // the mouse 5-6 cm away on the same line): 12px past the last letter, no pop.
      await page.mouse.move(at.px, at.py);
      await page.waitForTimeout(300);
      await page.mouse.move(at.beside, at.y);
      await page.waitForTimeout(400);
      const beside = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, sel);
      same(`${P}"${name}" does not pop with the mouse just past its last letter`, beside, 'none');
      await page.mouse.move(at.px, at.py);
      let reached = false;
      for (let i = 0; i < 80 && !reached; i++) {
        await page.keyboard.press('Tab');
        reached = await page.evaluate((s) => document.activeElement === document.querySelector(s) && document.activeElement.matches(':focus-visible'), sel);
      }
      await page.waitForTimeout(400);
      const tab = await page.evaluate((s) => { const c = getComputedStyle(document.querySelector(s)); return `${c.transform}, ${c.outlineStyle === 'none' || parseFloat(c.outlineWidth) === 0 ? 'no ring' : 'ring ' + c.outlineWidth + ' ' + c.outlineColor}`; }, sel);
      same(`${P}"${name}" pops on the Tab key, no ring`, reached ? tab : 'not reached by the Tab key', `${POP}, no ring`);
    }
  } else {
    same(`${P}no mouse on a phone, so no pop`, String(await page.evaluate(() => matchMedia('(hover: hover)').matches)), 'false');
  }
  // "Open the email" (owner, 2026-10-21): a phone's browser gets Gmail's phone
  // version, which only opens the email from its own conversation link; on a
  // phone every Gmail link must be that link (same account, same thread), on a
  // computer exactly the agent's link (which lands on the exact email there).
  // A deleted email's link is no longer a link (checked below), so it is left
  // out of this comparison.
  const deletedThreads = new Set((SAMPLE.deleted_emails || []).map((d) => d.thread_id));
  const sampleLinks = [...SAMPLE.html_content.matchAll(/href="(https:\/\/mail\.google\.com\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))
    .filter((link) => !deletedThreads.has((/\/([0-9a-f]{16})$/.exec(link) || [])[1]));
  if (sampleLinks.length) {
    const shownLinks = await page.evaluate(() => [...document.querySelectorAll('.report-body a[href^="https://mail.google.com/"]')].map((a) => a.getAttribute('href')));
    const wantLinks = sampleLinks.map((orig) => {
      const thread = (/\/([0-9a-f]{16})$/.exec(orig) || [])[1];
      const account = (/[?&](authuser=[^&#]+)/.exec(orig) || [])[1] || 'authuser=info%40primelevel.co.uk';
      return phone && thread ? `https://mail.google.com/mail/mu/mp/?${account}#cv/Inbox/${thread}` : orig;
    });
    const wrongLinks = wantLinks.filter((want, i) => shownLinks[i] !== want).length + Math.max(0, shownLinks.length - wantLinks.length);
    same(`${P}"Open the email" links ${phone ? "are the phone Gmail's own link to that email" : "are exactly the agent's link"}`, wrongLinks ? `${wrongLinks} of ${wantLinks.length} wrong (e.g. ${shownLinks[0]})` : 'yes', 'yes');
  }
  // "This email has been deleted" (owner, 2026-10-23): on the card of every
  // email the morning check found deleted, the link is replaced by a plain line
  // with the check's date and time in UK time (24 Oct 07:14 UTC = 08:14 BST),
  // in the card's normal text (navy, regular, no underline, not clickable);
  // every other card keeps its link. Phones and computers alike.
  if (deletedThreads.size) {
    const cardThreads = SAMPLE.html_content.split('<li class="entry').slice(1).map((li) => (/\/([0-9a-f]{16})">Open the email<\/a>/.exec(li) || [])[1]);
    const shownCards = await page.evaluate(() => [...document.querySelectorAll('.report-body li.entry')].map((li) => {
      const msg = li.querySelector('span.deleted-email');
      const c = msg && getComputedStyle(msg);
      const rgb = c ? c.color.match(/\d+/g).slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0').toUpperCase()).join('') : '';
      return { links: li.querySelectorAll('a[href^="https://mail.google.com/"]').length, msg: msg ? msg.textContent : '', look: msg ? `weight ${c.fontWeight}, underline ${c.textDecorationLine}, #${rgb}, ${msg.closest('a') ? 'inside a link' : 'not a link'}` : '' };
    }));
    cardThreads.forEach((thread, i) => {
      if (!thread) return;
      const card = shownCards[i] || { links: 0, msg: '', look: '' };
      if (deletedThreads.has(thread)) {
        same(`${P}card ${i + 1} (deleted email): its link is replaced by the line`, card.links === 0 ? card.msg : `still ${card.links} link(s) · "${card.msg}"`, 'This email has been deleted (checked 24 Oct 2026, 08:14)');
        same(`${P}card ${i + 1} (deleted email): the line looks like the card's normal text`, card.look, 'weight 400, underline none, #1E2633, not a link');
      } else {
        same(`${P}card ${i + 1} (not deleted): keeps "Open the email"`, card.links === 1 && !card.msg ? 'yes' : `${card.links} link(s) · "${card.msg}"`, 'yes');
      }
    });
  }
  await page.context().close();
}
await browser.close();

if (fails.length) {
  console.error(`\n${fails.length} spacing/font/colour check(s) FAILED:\n - ${fails.join('\n - ')}`);
  process.exit(1);
}
console.log('\nAll Inbox Report spacing, font-size and colour checks passed.');
