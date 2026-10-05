// MADE-UP Insider Edge reports for the guards (2026-10-05).
//
// Since 2026-10-05 the real reports are OWNER-ONLY (locked in the database),
// and this project is PUBLIC, so the guards never read or print a real
// report. These two samples copy the exact HTML shape a real report has
// (prompt v5, plus the three check lines the database adds when a report is
// saved, then the Notebook line), with fictional companies and people:
//   withPicks  a normal week: entries in every kind of section, two Verdicts
//   noPicks    a week where nothing passed ("None." lines, plain Verdict)
// Change these only when the real report's shape changes.

const checks = (tickers) => `
<p><em>EDGAR-verified: ${tickers ? `all ${tickers} tickers have a real, recorded SEC accession number (checked automatically at save time, not self-reported by Cowork).` : 'no tickers in this report, nothing to verify.'}&nbsp;<strong>✓</strong></em></p>
<p><em>Repeat-count-verified: no repeat tickers in this report, nothing to cross-check.&nbsp;<strong>✓</strong></em></p>
<p><em>Both checks run automatically at save time, independent of Cowork; historical filing dates behind the counts are still Cowork's own responsibility to verify against EDGAR.</em></p>`;

export const withPicks = {
  id: 9001,
  title: 'Insider Edge — Week of 12 Oct 2026',
  created_at: '2026-10-12T05:21:00Z',
  html_content: `<h3>New Discoveries — 2</h3>
<ul>
<li><strong>XMPA</strong> — Sample Company A Inc. — Industrials — Market Cap $412.30M.<br>Three insiders bought on the open market between 2 and 6 Oct 2026: CEO Jane Sample (20,000 sh at $8.10-$8.25, $163,500), CFO John Example (10,000 sh at $8.20, $82,000) and Director Alex Placeholder (8,000 sh at $8.15, $65,200), combined insider buying of about $310,700 (price range $8.10-$8.25/sh).</li>
<li><strong>XMPB</strong> — Sample Company B Corp. — Healthcare — Market Cap $188.75M.<br>Two insiders bought on the open market on 1 Oct 2026: Chair Sam Specimen (50,000 sh at $3.40, $170,000) and President Chris Model (30,000 sh at $3.38, $101,400), combined insider buying of about $271,400 (price range $3.38-$3.40/sh).</li>
</ul>
<h3>Institutional Buying — 1</h3>
<ul>
<li><strong>XMPA</strong> — Sample Company A Inc. — Industrials — Market Cap $412.30M.<br>Example Capital LLC increased its position by 18% (from 1,200,000 to 1,416,000 shares) in Q2 2026; price on the incremental shares not disclosed by the 13F filing. Total institutional ownership is now 64.2% (source: sample data).</li>
</ul>
<h3>Fundamentals</h3>
<ul>
<li><strong>XMPA</strong> — Sample Company A Inc. — Industrials — Market Cap $412.30M.<br>Currently profitable: net income of $6.2M in the most recent quarter, also positive on an adjusted basis. Cash $58.4M against total debt of $21.0M; free cash flow positive, so runway is not a concern.</li>
<li><strong>XMPB</strong> — Sample Company B Corp. — Healthcare — Market Cap $188.75M.<br>Not currently profitable: net loss of $4.1M in the most recent quarter, and none of the last four quarters were profitable; company guidance targets break-even in 2027. Cash $96.0M, no debt, about 9 quarters of runway at the current burn. Note: $14M rights offering Feb 2026.</li>
</ul>
<h3>Watch Line — 0</h3>
<ul>
<li>None. No tickers have yet accumulated six consecutive stale weeks.</li>
</ul>
<h3>Repeat Alerts — 0</h3>
<ul>
<li>None. No previously tracked ticker showed new open-market buying this week.</li>
</ul>
<h3>Verdict</h3>
<p><strong class="verdict-ticker">XMPA</strong> — <span class="verdict-stars">★★★</span><br>
Three insiders including the CEO and CFO bought in the same week while an institution added to its stake, and the business is profitable with more cash than debt. This is the pattern the report exists to find; the main risk is that the buying is modest next to the company's size.</p>
<p><strong class="verdict-ticker">XMPB</strong> — <span class="verdict-stars">★★☆</span><br>
The Chair and the President bought together, and the balance sheet carries no debt with over two years of runway. The company is not yet profitable, so the signal rests on management's confidence in reaching break-even on schedule.</p>${checks(2)}
<p><em>Notebook: 14 lessons in use, 0 waiting for your approval. Screened: 24 companies; 2 passed every test; 1 could not be fully checked. New lessons this run: none. Waiting for your approval: none.</em></p>
<!--insider-edge-verified-->
`,
};

export const noPicks = {
  id: 9000,
  title: 'Insider Edge — Week of 5 Oct 2026',
  created_at: '2026-10-05T05:21:00Z',
  html_content: `<h3>New Discoveries — 0</h3>
<ul>
<li>None. No company passed every test this week.</li>
</ul>
<h3>Institutional Buying — 0</h3>
<ul>
<li>None. No surviving ticker showed institutional accumulation this week.</li>
</ul>
<h3>Fundamentals</h3>
<ul>
<li>None. No New Discoveries this week to research.</li>
</ul>
<h3>Watch Line — 0</h3>
<ul>
<li>None. No tickers have yet accumulated six consecutive stale weeks.</li>
</ul>
<h3>Repeat Alerts — 0</h3>
<ul>
<li>None. No previously tracked ticker showed new open-market buying this week.</li>
</ul>
<h3>Verdict</h3>
<p>No candidates to assess this week.</p>${checks(0)}
<p><em>Notebook: 14 lessons in use, 0 waiting for your approval. Screened: 24 companies; 0 passed every test; 2 could not be fully checked. New lessons this run: none. Waiting for your approval: none.</em></p>
<!--insider-edge-verified-->
`,
};
