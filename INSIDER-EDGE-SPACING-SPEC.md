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
| **30px** | Ticker line → its text · last text line of an entry → next ticker · each of the three check lines → the next |
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
| Text (paragraphs, the company/sector/market-cap line, the three closing lines) | **15px** |

**Page titles — also LOCKED by the owner 2026-09-21 ("do not change"):** the page
title "Insider Edge" is **60px**, the title inside the dark band is **35px**, and
the date line under it is **15px** (same as the text). Guarded automatically.

## The CSS values that produce this (desktop, ≥1728px)

The CSS numbers are smaller than 100/30 because they compensate for the space
inside line boxes (about 6px below the baseline, 8–10px above the tallest
letter). They were measured live, not guessed.

| Setting | CSS |
|---|---|
| `.container` | `padding: 90px 20px 100px` |
| `h1` | `font-size: 60px; margin: 0 0 85px` |
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

Narrow screens (≤1727px: buttons become a row; ≤720px: phone) keep their own
responsive values; the guard checks desktop width.

## If the guard fails

1. Read the failing line: it names the gap and the measured value.
2. Fix the CSS so the value returns to 100 / 30 / 24 (or the font size) — never
   edit this spec to match a drifted page.
3. Re-run the "Insider Edge layout guard" workflow and confirm it passes.
