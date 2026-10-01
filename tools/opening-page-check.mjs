// PrimeLevel opening-page guard.
//
// Measures every "opening page" against the LOCKED standards and exits 1
// (fails the workflow) if anything has drifted:
//   * OPENING-PAGE-STANDARD.md: page top -> title letters and title -> the one
//     message line (or the sign-in box's top edge) are 100px BY EYE (baseline
//     of the letters above -> top of the tallest letters below); every line
//     centred; title bold gold (50px; the Masterboard home 60px); message 20px
//     regular soft grey-blue.
//   * SIGNIN-BOX-STANDARD.md "Sign out": on every signed-in page, Sign out sits
//     top-right, 40px / 40px by eye on a computer and 20px / 20px on a phone,
//     Montserrat 20px bold gold, no underline (drawn by door.js).
//   * no sideways scrolling on a 375px phone.
//
// Since 2026-10-02 every private page sits behind door.js (one front door).
// The guard's throwaway browser is never signed in, so the Supabase library is
// swapped for a stand-in (tools/guard-supabase.mjs): signed out for the front
// door's own screens, a pretend owner for the inner pages. Insider Edge keeps
// reading its REAL reports (pretend key, real data). No real account, no
// password, nothing written.
//
// SELFTEST=1 proves the alarm works: it deliberately breaks every kind of rule
// on every page and the run only passes if every break is caught. DRILL=1
// applies the same breaks but judges them like a normal run, so the run FAILS
// on purpose: used to prove the Issue + email alert actually arrives.
//
// NEW OPENING PAGE? Add it to PAGES below in the same commit that creates it.
import { chromium } from 'playwright';
import { signedOut, ownerFake, ownerReal, useStandIn } from './guard-supabase.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:8091';
const SELFTEST = process.env.SELFTEST === '1';
const DRILL = process.env.DRILL === '1';
const TOL = 1; // px
const GOLD = 'rgb(178, 155, 104)';
const GREY_BLUE = 'rgb(138, 147, 163)';

// below: '#signInBox' = measure the title -> the box's top edge; otherwise
// the selector of the one message line. corner: a signed-in page (Sign out).
const PAGES = [
  { name: 'Masterboard front door: sign-in box', path: '/', standIn: signedOut(), ready: '#signInBox', below: '#signInBox', title: '60px' },
  { name: 'Masterboard front door: after sending', path: '/', standIn: signedOut(), ready: '#signInBox', send: true, below: '#doorMessage', title: '60px' },
  { name: 'Insider Edge: no report open', path: '/insider-edge.html', standIn: ownerReal(), ready: '.empty-state', prefer: '.closed-state', below: '#content .empty-state', title: '50px', corner: true },
  { name: 'Inbox Report: no reports yet', path: '/inbox-report.html', standIn: ownerFake({ email_reports: [] }), ready: '.empty-state', below: '.empty-state', title: '50px', corner: true },
  { name: 'Inbox Report: could not load', path: '/inbox-report.html', standIn: ownerFake({ email_reports: 'error' }), ready: '.empty-state', below: '.empty-state', title: '50px', corner: true },
];

// Deliberate drift for SELFTEST/DRILL: every kind of rule broken at once.
const DRIFT = 'h1{font-size:58px!important;text-align:left!important}'
  + '.empty-state,.door-message{padding-top:9px!important;color:#ff0000!important}'
  + '#signInBox{position:relative!important;top:9px!important}' /* not margin-top: it would melt into the title's larger margin and move nothing */
  + '.signin p{margin-bottom:26px!important}.signin label{font-size:17px!important}.signin button{background:#B29B68!important;height:50px!important}'
  + '.signout{text-decoration:underline!important;right:60px!important;top:60px!important}'
  + '.container::after{content:"";display:block;width:3000px;height:1px}';

const shown = (sel) => !!document.querySelector(sel) && getComputedStyle(document.querySelector(sel)).display !== 'none';

