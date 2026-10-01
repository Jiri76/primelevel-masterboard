# PrimeLevel opening-page standard

Approved by the owner on 2026-09-26: "create this as a standard ... every time we'll
have an opening page like that, it must follow the same principle."

An **opening page** is any screen that shows only a page title and one message line
(on signed-in pages the corner Sign out is there too: it belongs to every page, not to
the opening page). Examples today:

- Insider Edge before a report is opened: "Click a date to open a report."
- Inbox Report: "No reports to show yet ...", "Could not load your reports right now ..."
- The Masterboard front door: "Done. Check your email for your sign-in link." and
  "... does not have access to the Masterboard." (its sign-in box itself sits 100px below
  the title too).

Every opening page, on every PrimeLevel tool, must look exactly like this.

**LOCKED** (owner, 2026-09-26: "harden it or tighten it or lock it, so it won't drift
away ... this is a standard way"). The values below must not change without an
explicit request from the owner. When a page drifts, fix the page back to this
standard; never edit the standard to match the drift.

## The rules

| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Page title (e.g. "Insider Edge", "Inbox Report") | Montserrat | 50px (60 → 50 by the owner, 2026-09-28; the Masterboard home title stays 60px) | Bold (700) | Company gold `#B29B68` |
| The message line (every message, no exceptions) | Montserrat | 20px | Regular (400) | Soft grey-blue `#8A93A3` |
| Sign out (every signed-in page) | Montserrat | 20px | Bold (700) | Company gold `#B29B68`, no underline |

**Sign out lives in the top-right corner of every page** (owner, 2026-10-01; built
2026-10-02): 40px / 40px from the letters on a computer, 20 / 20 on phones. It is drawn
by `door.js`, the one front door every private page shares; full spec: "Sign out" in
`SIGNIN-BOX-STANDARD.md`. It replaced the old centred Sign out 100px under the message.

| Spacing (measured **by eye**) | Value |
|---|---|
| Top of the page → top of the title letters | **100px** |
| Bottom of the title letters → top of the message letters | **100px** |

- **100 everywhere** (owner, 2026-10-01: "Everything must be those 100 pixels from the
  top. Consistency across the whole board, across the whole website… until told
  otherwise"). Page top → title letters = 100 and title letters → the first thing
  under it = 100 by eye on EVERY page (the Masterboard home included) at EVERY
  width, phones included. 50 on phones was considered and rejected by the owner:
  "it gives more breathing room between the sections; 50-50 everything seems
  crammed together". Only distances to the narrow SIDE edges shrink on phones
  (sign-in box edges 60 → 30, Sign out corner 40 → 20).
- By eye means letters for text and EDGES for boxes: never a glow or a shadow.
- Every date shows a three-letter month: "28 Sep 2026" (owner rule, 2026-10-01).
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
| `h1` | 50px, 700, gold, `line-height: 65px`, `margin: 0 0 85px`, centred | same |
| `.empty-state` (the message) | 20px, 400, `var(--placeholder)`, centred, `padding: 0 0 60px`; `margin-top: -4px` when no date buttons sit in between | same |

Narrow screens (both pages, and the Masterboard home with its 60px title) carry their own
measured values for 100 by eye at every width; each page's CSS comments name them.

Why `line-height: 65px`: at 50px the title's letters are 8px shorter than at 60px,
and a normal line would lose 2px of space above the letters and 2px below them. The
65px line gives exactly that space back, so all the numbers above (and the 100px gaps
they produce) stayed the same when the title went from 60 to 50. Phones (≤720px) keep
their 44px title with `line-height: normal`.

Nudging a gap by a few px: use **padding, not margin** on the message; a small
`margin-top` collapses into the title's larger `margin-bottom` and does nothing.

## How it is locked

1. **Automatic guard**: `tools/opening-page-check.mjs`, run by the GitHub Actions
   workflow **"Opening page guard"** (`.github/workflows/opening-page-check.yml`).
   It opens every page in a real browser and measures, by eye: page top → title and
   title → message (or → the sign-in box's edge) at 100px (±1px), centring (±1px),
   each line's font, size, weight and colour, the corner Sign out (40 / 40 on a
   computer, 20 / 20 on a phone, 20px bold gold, no underline) and no sideways
   scrolling at 375px. Screens: the Masterboard front door (sign-in box; after
   sending), Insider Edge (no report open) and the Inbox Report (no reports yet;
   could not load). Any drift fails the run and opens (or comments on) a GitHub
   Issue labelled `opening-page-drift`, listing the failing checks. That Issue is
   the same alert path as the report watchdogs, which GitHub emails to
   info@primelevel.co.uk.
   - Runs on every change to a guarded page, `door.js`, the standards, the guard or
     its workflow; every Monday 14:30 UTC; and on demand (Actions → Opening page
     guard → Run workflow).
   - Every private page sits behind `door.js` and the guard's throwaway browser is
     never signed in, so the Supabase library is swapped for a stand-in
     (`tools/guard-supabase.mjs`): signed out for the front door's screens, a
     pretend owner for the inner pages. Insider Edge keeps reading its REAL reports
     (pretend key, real data); the Inbox Report plays each situation. No real
     account, no password, nothing written.
   - **Self-test**: run it on demand with "selftest" ticked. It deliberately breaks
     every kind of rule on every page (title size and centring, the message's and
     the sign-in box's spacing, message colour, Sign out position and underline, a
     too-wide element) and only passes if every break is caught. This proves the
     alarm itself still works.
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

2026-09-28: title changed from 60px to 50px on the owner's request. Before the
change went live, both guards were run against the live pages and against the new
version: every gap measured identical (100 / 100 / 100 on all 4 screens), only the
title size differed.

2026-10-02 (branch `front-door-wip`, before go-live): one front door (`door.js`) on every
private page; Sign out moved to the corner; the Inbox Report's own sign-in and "no
access" screen removed (the front door handles both). The rebuilt guard, run locally:
all 5 screens pass (100 / 100, 0px off centre, Sign out 40.0 / 39.7 and 20.0 / 19.7, no
sideways scroll), and the self-test caught every deliberate break on all 5.
