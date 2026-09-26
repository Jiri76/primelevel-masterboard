// PrimeLevel opening-page guard.
//
// Measures every "opening page" (page title + one message line + optional
// Sign out) against the LOCKED standard in OPENING-PAGE-STANDARD.md and exits 1
// (fails the workflow) if anything has drifted:
//   * page top -> title letters, title -> message, message -> Sign out: 100px BY EYE
//     (baseline of the letters above -> top of the tallest letters below)
//   * every line centred on the screen
//   * title 60px bold gold; message 20px regular soft grey-blue; Sign out 20px bold
//     gold with no underline
//   * no sideways scrolling on a 375px phone
//
// The Inbox Report's screens only appear after sign-in. Inside this guard's own
// throwaway browser the Supabase library is replaced by a small stand-in that
// pretends to be signed in and returns each situation (no access / no reports /
// could not load). No real account, no real data, nothing leaves the browser.
//
// SELFTEST=1 proves the alarm works: it deliberately breaks the styling of every
// page and the run only passes if the guard catches the drift on every one.
// DRILL=1 applies the same breaks but judges them like a normal run, so the run
// FAILS on purpose: used to prove the Issue + email alert actually arrives.
//
// NEW OPENING PAGE? Add it to PAGES below in the same commit that creates it.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:8091';
const SELFTEST = process.env.SELFTEST === '1';
const DRILL = process.env.DRILL === '1';
const TOL = 1; // px
const GOLD = 'rgb(178, 155, 104)';
const GREY_BLUE = 'rgb(138, 147, 163)';

// ready = what appears once the page has finished drawing its opening message.
// Insider Edge is the real page with real data: once its reports load it swaps
// "No reports yet ..." for "Click a date to open a report.". If they never load,
// the "No reports yet" line is measured instead (it is an opening message too).
const PAGES = [
  { name: 'Insider Edge: no report open', path: '/insider-edge.html', ready: '.closed-state', signout: false },
  { name: 'Inbox Report: no access', path: '/inbox-report.html', state: 'denied', ready: '.signout', signout: true },
  { name: 'Inbox Report: no reports yet', path: '/inbox-report.html', state: 'empty', ready: '.signout', signout: true },
  { name: 'Inbox Report: could not load', path: '/inbox-report.html', state: 'error', ready: '.signout', signout: true },
];

const supabaseStandIn = (state) => `
export const createClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: { user: { email: 'guard@example.com' } } } }),
    getUser: async () => ({ data: { user: { email: 'guard@example.com' } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
    signInWithOtp: async () => ({ error: null }),
  },
  rpc: async () => (${JSON.stringify(state)} === 'error'
    ? { data: null, error: { message: 'guard stand-in' } }
    : { data: ${JSON.stringify(state)} !== 'denied', error: null }),
  from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
});`;

async function openPage(browser, p, viewport) {
  const page = await browser.newPage({ viewport });
  if (p.state) {
    await page.route(/esm\.sh\/@supabase\/supabase-js/, (route) => route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: supabaseStandIn(p.state),
    }));
  }
  await page.goto(BASE + p.path, { waitUntil: 'networkidle' });
  if (p.signout) {
    await page.waitForSelector(p.ready, { timeout: 30000 });
  } else {
    await page.waitForSelector(p.ready, { timeout: 20000 }).catch(() => console.log(`  (note: ${p.ready} never appeared, measuring the message that is showing)`));
  }
  if (SELFTEST || DRILL) {
    // Deliberate drift that must trip every kind of check: title shrunk and pushed
    // off centre, message pushed down and recoloured, Sign out underlined, and
    // something too wide for a phone.
    await page.addStyleTag({ content: 'h1{font-size:58px!important;text-align:left!important}.empty-state{padding-top:9px!important;color:#ff0000!important}.signout{text-decoration:underline!important}.container::after{content:"";display:block;width:3000px;height:1px}' });
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return page;
}

function measure() {
  const cs = getComputedStyle, doc = document;
  const c = doc.createElement('canvas').getContext('2d');
  const met = (el, txt) => { const s = cs(el); c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; const m = c.measureText(txt); return { a: m.actualBoundingBoxAscent, fa: m.fontBoundingBoxAscent }; };
  const lines = (el) => {
    const g = doc.createRange(); g.selectNodeContents(el.firstChild || el);
    const rs = [...g.getClientRects()].filter((r) => r.width > 0);
    const x = met(el, 'x').fa, m = met(el, el.textContent.trim());
    return {
      top: rs[0].top + scrollY + x - m.a,
      base: rs[rs.length - 1].top + scrollY + x,
      centre: (Math.min(...rs.map((r) => r.left)) + Math.max(...rs.map((r) => r.right))) / 2,
    };
  };
  const font = (el) => { const s = cs(el); return { family: s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), size: s.fontSize, weight: s.fontWeight, color: s.color, underline: s.textDecorationLine }; };
  const h1 = doc.querySelector('h1'), msg = doc.querySelector('.empty-state'), out = doc.querySelector('.signout');
  const h = lines(h1), m = lines(msg), o = out ? lines(out) : null, mid = doc.documentElement.clientWidth / 2;
  return {
    text: msg.textContent.trim(),
    gaps: { 'page top -> title': h.top, 'title -> message': m.top - h.base, ...(o ? { 'message -> Sign out': o.top - m.base } : {}) },
    centre: { title: h.centre - mid, message: m.centre - mid, ...(o ? { 'Sign out': o.centre - mid } : {}) },
    fonts: { title: font(h1), message: font(msg), ...(out ? { 'Sign out': font(out) } : {}) },
  };
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
  const r = await desk.evaluate(measure);
  await desk.close();
  console.log(`\n${p.name}  —  "${r.text}"`);
  for (const [k, v] of Object.entries(r.gaps)) check('spacing', Math.abs(v - 100) <= TOL, `${k}: ${v.toFixed(1)}px (expected 100)`);
  for (const [k, v] of Object.entries(r.centre)) check('centring', Math.abs(v) <= TOL, `${k} centred (${v.toFixed(1)}px off)`);
  const want = {
    title: { family: 'Montserrat', size: '60px', weight: '700', color: GOLD },
    message: { family: 'Montserrat', size: '20px', weight: '400', color: GREY_BLUE },
    'Sign out': { family: 'Montserrat', size: '20px', weight: '700', color: GOLD, underline: 'none' },
  };
  for (const [k, f] of Object.entries(r.fonts)) {
    const bad = Object.entries(want[k]).filter(([prop, val]) => f[prop] !== val).map(([prop, val]) => `${prop} ${f[prop]} (expected ${val})`);
    check(`${k} style`, !bad.length, `${k}: ${f.family} ${f.size} ${f.weight} ${f.color} underline ${f.underline}${bad.length ? '  <- ' + bad.join(', ') : ''}`);
  }
  const phone = await openPage(browser, p, { width: 375, height: 812 });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await phone.close();
  check('phone width', overflow <= 0, `phone 375px sideways scrolling: ${overflow}px`);
  totalFails += failed.size;
  if (failed.size) pagesThatFailed += 1;
  if (SELFTEST) {
    const mustCatch = ['spacing', 'centring', 'title style', 'message style', 'phone width', ...(p.signout ? ['Sign out style'] : [])];
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
  console.error(`\nDRIFT on ${pagesThatFailed} opening page(s). Fix the CSS back to OPENING-PAGE-STANDARD.md; never edit the standard to match drift.`);
  process.exit(1);
}
console.log(`\nAll ${PAGES.length} opening pages match the standard.`);