async function openPage(browser, p, viewport) {
  const page = await browser.newPage({ viewport });
  await useStandIn(page, p.standIn);
  // Never let the guard's browser write anywhere.
  await page.route(/supabase\.co/, (route) => (route.request().method() === 'GET' || route.request().method() === 'OPTIONS' ? route.continue() : route.abort()));
  await page.goto(BASE + p.path, { waitUntil: 'networkidle' });
  await page.waitForFunction(shown, p.ready, { timeout: 30000 });
  if (p.prefer) await page.waitForSelector(p.prefer, { timeout: 20000 }).catch(() => console.log(`  (note: ${p.prefer} never appeared, measuring the message that is showing)`));
  if (p.send) {
    await page.fill('#signInEmail', 'guard@example.com');
    await page.click('#signInForm button');
    await page.waitForFunction(shown, '#doorMessage', { timeout: 10000 });
  }
  if (SELFTEST || DRILL) await page.addStyleTag({ content: DRIFT });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return page;
}

function measure({ below, corner }) {
  const cs = getComputedStyle, doc = document;
  const c = doc.createElement('canvas').getContext('2d');
  const met = (el, txt) => { const s = cs(el); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; const m = c.measureText(txt); return { a: m.actualBoundingBoxAscent, fa: m.fontBoundingBoxAscent, r: m.actualBoundingBoxRight }; };
  const lines = (el) => {
    const g = doc.createRange(); g.selectNodeContents(el.firstChild || el);
    const rs = [...g.getClientRects()].filter((r) => r.width > 0);
    const x = met(el, 'x').fa, m = met(el, el.textContent.trim());
    return { top: rs[0].top + scrollY + x - m.a, base: rs[rs.length - 1].top + scrollY + x, centre: (Math.min(...rs.map((r) => r.left)) + Math.max(...rs.map((r) => r.right))) / 2 };
  };
  const font = (el) => { const s = cs(el); return { family: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: s.fontSize, weight: s.fontWeight, color: s.color, underline: s.textDecorationLine }; };
  const mid = doc.documentElement.clientWidth / 2;
  const h1 = doc.querySelector('h1'), h = lines(h1), target = doc.querySelector(below);
  const out = { gaps: { 'page top -> title': h.top }, centre: { title: h.centre - mid }, fonts: { title: font(h1) } };
  if (below === '#signInBox') {
    const box = target.getBoundingClientRect();
    out.text = 'the sign-in box';
    out.gaps['title -> sign-in box edge'] = box.top + scrollY - h.base;
    out.centre['sign-in box'] = (box.left + box.right) / 2 - mid;
  } else {
    const m = lines(target);
    out.text = target.textContent.trim();
    out.gaps['title -> message'] = m.top - h.base;
    out.centre.message = m.centre - mid;
    out.fonts.message = font(target);
  }
  if (corner) {
    const so = doc.getElementById('signOutButton');
    if (!so || cs(so).display === 'none') { out.corner = null; return out; }
    const g = doc.createRange(); g.selectNodeContents(so); const t = g.getClientRects()[0];
    const s = cs(so); c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; const m = c.measureText('Sign out');
    const base = t.top + m.fontBoundingBoxAscent + (t.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
    out.corner = { top: base - m.actualBoundingBoxAscent, right: doc.documentElement.clientWidth - (t.left + m.actualBoundingBoxRight), font: font(so) };
  }
  return out;
}

// The INSIDE of the LOCKED sign-in box (SIGNIN-BOX-STANDARD.md), by eye:
// letters for text, edges for boxes.
function measureBox() {
  const cs = getComputedStyle, doc = document, c = doc.createElement('canvas').getContext('2d');
  const met = (el, txt) => { const s = cs(el); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; return c.measureText(txt); };
  const lines = (el) => { // per line: baseline + top of the tallest letters
    const g = doc.createRange(); g.selectNodeContents(el);
    const rs = [...g.getClientRects()].filter((r) => r.width > 0);
    const fa = met(el, 'x').fontBoundingBoxAscent, a = met(el, el.textContent.trim()).actualBoundingBoxAscent;
    const out = [];
    for (const r of rs) { const base = r.top + fa; if (!out.length || Math.abs(out[out.length - 1].base - base) > 2) out.push({ base, top: base - a }); }
    return out;
  };
  const box = doc.getElementById('signInBox'), h2 = box.querySelector('h2'), intro = box.querySelector('p'), label = box.querySelector('label');
  const input = box.querySelector('input'), button = box.querySelector('button');
  const B = box.getBoundingClientRect(), I = input.getBoundingClientRect(), U = button.getBoundingClientRect();
  const H = lines(h2), P = lines(intro), L = lines(label);
  const font = (el) => { const s = cs(el); return `${s.fontFamily.split(',')[0].replace(/["']/g, '').trim()} ${s.fontSize} ${s.fontWeight} ${s.color}`; };
  return {
    edges: { 'box top -> "Sign in" letters': H[0].top - B.top, 'button -> box bottom': B.bottom - U.bottom, 'box left -> field': I.left - B.left, 'field -> box right': B.right - I.right, 'box left -> button': U.left - B.left },
    inside: { '"Sign in" -> intro letters': [P[0].top - H[H.length - 1].base, 15], 'intro line pitch': [P.length > 1 ? P[1].base - P[0].base : NaN, 24], 'intro -> "Email address" letters': [L[0].top - P[P.length - 1].base, 30], '"Email address" -> field edge': [I.top - L[L.length - 1].base, 15], 'field -> button': [U.top - I.bottom, 15] },
    sizes: { 'field height': [I.height, 45], 'button height': [U.height, 45], ...(innerWidth >= 580 ? { 'box width': [B.width, 540] } : {}) },
    fonts: { '"Sign in"': font(h2), intro: font(intro), '"Email address"': font(label), field: font(input), button: font(button) },
    colours: { box: cs(box).backgroundColor, field: cs(input).backgroundColor, button: cs(button).backgroundColor, 'field border': `${cs(input).borderTopWidth} ${cs(input).borderTopColor}`, 'button border': `${cs(button).borderTopWidth} ${cs(button).borderTopColor}`, corners: `${cs(box).borderTopLeftRadius} ${cs(input).borderTopLeftRadius} ${cs(button).borderTopLeftRadius}` },
  };
}
const NAVY = 'rgb(30, 38, 51)';
const BOX_FONTS = { '"Sign in"': `Montserrat 20px 700 ${NAVY}`, intro: `Montserrat 15px 400 ${NAVY}`, '"Email address"': `Montserrat 15px 700 ${NAVY}`, field: `Montserrat 16px 400 ${NAVY}`, button: `Montserrat 16px 700 ${NAVY}` };
const BOX_COLOURS = { box: 'rgb(233, 233, 235)', field: 'rgb(249, 249, 250)', button: 'rgb(249, 249, 250)', 'field border': `1px ${NAVY}`, 'button border': `1px ${NAVY}`, corners: '10px 10px 10px' };
function checkBox(check, where, b, edge) {
  for (const [k, v] of Object.entries(b.edges)) check('box spacing', Math.abs(v - edge) <= TOL, `box (${where}) ${k}: ${v.toFixed(1)}px (expected ${edge})`);
  for (const [k, [v, want]] of Object.entries(b.inside)) check('box spacing', Math.abs(v - want) <= TOL, `box (${where}) ${k}: ${v.toFixed(1)}px (expected ${want})`);
  for (const [k, [v, want]] of Object.entries(b.sizes)) check('box sizes', Math.abs(v - want) <= TOL, `box (${where}) ${k}: ${v.toFixed(1)}px (expected ${want})`);
  for (const [k, v] of Object.entries(b.fonts)) check('box fonts', v === BOX_FONTS[k], `box (${where}) ${k}: ${v}${v === BOX_FONTS[k] ? '' : `  <- expected ${BOX_FONTS[k]}`}`);
  for (const [k, v] of Object.entries(b.colours)) check('box colours', v === BOX_COLOURS[k], `box (${where}) ${k}: ${v}${v === BOX_COLOURS[k] ? '' : `  <- expected ${BOX_COLOURS[k]}`}`);
}

// CHROME_PATH lets it run on a computer that has Chrome but no Playwright browser.
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let totalFails = 0;
let pagesThatFailed = 0;
const missedInSelftest = [];
for (const p of PAGES) {
  const failed = new Set(); // kinds of check that failed on this page
  const check = (kind, ok, line) => { if (!ok) failed.add(kind); console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${line}`); };
  const desk = await openPage(browser, p, { width: 1920, height: 1080 });
  const r = await desk.evaluate(measure, { below: p.below, corner: !!p.corner });
  const boxDesk = p.below === '#signInBox' ? await desk.evaluate(measureBox) : null;
  await desk.close();
  console.log(`\n${p.name}  —  "${r.text}"`);
  for (const [k, v] of Object.entries(r.gaps)) check('spacing', Math.abs(v - 100) <= TOL, `${k}: ${v.toFixed(1)}px (expected 100)`);
  for (const [k, v] of Object.entries(r.centre)) check('centring', Math.abs(v) <= TOL, `${k} centred (${v.toFixed(1)}px off)`);
  const want = {
    title: { family: 'Montserrat', size: p.title, weight: '700', color: GOLD },
    message: { family: 'Montserrat', size: '20px', weight: '400', color: GREY_BLUE },
  };
  for (const [k, f] of Object.entries(r.fonts)) {
    const bad = Object.entries(want[k]).filter(([prop, val]) => f[prop] !== val).map(([prop, val]) => `${prop} ${f[prop]} (expected ${val})`);
    check(`${k} style`, !bad.length, `${k}: ${f.family} ${f.size} ${f.weight} ${f.color}${bad.length ? '  <- ' + bad.join(', ') : ''}`);
  }
  const phone = await openPage(browser, p, { width: 375, height: 812 });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const rPhone = p.corner ? await phone.evaluate(measure, { below: p.below, corner: true }) : null;
  const boxPhone = boxDesk ? await phone.evaluate(measureBox) : null;
  await phone.close();
  check('phone width', overflow <= 0, `phone 375px sideways scrolling: ${overflow}px`);
  if (boxDesk) {
    checkBox(check, 'computer', boxDesk, 60);
    checkBox(check, 'phone', boxPhone, 30);
  }
  if (p.corner) {
    const corners = [['computer', r.corner, 40], ['phone', rPhone.corner, 20]];
    for (const [where, cr, want40] of corners) {
      if (!cr) { check('Sign out position', false, `Sign out (${where}): not shown`); continue; }
      check('Sign out position', Math.abs(cr.top - want40) <= TOL && Math.abs(cr.right - want40) <= TOL, `Sign out (${where}): ${cr.top.toFixed(1)}px from the top, ${cr.right.toFixed(1)}px from the right (expected ${want40} / ${want40})`);
    }
    const f = r.corner ? r.corner.font : null;
    const ok = f && f.family === 'Montserrat' && f.size === '20px' && f.weight === '700' && f.color === GOLD && f.underline === 'none';
    check('Sign out style', !!ok, `Sign out: ${f ? `${f.family} ${f.size} ${f.weight} ${f.color} underline ${f.underline}` : 'not shown'}`);
  }
  totalFails += failed.size;
  if (failed.size) pagesThatFailed += 1;
  if (SELFTEST) {
    const mustCatch = ['spacing', 'centring', 'title style', 'phone width', ...(r.fonts.message ? ['message style'] : []), ...(p.corner ? ['Sign out position', 'Sign out style'] : []), ...(boxDesk ? ['box spacing', 'box sizes', 'box fonts', 'box colours'] : [])];
    for (const kind of mustCatch) if (!failed.has(kind)) missedInSelftest.push(`${p.name}: ${kind}`);
  }
}
await browser.close();

if (SELFTEST) {
  if (!missedInSelftest.length) {
    console.log(`\nSELF-TEST PASSED: every kind of deliberate drift was caught on all ${PAGES.length} pages.`);
    process.exit(0);
  }
  console.error(`\nSELF-TEST FAILED: the guard missed this deliberate drift:\n  ${missedInSelftest.join('\n  ')}`);
  process.exit(1);
}
if (totalFails) {
  if (DRILL) console.error('\nALARM DRILL: the pages were broken on purpose inside this test browser only. The real pages are untouched.');
  console.error(`\nDRIFT on ${pagesThatFailed} opening page(s). Fix the CSS back to the standard; never edit the standard to match drift.`);
  process.exit(1);
}
console.log(`\nAll ${PAGES.length} opening pages match the standard.`);
