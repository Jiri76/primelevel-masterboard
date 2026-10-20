# Report card standard (LOCKED)

The one template every PrimeLevel report page uses: **Insider Edge** (`insider-edge.html`)
and the **Inbox Report** (`inbox-report.html`), and any report page added later.

Owner, 2026-10-15: "the Inbox Report written exactly in the same way as Insider Edge…
the same colours, the same padding, the same size of the letters, fonts, everything…
I just want to create something like a template." Insider Edge's card was locked on
2026-09-21 (details: `INSIDER-EDGE-SPACING-SPEC.md`); the phone rhythm on 2026-10-05.

## How it is measured: BY EYE

Every gap is what the reader sees: from the bottom (baseline) of the letters above to
the top of the tallest letters below, or to the edge of a box (the band, an email card,
a badge) or of a heading's line. The numbers in the CSS are only the settings that
produce these gaps, so they may differ by a pixel or two between pages: different
words have different tallest letters (at 35px the dot of the i in "Insider" is 28px
tall, the b in "Inbox" 26px). The same reason the page titles use 90 on Insider Edge
and 87 on the Inbox Report: both land exactly 100 by eye.

## Gaps

| Gap (by eye) | Computer | Phone (≤720px) |
|---|---|---|
| Card top → title letters (in the dark band) | 100 | 70 |
| Title → date line | 15 (title baseline → date letters) | 15 |
| Date line → band bottom | 100 | 70 |
| Band bottom → first heading | 100 | 70 |
| Heading letters → its line | 15 | 15 |
| Heading line → what comes next | 100 | 70 |
| Last line of a section → next heading | 100 | 70 |
| Last line → card bottom | 100 | 70 |
| Between items (paragraphs, entries, email cards, the parts of an email card) | 30 | 30 |
| Between lines of a paragraph | 24 | 24 |

The page around the card keeps its own 100s (`OPENING-PAGE-STANDARD.md`).

## Fonts (Montserrat)

| Text | Size | Weight |
|---|---|---|
| Page title | 50 (phones 44, small phones 38) | bold |
| Title in the dark band | 35 (phones 26) | bold |
| Date line | 15 | bold |
| Section headings | 25 | bold |
| All report text | 15 | regular (labels bold) |
| Insider Edge tickers | 20 | bold |
| Inbox Report badges | 13 | bold |

## Colours

| Part | Colour |
|---|---|
| Page | navy `#1E2633` |
| Report paper | company white `#F9F9FA` |
| Dark band | `#2A3441` |
| Band title, date line | gold `#B29B68` (date line at 60%) |
| Report text, headings, heading lines (2px) | navy `#1E2633` (Insider Edge's Verdict heading: gold) |

## The banner (dark band)

The agent's report title, then the day the report was made: **"14 Oct 2026"** (three-letter
month, no time). The same on both pages.

## Inbox Report's own parts (inside the same card)

- **Email cards:** the sign-in box's white `#E9E9EB` (owner, 2026-10-15: "the same shade of
  white we use in the sign-in box"), 1px `#DFE3EA` border, 6px left stripe in the urgency
  colour, 10px corners; 30 by eye from the card's edge to its first and last line and
  between its parts; 30 between cards.
- **Badges:** 13px bold. ONE red on the report, `#C62828` (owner, 2026-10-20): the High
  badge (company-white text), the High card's stripe, "Worry: Yes" (text and outline) and the
  agent's red warnings ("Handle personally, review carefully", "Possible fake invoice…"; the
  agent writes `#E45858`, the page shows `#C62828`). ONE white, company white `#F9F9FA`, in
  every badge (the High badge's text, the Worry and Draft badges' fill). ONE orange,
  `#BC4C00` (owner, 2026-10-20: "abandon the gold in those badge colours"): the Medium
  badge (company-white text), the Medium card's stripe and "Worry: Watch" (text and
  outline). ONE green, `#188038` (owner, 2026-10-20, "the traffic system"): the Low badge
  (company-white text), the Low card's stripe and "Worry: No" (text and outline). So the
  report's colours are TRAFFIC LIGHTS: red = High and "Worry: Yes", orange = Medium and
  "Worry: Watch", green = Low and "Worry: No"; and ONE solid grey, `#616161`, for "Probably
  spam" (badge with company-white text, and its card's stripe; the card is never faded,
  owner 2026-10-20: "one solid colour, no fading"), the switched-off light. Gold is
  branding only (titles, the band's title and date), never a badge or stripe. The Who
  badge (Client, Supplier, Personal, Unknown) and the Draft badge ("Draft ready", "No
  reply needed") use ONLY company navy `#1E2633` and company white (owner, 2026-10-20):
  Who = navy fill, white words; Draft = white fill, navy words and outline. An email card's urgency badge says what it is, like the
  "Worry: Yes" beside it: **"Urgency: High"** on every screen (owner, 2026-10-19: "let's
  be consistent"); the page adds the word, the agent writes only "High". "Probably spam"
  names itself.
- **"At a glance"** (prompt v9, 2026-10-19): one paragraph of short labelled lines, one
  fact per line, no badges ("New emails: 5", "Urgency: 3 High · 1 Medium · 1 Low", …):
  24 between lines, 100 above and below (70 on phones), like any paragraph.
- **The white box** (the original email, and the draft reply inside "Read the draft reply"):
  company white `#F9F9FA`, so it stands out from the grey card (owner, 2026-10-16; it was
  navy at 6%), 12 / 18px inside, so its text sits 18 from both sides. No line on its left:
  the white alone marks it (owner, 2026-10-20: "the white box tells the story on its own";
  the 3px gold line it had until then looked like a Medium card's gold urgency stripe).
- **The table** (one row per email): under its own section heading **"Email list"**
  (owner, 2026-10-17; the agent writes it from prompt v8, 18 Oct 2026). It is an ordinary
  heading, so the gaps above apply unchanged: 100 above it, 15 to its line, 100 below
  (70 / 15 / 70 on phones). No table, no "Email list" heading. 15px text; the Draft column
  on one line on wider screens; a thin 1px company-navy line under every row, half the
  2px navy line under the column titles (owner, 2026-10-20: no grey lines); stacked rows
  on phones (their column titles hidden, so
  the heading is what names the list there). On phones the two badges carry their
  column's title, as the Draft line does ("Draft: Ready"): **"Urgency: High"** and
  **"Worry: Yes"** (owner, 2026-10-18: "if something appears on the computer, it should
  also appear on the phone"); "Probably spam" names itself. They share one line when it
  is wide enough; a pair too long for a narrow phone's line (e.g. "Urgency: Medium" +
  "Worry: Watch" at 375 or less) stacks, Worry under Urgency (owner's choice).
  Computers are unchanged (the titles row names them).

## Also on every report page

- A word too long for its line (a web address) breaks onto the next line, never cut off.
- A click (or a finger tap) outside the card closes it; inside does nothing.

## Guards

Each page is measured on every change, by eye, on a computer (1920) and an iPhone (375),
with made-up sample reports (the real ones are owner-only and these projects are public):

- Insider Edge: `tools/spacing-check.mjs`, workflow "Insider Edge layout guard".
- Inbox Report: `tools/inbox-spacing-check.mjs`, workflow "Inbox Report layout guard"
  (gaps, fonts, colours, the date line, every line inside the text column).

Change nothing here without the owner's explicit request. If a guard fails, fix the page,
never this standard.
