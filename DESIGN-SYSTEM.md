# PrimeLevel design system — the template for everything we build

Owner, 2026-10-02: "Whatever we design should be locked. If you design a button, all the
buttons for the same use case must be the same… so if I say 'create this button', you know
the specifications and implement it automatically, without me telling you every time. Every
single item, a button, a box, an opening page, must follow the same principles: consistency."

**How to use this file.** Every kind of thing on the Masterboard and its pages has ONE design,
listed here. Building something new means picking the matching item and copying it exactly.
If nothing fits, the new item is designed with the owner, then ADDED HERE (and to a guard)
before it is used anywhere. Never invent a variant of an existing item. When a page drifts,
fix the page; never the standard. Detailed standards for some items live in their own files
(linked); this file is the catalogue that points to all of them.

## 1. Foundations

| | Locked value |
|---|---|
| Font | Montserrat, Regular 400 and Bold 700 only; every font list reads `'Montserrat', 'Montserrat Fallback', sans-serif`. "Montserrat Fallback" (defined once in `door.js`) is Arial resized to Montserrat's width and line metrics, so nothing jumps when Montserrat finishes downloading (owner, 2026-10-04: seamless; measured: stand-in vs final ≤ 0.6px on every page at six widths, was up to 30px) |
| Colours | navy `#1E2633` (page background, text on light surfaces) · white `#F9F9FA` · company gold `#B29B68` (titles, Sign out, glows; never on buttons) · card `#2A3441` · border `#3A4453` · soft grey-blue `#8A93A3` (messages, quiet text) · green `#4CAF7D` · orange `#D9A441` · red `#E45858` (errors) · light card `#E9E9EB` (the sign-in box only) |
| Spacing, vertical | **100px by eye**: page top → title letters, title letters → the first thing under it, on EVERY page at EVERY width (phones too) |
| Spacing, sideways | page gutter 20px; distances to the narrow SIDE edges halve on phones (sign-in box sides 60 → 30, Sign out corner 40 → 20) |
| "By eye" | letters for text (baseline of the letters above → top of the tallest letters below), EDGES for boxes; never a glow or a shadow |
| Inside a card | (owner, 2026-10-03) ONE card size: a slot for a message line is always kept, so a card never grows or shrinks; its top and bottom are the same number (the sign-in box: 102, phones 72); every separate line is its own group, 30 from its neighbour (15 only within a group); every message fits one line at EVERY width (320px included), so it never contains text of varying length. |
| Dates | three-letter months: "28 Sep 2026" (spelled out in code, never the browser's "Sept") |
| Every device | 320, 375, 768, 1024, 1440, 1920px: nothing cut off, nothing scrolls sideways |
| Seamless | instant feedback; keep the last good value instead of blanking; time limits on outside calls; show at once what is already known |

## 2. The catalogue

| Item | Locked design | Code | Guard |
|---|---|---|---|
| **Page title** | Montserrat 50px bold gold, centred (the Masterboard home 60px); `line-height: 65px`; phones 44px, small phones 38px; 100 / 100 by eye | each page's `h1` | Opening page guard |
| **Opening page** (a screen with only a title and one message) | title + ONE message line: 20px regular soft grey-blue, centred, 100 by eye under the title; one style for every message | [OPENING-PAGE-STANDARD.md](OPENING-PAGE-STANDARD.md) | Opening page guard |
| **Sign-in box** | the LOCKED box: card `#E9E9EB`, ONE size: top = bottom 102 (phones 72) with the message line's slot always kept, sides 60 (phones 30), gaps 15 / 30, 24 line pitch, 45px white field and button with 1px navy border, 10px corners; click → "Done" instantly; focus navy | [SIGNIN-BOX-STANDARD.md](SIGNIN-BOX-STANDARD.md), `docs/signin-box-reference.html` | Opening page guard (59 checks) |
| **Card message line** (e.g. "Access denied.", "Sending failed. Try again.", "Link expired. Send again.") | ONE line under a card's last button, in a slot the card ALWAYS keeps (so the card never changes size): Montserrat 15px regular navy, 24px line; button edge → its letters 30 by eye, its baseline → card bottom = the card's edge (60, phones 30); the card's top then equals its bottom (30 + 12 + 60 = 102; phones 72). Wording: punchy, direct, no fluff; must fit ONE line in the narrowest card (220px on a 320px phone); never names anything whose length varies (an address goes in the field instead) | `.signin .message` in the sign-in box (copy it for any card) | Opening page guard |
| **Front door** | the ONE way in: only the Masterboard home has a sign-in box; every private page loads `door.js` first and sends anyone but the owner there; an account without access is signed out automatically and gets the box back with one line under the button | `door.js` | Opening page guard; live stranger check |
| **Sign out** | "Sign out", Montserrat 20px bold gold, no underline; top-right corner 40 / 40 by eye (phones 20 / 20); pops to 1.05 on hover, 0.97 on press; shown to the signed-in owner ONLY; signs out everywhere and wipes everything private | drawn by `door.js` (never written into a page) | Opening page guard |
| **Back arrow** (owner, 2026-10-03: "whatever is on the right-hand side needs to look the same as the left-hand side") | Sign out's MIRROR in the top-LEFT corner, identical in everything but the words: a gold "←" (a "<" head and a shaft), as long as the letters "Sign out" (88px), as tall as their letters (16px: it sits exactly on Sign out's line, top of the letters → baseline), lines 3.2px like the bold letters; 40 / 40 by eye (phones 20 / 20); pops 1.05 on hover, 0.97 on press, 0.15s; gold focus ring; invisible 14px tap margin (tap area 116 × 44). ALWAYS leads to the Masterboard, the hub (never "back one page"); the Masterboard is fetched ahead the moment the arrow appears, so the click is instant. On every page EXCEPT the Masterboard home; owner only, like Sign out | drawn by `door.js` (`addBack`; the home passes `frontDoor: true` to `gate`) | Opening page guard (position, line, length, colour, thickness, pop, link) |
| **Tile button** (Masterboard tiles, Insider Edge and Inbox Report dates) | 200 × 50px, card `#2A3441`, 0.5px border `#3A4453`, 10px corners; Montserrat 18px bold white (dates 15px on phones, home tiles 16px on small phones); text centred by eye on the capitals (`padding-top: 1px` on computers); hover: white border + scale 1.025; pinned 40px from the left on wide screens, a centred row of two per line below; "new" = gold glow `0 0 10px 2px rgba(178,155,104,.55)` | `.tile` / `.report-tile` in each page | Opening page guard (layout), tile-centring check |
| **Report card** | white card under a `#2A3441` header band; title 35px, date 15px; spacing 100 / 30 / 24 / 15 by eye | `insider-edge.html`, `inbox-report.html` | Insider Edge layout guard (39 checks) |
| **Buttons on a light card** (sign-in) | white, 1px navy border, navy 16px bold text; hover: navy fill + white text + scale 1.02; press 0.97 | sign-in box | Opening page guard |
| **Motion** | gentle pops only: tiles 1.025, buttons on a light card 1.02, small round buttons 1.03, a single word (Sign out) and the back arrow 1.05; presses dip to 0.97; transitions 0.1–0.15s; none when the device asks for less motion | each item | per item |
| **Focus** (keyboard / typing) | navy on light surfaces (the field's border thickens 1 → 2px; buttons get a 2px navy ring); gold on the navy page | each item | Opening page guard (sign-in field) |
| **Renewals controls** (the "+" circle, item rows, Save / Delete) and **Investments cards** | locked in their pages' CSS comments (owner decisions 2026-08/09). **An open card / item** (owner, 2026-10-05, final: "carry on with your recommendation"; first he chose Save/Delete only, then chose consistency with the "+" panel): Save saves, Delete deletes; a press anywhere OUTSIDE it, or Escape, closes it WITHOUT saving (the unsaved typing dropped); pressing another card opens that one and closes this one. Identical on Investments and Renewals, and the same rule as the "+" panel. The check runs in the capture phase, before the card's own opener | `primelevel-renewals/index.html`, `investments.html` | spacing checks; to be moved into the shared stylesheet |

## 3. Building a new private page (checklist)

1. `<script src="door.js"></script>` in the `<head>` (Renewals: `/primelevel-masterboard/door.js`),
   with the preconnect + modulepreload lines; the library from
   `https://esm.sh/@supabase/supabase-js@2.117.2?bundle`.
2. Everything private inside `class="pl-private"`; private loading through
   `PrimeLevelDoor.whenOwner(...)`; then `PrimeLevelDoor.gate(supabase)`. Any private cache
   joins `PRIVATE_KEYS` in `door.js`.
3. Title, opening page, tiles, cards, buttons: copy the items above exactly. Every font
   list: `'Montserrat', 'Montserrat Fallback', sans-serif`.
4. Measure: 100 by eye at all six widths, nothing cut off, nothing sideways, centred text.
5. Add the page to the guards in the same commit. A page that is not guarded is not protected.

## 4. Next step towards "one code"

`door.js` already makes the front door and Sign out exist ONCE. The shared look (tokens,
title, tiles, opening message, buttons) is still copied into each page's own CSS, so it can
drift. Planned: one shared stylesheet, loaded by every page like `door.js`, so each item
above exists once in code too.
