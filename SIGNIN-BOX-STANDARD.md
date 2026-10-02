# PrimeLevel sign-in box standard

Designed with the owner over 2026-09-27 → 2026-09-30 (versions v1 → v10) and **LOCKED**.
Owner: "I would like to create this box once for all… then I will just ask you: create a
sign-in page." Every PrimeLevel sign-in box copies this exactly. The values below must not
change without an explicit request from the owner. When a page drifts, fix the page;
never edit the standard to match the drift.

Reference implementation (CSS + HTML): `docs/signin-box-reference.html`.

## Colours (only the company colours)

| Element | Colour |
|---|---|
| Page background | Company navy `#1E2633` |
| Card | 7.5% navy mixed into white: `#E9E9EB` (0.925 × `#F9F9FA` + 0.075 × `#1E2633`, per channel) |
| Email field and both buttons | Company white `#F9F9FA`, 1px navy border |
| All text in the card | Company navy `#1E2633` |
| Page title above the card | Company gold `#B29B68` (the page title standard: 50px bold; Masterboard home 60px) |
| Keyboard focus ring | 2px company gold outline, 2px offset |

No black anywhere (the body colour is set to navy). No gold on the buttons: the two sign-in
routes are equal choices, and gold is reserved for buying.

## Sizes

| Element | Value |
|---|---|
| Card | max-width 540px, corners 10px |
| Email field, both buttons | full card width (420px on desktop), **45px tall**, corners 10px |

## Fonts (Montserrat)

| Text | Size | Weight |
|---|---|---|
| "Sign in" | 20px | Bold |
| Intro sentence | 15px, 24px line pitch | Regular |
| "Email address" label | 15px | Bold |
| What you type in the field | 16px | Regular |
| Button text | 16px | Bold |
| "or" | 15px | Regular |

Rule behind it: everything INSIDE a field or button is 16px; text AROUND them is 15px.
16px typing also stops iPhone Safari from zooming in when the field is tapped.

## Spacing (measured BY EYE: baseline of the letters above → top of the tallest letters below, or to an edge)

| Gap | Desktop | Phone (≤720px) |
|---|---|---|
| Card edges: top → "Sign in", sides, last button → bottom | **60px** | **30px** |
| Inside a group: "Sign in" → intro, "Email address" → field, field → first button | **15px** | 15px |
| Between groups: intro → "Email address", first button → "or" line, "or" line → second button | **30px** | 30px |
| Intro line pitch | 24px | 24px |

Only four sizes in the whole box (15, 24, 30, 60; 30 on phones at the edges).
Text inside the buttons is centred by eye (16px above the letters, 16px below). In the
email field it is 16 / 17: typed 16px regular letters are 12px tall, leaving an odd 33px,
so an exact split is physically impossible at 45px; this is the closest.

## Wording

- Heading: "Sign in"
- Intro: "Your [page] is private. Enter your email address and we'll send you a link to sign in."
- Label: "Email address"
- Button: "Send me a sign-in link" (one word everywhere: "sign-in link")
- Divider: "or"
- Second button: "Sign in with passkey" — shown ONLY once passkeys genuinely work. No dead buttons.

## Behaviour

- **Hover / press (colour swap):** pointing at a button turns it company navy with company
  white text and scales it to 1.02; pressing scales it to 0.97 (same colours).
  `transition: background-color .15s, color .15s, transform .1s`. Only the button moves.
  Phones have no hover, only the press.
- **Click → "Done".** No "Sending…", no spinner, the button never changes its look. The page
  waits for Supabase's reply (well under a second) before showing "Done", so Done is never
  false; further clicks are ignored while waiting (no duplicate emails).
- **Privacy:** `signInWithOtp` with `shouldCreateUser: false`. The page shows the SAME "Done"
  whatever email was typed, so a stranger never learns which emails are allowed.
- **Real failure** (network down, rate limit): the box stays and a short error appears under
  the button.

## After-send screen

The whole box disappears and ONE line appears under the page title:

> Done. Check your email for your sign-in link.

It follows the **opening-page standard exactly** (`OPENING-PAGE-STANDARD.md`): message 20px
regular soft grey-blue `#8A93A3`, 100px by eye below the title, centred. Proven identical,
side by side with the Insider Edge reference page, on 2026-09-30.

## Text smoothing

Windows ClearType puts faint coloured edges on thin text. Tested 2026-09-30: grey smoothing
removes them but makes the navy text paler, and the owner saw no difference at normal size.
Decision: keep ClearType; no fix.

## Sign out (every signed-in page) — LOCKED 2026-10-01

Owner: "Sign out must match on every page: style, font, size, colour, and position
too. So it's top right on every page."

| | Value |
|---|---|
| Wording | "Sign out" |
| Font | Montserrat 20px bold, company gold `#B29B68`, no underline |
| Position | Top-right corner of the screen, fixed (stays put when scrolling) |
| Spacing BY EYE (desktop) | top of screen → top of the letters **40px** = last letter "t" → right edge **40px** (mirrors the Masterboard tiles, 40px from the left edge) |
| Spacing BY EYE (phones ≤720px) | **20px / 20px** (the page gutter) |
| CSS that produces it (measured) | desktop `position: fixed; top: 37px; right: 40px;` · phones `top: 17px; right: 20px;` (the top is 3px less for the letters' own space inside the line) |

Shown ONLY when signed in. Built 2026-10-02: `door.js` (the one front door every
private page loads first) draws it, identical on every page (Masterboard, Inbox Report,
Insider Edge, Investments, Renewals), and it signs out everywhere, wipes everything
private the browser remembers and lands on the front door. It replaced the old centred
Sign out under the Inbox Report's opening message. Out of the way, so it can't be
clicked by accident, and never competing with the page's content.

## One front door (owner, 2026-10-02)

"One code, one door, which is accessed in the Masterboard. Once I access the Masterboard,
no more boxes." This box exists ONLY on the Masterboard front door
(`https://jiri76.github.io/primelevel-masterboard/`). Every other private page has no
sign-in of its own: `door.js` sends anyone but the signed-in owner to the front door. The
sign-in email (Supabase → Authentication → Emails → Magic link) has only the Masterboard
version plus the general version the mobile app needs (VERSION 2026-10-02b).

## How it is locked

1. This file, plus the reference implementation `docs/signin-box-reference.html`.
2. **Guard** (`tools/opening-page-check.mjs`, "Opening page guard"): the Masterboard
   front door's box (100px by eye below the title, centred) and its after-send screen
   ("Done…", the opening-page message exactly), plus the corner Sign out on every
   signed-in page (40/40, phones 20/20, font, colour, no underline), AND the box's own
   inside values on a computer and a phone (added 2026-10-02): the edges 60 (phones 30),
   the 15 / 30 gaps, the 24 line pitch, 45px field and button, 540px width, every font and
   colour, the 1px navy borders and the 10px corners. Alarm by GitHub Issue + email. Not
   guarded: where the letters sit INSIDE the field and the button (16/17 and 16/16, set by
   eye on 2026-09-30); they follow from the guarded 45px height and fixed padding. A value
   that is not in the guard is not protected.
3. Trigger phrases: "create a sign-in page", "standard sign-in box" → apply ALL of this
   without asking the owner to restate it.
