# Insider Edge report — LOCKED spacing and font-size settings

Approved by the owner on 2026-09-21 ("Perfect. All checked."). **Every weekly
report must follow these settings, exactly.** Do not change a value here or in
`insider-edge.html` without an explicit request from the owner. The automated
guard (`tools/spacing-check.mjs`, workflow "Insider Edge layout guard") measures
the live page against this file on every change and every Monday after the
report lands, and fails loudly if anything drifts.

Visual map, drawn to scale: `docs/insider-edge-spacing-map.html`
(also published as a Claude artifact: https://claude.ai/artifact/Lf5c7s47wpg3Y3fQQjHTiL).

## How spacing is measured

**By eye**: from the bottom of the letters above (the baseline; the tails of
g/p/y are ignored) to the top of the tallest letters below — or to the edge of
the card, band or underline. This is what the reader sees. It is deliberately
*not* the CSS box gap, because letters sit inside taller line boxes.

## The spacings: 100px, 30px, 24px — plus the locked 15px

| Spacing | Where |
|---|---|
| **100px** | Page top → "Insider Edge" letters · "Insider Edge" bottom → card top · card top → title letters · date line bottom → bottom of dark band · band bottom → "New Discoveries" letters · every heading underline → first line beneath it · last line of a section → next heading's letters · last Verdict line → first check line · last check line → card bottom · card bottom → page bottom · when no report is open, the “Insider Edge” title → the “Click a date to open a report.” message (desktop) |
| **30px** | Ticker line → its text · last text line of an entry → next ticker · each closing italic line → the next (since 2026-09-28 always four: the database's three check lines, then the agent's Notebook line) |
| **24px** | The normal line height between lines inside a paragraph (no extra gap) |
| **15px** | LOCKED by the owner 2026-09-21: title → date line inside the dark band, AND the bottom of every chapter heading's letters → its underline (all six headings identical) |

Both 15px gaps are locked and guarded. (The 15px is measured from the bottom of the
letters; the small tails of g/y/p reach 10–14px.) A wrapped ticker line (narrow
screens) reads 28px instead of 30px — unavoidable.

## The only three font sizes (report body)

| Type | Size |
|---|---|
| Chapter headings (New Discoveries, Institutional Buying, Fundamentals, Watch Line, Repeat Alerts, Verdict) | **25px** |
| Tickers (including Verdict tickers and stars) | **20px** |
| Text (paragraphs, the company/sector/market-cap line, the closing italic lines) | **15px** |

**Page titles — also LOCKED by the owner 2026-09-21 ("do not change"):** the page
title "Insider Edge" is **50px** (changed from 60px by the owner on 2026-09-28, with
every gap kept exactly as before), the title inside the dark band is **35px**, and
the date line under it is **15px** (same as the text). Guarded automatically.

## The CSS values that produce this (desktop, ≥1728px)

The CSS numbers are smaller than 100/30 because they compensate for the space
inside line boxes (about 6px below the baseline, 8–10px above the tallest
letter). They were measured live, not guessed.

| Setting | CSS |
|---|---|
| `.container` | `padding: 90px 20px 100px` |
| `h1` | `font-size: 50px; line-height: 65px; margin: 0 0 85px` (the 65px line keeps the same space above and below the letters the 60px title had, so no gap moved) |
| `.report-header-band` | `padding: 94px 70px 96px; margin: 0 0 91px` |
| `.empty-state` (message shown before any report is opened; desktop ≥1728px only) | `margin-top: -4px` (title → message = 100px by eye) |
| `.report-content-title` | `font-size: 35px; margin-bottom: 3px` (title → date = 15px by eye) |
| `.report-body h3` | `font-size: 25px; margin: 83.5px 0 91px` (first: `margin-top: 0`) |
| `.report-body h3 + ul:not(:has(strong))` (the "None." lists) | `padding-top: 4px` |
| `.entry-head` (ticker line, made a block by the page script) | `margin-bottom: 17px` |
| `.report-body li`, Verdict `p` | `margin-bottom: 15px` |
| Check lines `p:has(> em)` | `margin-bottom: 18px` |
| First check line after Verdict | `margin-top: 88px` |
| `.report-body` | `padding: 0 70px 93px` |
| Ticker | `font-size: 20px`; body text `15px`; line height 24px |

### Narrow screens (owner, 2026-10-01: "100 everywhere until told otherwise")

Below 1728px the date buttons become a centred row between the title and the
report. Page top → title letters and title letters → the top EDGE of the date
buttons are **100px by eye at every width**, phones included (the owner chose
100 over 50 on phones: "it gives more breathing room between the sections").
Measured to the button's edge, never to the gold "unread" glow, which reaches
~7px higher and disappears once a report is read.

| Width | `.container` padding-top | `h1` |
|---|---|---|
| 721–1727px | 90px (as desktop) | 50px, `margin-bottom: 85px` |
| ≤720px (phones) | 92px | 44px, `line-height: normal`, `margin-bottom: 89px` |
| ≤359px (small phones) | 93px | 38px (44px wrapped onto two lines at 320px), `margin-bottom: 90px` |

**Date buttons** show the month as three letters, "28 Sep 2026" (owner rule,
2026-10-01): "28 September 2026" did not fit the 200px button on any screen.
The months are spelled out in the page script (the browser's British short
month writes September as "Sept").

### Phones: one 70 rhythm INSIDE the report card (owner, 2026-10-05)

Owner, after the side-by-side ruler mock-up: "go with seventy… we want to have
one nice rhythm". On screens ≤720px wide, every gap that is 100px by eye INSIDE
the report card is **70px by eye**: card top → title letters, date line → band
bottom, band bottom → "New Discoveries", every heading underline → its first
line, last line of a section → next heading, last Verdict line → first check
line, last check line → card bottom. (Before: 52 / 44 / 57 at the card's edges
but still 100 between sections, so the gaps inside were bigger than the frame.)
The page's own 100s are unchanged (page top → title, title → date buttons, card
bottom → page bottom), and so are the 30 / 24 / 15 gaps and every font size.
Computers and tablets (721px and wider) are exactly as above.

| Selector (inside `@media (max-width: 720px)`) | Value |
|---|---|
| `.report-header-band` | `padding: 66px 24px 66px; margin-bottom: 61px` |
| `.report-body h3` | `margin: 53.5px 0 61px` |
| First check line after Verdict (both selectors) | `margin-top: 58px` |
| `.report-body` | `padding: 0 24px 63px` |

The guard checks the computer width (1920) AND a phone (iPhone, 375 wide: 70
inside the card, 100 for the page, titles 44 / 26). The other narrow values
were proven with the spacing survey and the clipped-text check (`ClaudeCode-Backup/reference-files/test-scripts/`)
at 320–1920px.

## If the guard fails

1. Read the failing line: it names the gap and the measured value.
2. Fix the CSS so the value returns to 100 / 30 / 24 (or the font size) — never
   edit this spec to match a drifted page.
3. Re-run the "Insider Edge layout guard" workflow and confirm it passes.
