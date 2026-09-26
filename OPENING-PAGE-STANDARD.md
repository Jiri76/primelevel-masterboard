# PrimeLevel opening-page standard

Approved by the owner on 2026-09-26: "create this as a standard ... every time we'll
have an opening page like that, it must follow the same principle."

An **opening page** is any screen that shows only a page title, one message line and
(optionally) a Sign out link. Examples today:

- Insider Edge before a report is opened: "Click a date to open a report."
- Inbox Report: "No reports to show yet ...", "... does not have access to this report.",
  "Could not load your reports right now ..."

Every opening page, on every PrimeLevel tool, must look exactly like this.

**LOCKED** (owner, 2026-09-26: "harden it or tighten it or lock it, so it won't drift
away ... this is a standard way"). The values below must not change without an
explicit request from the owner. When a page drifts, fix the page back to this
standard; never edit the standard to match the drift.

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

## How it is locked

1. **Automatic guard**: `tools/opening-page-check.mjs`, run by the GitHub Actions
   workflow **"Opening page guard"** (`.github/workflows/opening-page-check.yml`).
   It opens every page in a real browser and measures, by eye: the three 100px gaps
   (±1px), centring (±1px), each line's font, size, weight, colour and underline, and
   no sideways scrolling at 375px. Any drift fails the run and opens (or comments
   on) a GitHub Issue labelled `opening-page-drift`, listing the failing checks. That
   Issue is the same alert path as the report watchdogs, which GitHub emails to
   info@primelevel.co.uk.
   - Runs on every change to a guarded page, this file, the guard or its workflow;
     every Monday 14:30 UTC; and on demand (Actions → Opening page guard → Run
     workflow).
   - The Inbox Report screens only appear after sign-in, so inside the guard's own
     throwaway browser the Supabase library is swapped for a stand-in that plays
     each situation (no access / no reports yet / could not load). No real account,
     no real data.
   - **Self-test**: run it on demand with "selftest" ticked. It deliberately breaks
     every kind of rule on every page (title size and centring, message spacing and
     colour, Sign out underline, a too-wide element) and only passes if every break
     is caught. This proves the alarm itself still works.
   - **Alarm drill**: run it on demand with "drill" ticked. Same deliberate breaks,
     but the run fails on purpose and opens an "ALARM DRILL (test only)" Issue
     (label `opening-page-alarm-drill`). This proves the Issue and the email really
     arrive. Close the drill Issue afterwards.
2. **LOCKED notes** at the top of the `<style>` in `insider-edge.html` and
   `inbox-report.html` point here.
3. **New opening pages**: every page that gets an opening screen (empty, waiting,
   no access, could not load) follows this standard automatically, and is added to
   `PAGES` at the top of `tools/opening-page-check.mjs` in the same commit that
   creates it, with a stand-in state for each message if it needs sign-in. A page
   that is not in the guard is not protected.

To run it on a computer (needs Node and Python):

```bash
python -m http.server 8091
```

```bash
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node tools/opening-page-check.mjs
```

(`playwright` must be installed with npm first; add `SELFTEST=1` for the self-test or
`DRILL=1` for a run that fails on purpose.)

## Verified

2026-09-26, 1920px wide, fonts loaded: Insider Edge (live) and all three Inbox Report
messages (no access / no reports yet / could not load) measured **100 / 100 / 100 px**,
all lines 0px off centre, fonts exactly as the table above; 375px phone: no sideways
scrolling. The same day the guard itself was proven: the normal run passed on all
4 screens, and the self-test caught every deliberate break on all 4.
