# PrimeLevel opening-page standard

Approved by the owner on 2026-09-26: "create this as a standard ... every time we'll
have an opening page like that, it must follow the same principle."

An **opening page** is any screen that shows only a page title, one message line and
(optionally) a Sign out link. Examples today:

- Insider Edge before a report is opened: "Click a date to open a report."
- Inbox Report: "No reports to show yet ...", "... does not have access to this report.",
  "Could not load your reports right now ..."

Every opening page, on every PrimeLevel tool, must look exactly like this.

## The rules

| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Page title (e.g. "Insider Edge", "Inbox Report") | Montserrat | 60px | Bold (700) | Company gold `#B29B68` |
| The message line (every message, no exceptions) | Montserrat | 20px | Regular (400) | Soft grey-blue `#8A93A3` |
| Sign out (when shown) | Montserrat | 20px | Bold (700) | Company gold `#B29B68`, no underline |

| Spacing (measured **by eye**, desktop) | Value |
|---|---|
| Top of the page → top of the title letters | **100px** |
| Bottom of the title letters → top of the message letters | **100px** |
| Bottom of the message letters → top of "Sign out" | **100px** |

- Every line is **centred** on the screen (measured: 0px off the centre line).
- **One style for every message.** No red, no bold, no per-message colours: a
  "no access" message looks exactly like "no reports yet".
- "By eye" means from the bottom (baseline) of the letters above to the top of the
  tallest letters below, not CSS box to box. See `INSIDER-EDGE-SPACING-SPEC.md`,
  "How spacing is measured".

## CSS that produces it (as used on both pages, desktop ≥1728px)

The CSS numbers are smaller than 100 because letters sit inside taller line boxes.
They were measured live, not guessed, and **must be re-measured for any new page**
(the exact title text changes the letter metrics by a few px: "Inbox Report" needs
`padding-top: 87px` where "Insider Edge" needs `90px`).

| Rule | insider-edge.html | inbox-report.html |
|---|---|---|
| `.container` padding-top | 90px | 87px |
| `h1` | 60px, 700, gold, `margin: 0 0 85px`, centred | same |
| `.empty-state` (the message) | 20px, 400, `var(--placeholder)`, centred, `padding: 0 0 60px`; `margin-top: -4px` at ≥1728px | same |
| `.signout` | n/a | 20px, 700, gold, no underline, `width: fit-content; margin: 31px auto 0` |

Nudging a gap by a few px: use **padding, not margin** on the message; a small
`margin-top` collapses into the title's larger `margin-bottom` and does nothing.

## Verified

2026-09-26, 1920px wide, fonts loaded: Insider Edge (live) and all three Inbox Report
messages (no access / no reports yet / could not load) measured **100 / 100 / 100 px**,
all lines 0px off centre, fonts exactly as the table above; 375px phone: no sideways
scrolling.
