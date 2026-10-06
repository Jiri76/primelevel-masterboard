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
| Focus (owner, 2026-10-02: navy, not gold) | Email field: its navy border thickens 1px → 2px while typing. Buttons reached with the keyboard: 2px navy ring, 2px offset. (Gold on the light card is only ~2.3:1 contrast, below the 3:1 a focus marker needs; navy is ~13:1.) |

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
| Card top → "Sign in" letters | **102px** | **72px** |
| Last button → card bottom (the line's slot always kept, see below) | **102px** = 30 + 12 + 60 | **72px** = 30 + 12 + 30 |
| Card sides | **60px** | **30px** |
| Inside a group: "Sign in" → intro, "Email address" → field, field → first button | **15px** | 15px |
| Between groups: intro → "Email address", first button → "or" line, "or" line → second button | **30px** | 30px |
| Intro line pitch | 24px | 24px |

Inside the card only four sizes (15, 24, 30, 60; 30 on phones), plus the card's top and
bottom, which are the same number (102, phones 72).

**ONE card size (owner, 2026-10-03: "I don't want one card smaller, one card bigger, just
one type of card").** The slot for the line under the button ("Access denied.",
"Sending failed. Try again.", "Link expired. Send again.", "Wait a minute. Send again.") is ALWAYS kept, so the card is the same height with or
without it (433px on a computer, 397px on a 375px phone) and nothing moves when it appears. With
the line: button edge → its letters **30** (= intro → "Email address": every separate line
is its own group), its letters 12px tall, its baseline → card bottom **60** (phones 30):
30 + 12 + 60 = **102**. Without it: button → card bottom = **102** (phones 72). The card
top matches: card top → "Sign in" = **102** (phones 72). Every message must fit ONE line
in the narrowest card (220px of room on a 320px phone; 15px Montserrat), so it never grows
the card ("punchy, direct, no fluff"), and it never names anything whose length varies (an
address, a name, a number): that goes in the field instead (owner, 2026-10-03, after
"Access denied for [address]." wrapped on a 320px phone). CSS: `.signin { padding: 99px 60px
60px }` (phones `69px 30px 30px`); `.signin .message { margin: 25px 0 0 }`; when the line
is the last thing in the card `display: block; min-height: 24px; margin-bottom: -7px`.
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
- **Click → "Done", instantly** (owner, 2026-10-02: seamless). No "Sending…", no spinner, the
  button never changes its look. "Done" shows the moment the button is clicked; Supabase
  sends the email in the background (it answers only after the mail has gone, ~1-2s, which
  the owner noticed as a lag). Further clicks are ignored while it sends (no duplicate
  emails).
- **Privacy:** `signInWithOtp` with `shouldCreateUser: false`. The page shows the SAME "Done"
  whatever email was typed, so a stranger never learns which emails are allowed.
- **An account without access** (owner, 2026-10-02: "the Sign out shouldn't be there… I'm
  not in"): after its emailed link it is signed out automatically and the box comes back,
  with the refused address already in the field and one line under the button: "Access
  denied." (owner: direct, it is for strangers; the address sits in the field so the line
  fits one row at every width, 2026-10-03). Nothing to press, no wrong account left signed
  in. Sign out appears for the owner only.
- **A link that no longer works** (owner, 2026-10-04, after a sign-in "loop": every new
  link cancels the previous one, and an older email in the same Gmail conversation was
  clicked): Supabase sends the browser back with `#error_code=otp_expired`. The box shows
  one line under the button, "Link expired. Send again." (187px: one row at every width;
  "Link expired. Send a new one." measured 222px and would wrap on a 320px phone), the
  address already in the field, and the error is cleared from the address bar. One click
  sends a fresh link.
- **One email per link** (owner, 2026-10-04: "every single link comes as a separate
  email… they were all stuck on top of each other"): the page asks for each link with
  the front door's address plus the time, `…/primelevel-masterboard/?sent=15:32`
  (allow-listed in Supabase → Redirect URLs as `…/primelevel-masterboard/?sent=*`), and
  the Magic Link template (VERSION 2026-10-04, text in the backup's
  `reference-files/email-templates/`) prints that time in the subject: "Your Masterboard
  sign-in link (15:32)". Every email has its own subject, so Gmail never stacks them and
  the newest is always on top; the email itself says "Only your newest link works."
  `door.js` clears `?sent=` (and the library's leftover `#`) from the address bar on
  arrival. Not used: the 6-digit code or any part of the link's hash in the subject
  (the code is the key itself; a few characters of the hash narrow the code down to ~15
  guesses).
- **The address is remembered** (owner, 2026-10-04: frictionless): what was typed when a
  link was sent stays on THIS browser only (`localStorage` `masterboard-last-email-v1`)
  until the owner is signed in, then it is forgotten. So the box always comes back ready.
- **Real failure** (network down, rate limit, Supabase down): the box comes back, with the
  address still typed in and one line under the button: "Sending failed. Try again."
  (owner, 2026-10-03: punchy, direct, one line). Rare; everything else stays
  "Done" (including an address that isn't allowed, so nobody learns which ones are).
- **Too soon** (owner, 2026-10-06): Supabase sends ONE sign-in email per minute to the same
  address and refuses earlier requests ("For security purposes, you can only request this
  after 42 seconds."). Then the line says "Wait a minute. Send again." instead (same length
  as "Sending failed. Try again.": one row at every width, guarded).

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

## Back arrow (every page but the Masterboard home) — LOCKED 2026-10-03

Owner: "Whatever is on the right-hand side needs to look the same as the left-hand
side… same colour, same font, same spacing, same size, everything the same, obviously
different wording." And: "the Masterboard is the hub, so the link always takes me to
the Masterboard."

| | Value (measured by pixels on every page at 1920 / 1440 / 1024 / 768 / 375 / 320) |
|---|---|
| Shape | a gold "←": a "<" head (45°) and a straight shaft, square ends |
| Length | **88px** = the letters "Sign out" (88.1) |
| Height | **16px** = Sign out's letters (top of the tallest letters → baseline), so both sit on the same line |
| Line thickness | **3.2px** = the bold letters' strokes (both measure 3.5px on screen with edge smoothing) |
| Colour | company gold `#B29B68` |
| Spacing BY EYE | top of the screen → top of the arrow **40px** = left edge → tip **40px** (phones ≤720px **20 / 20**): Sign out's mirror |
| Pop | 1.05 on hover, 0.97 on press, 0.15s (none when the device asks for less motion); gold focus ring |
| Leads to | ALWAYS the Masterboard (`FRONT_DOOR_URL`), never "back one page": the same place even from an email link, a bookmark or a new tab. The Masterboard is fetched ahead (`<link rel="prefetch">`) the moment the arrow appears, so the click is instant |
| Tap area | an invisible 14px margin around the drawing (116 × 44), so it is easy to hit on a phone |
| CSS that produces it | `position: fixed; top: 26px; left: 26px; padding: 14px` (26 + 14 = 40) · phones `top: 6px; left: 6px` (6 + 14 = 20); the drawing is 88 × 16 and its ink sits exactly on that box (the mitred tip and the arms' ends are placed for a 3.2px line: see `BACK_ARROW_SVG` in `door.js`) |

Shown ONLY to the signed-in owner, like Sign out, drawn by `door.js` on Investments,
Insider Edge, Inbox Report and Renewals. The Masterboard home tells the gate it is the
front door (`frontDoor: true`), so it has no arrow: it is where the arrow leads.

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
   inside values on a computer, a 375px phone and a 320px small phone (added 2026-10-02;
   320 added 2026-10-03): top and bottom 102 (phones 72, one card size with the line
   shown or not, each message on ONE line), sides 60 (phones 30),
   the 15 / 30 gaps, the 24 line pitch, 45px field and button, 540px width, every font and
   colour, the 1px navy borders and the 10px corners. Alarm by GitHub Issue + email. Not
   guarded: where the letters sit INSIDE the field and the button (16/17 and 16/16, set by
   eye on 2026-09-30); they follow from the guarded 45px height and fixed padding. A value
   that is not in the guard is not protected.
3. Trigger phrases: "create a sign-in page", "standard sign-in box" → apply ALL of this
   without asking the owner to restate it.
