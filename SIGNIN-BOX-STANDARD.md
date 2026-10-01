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

Shown ONLY when signed in. It replaces the old centred Sign out under the Inbox
Report's opening message: when the single sign-in ships, the opening-page standard
becomes title + message only, and this corner Sign out is the one exit on every page
(Masterboard, Inbox Report, Insider Edge, Investments, Renewals). Out of the way, so
it can't be clicked by accident, and never competing with the page's content.

## How it is locked

1. This file, plus the reference implementation `docs/signin-box-reference.html`.
2. **Guard:** the first real page that uses this box (the Masterboard front door) adds the
   box AND its after-send screen to the automatic guards in the same commit: every value
   above measured (±1px), desktop and phone, alarm by GitHub Issue + email, like the
   opening-page guard. A page that is not in the guard is not protected.
3. Trigger phrases: "create a sign-in page", "standard sign-in box" → apply ALL of this
   without asking the owner to restate it.
