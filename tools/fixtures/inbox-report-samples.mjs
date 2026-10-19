// MADE-UP Inbox Report samples for tools/inbox-spacing-check.mjs. The real
// reports hold real email content and are owner-only; this project is public,
// so the guard measures these instead. They copy the EXACT HTML shapes the
// daily inbox agent writes (prompt v9, Stage D): the "At a glance" summary as
// labelled lines, the one-row-per-email table under its "Email list" heading
// (a day with no table has no such heading), Overdue / Emails / Probably spam
// cards (badges, from line, "What it is", "How urgent? / Should you worry?", status
// lines, the original email in a white box, a folded draft reply, "Open the
// email"), and the Notebook list. Every name, address and figure is invented.
const LINK = (thread, from, t) => `https://mail.google.com/mail/u/0/?authuser=info%40primelevel.co.uk#search/in%3Aanywhere+from%3A${from}+after%3A${t - 1}+before%3A${t + 1}/${thread}`;

const card = ({ cls, urgency, worry, worryCls, cat, draft, from, gist, why, status = [], quote, reply, flags = [], link }) => `<li class="entry ${cls}"><p class="head"><span class="badge ${cls}">${urgency}</span> <span class="badge ${worryCls}">Worry: ${worry}</span> <span class="badge cat">${cat}</span> <span class="badge draft">${draft}</span></p><p class="from">${from}</p><p class="gist"><strong>What it is:</strong> ${gist}</p><p class="why">${why}</p>${status.map((s) => `<p>${s}</p>`).join('')}<blockquote>${quote}</blockquote>${reply ? `<details><summary>Read the draft reply</summary><blockquote>${reply}</blockquote>${flags.join('<br>')}</details>` : '<p>No reply needed — automatic notification from a no-reply address.</p>'}<p><a href="${link}">Open the email</a></p></li>`;

// The "At a glance" summary as prompt v9 writes it (19 Oct 2026): short
// labelled lines, one fact per line, no badges; extra facts on their own line.
const glance = ({ n, h, m, l, spam, drafts, filed, left, inUse, waiting, extra = '' }) => `<h3>At a glance</h3><p><strong>New emails:</strong> ${n}<br><strong>Urgency:</strong> ${h} High · ${m} Medium · ${l} Low<br><strong>Probably spam:</strong> ${spam}<br><strong>Drafts ready for you:</strong> ${drafts}<br><strong>Invoices:</strong> ${filed} filed · ${left} left for you to check<br><strong>Notebook:</strong> ${inUse} lessons in use · ${waiting} waiting for your approval${extra}</p>`;
const summary = glance({ n: 4, h: 1, m: 1, l: 1, spam: 1, drafts: 1, filed: 1, left: 0, inUse: 6, waiting: 1 });
const table = '<h3>Email list</h3><table class="scan"><thead><tr><th>Urgency</th><th>Worry</th><th>From — what it is</th><th>Draft</th></tr></thead><tbody>'
  + '<tr><td><span class="badge high">High</span></td><td><span class="badge worry-yes">Yes</span></td><td><strong>Sample Client Ltd</strong> — Complaint about a missed call back, wants a reply by Monday</td><td>Ready</td></tr>'
  + '<tr><td><span class="badge medium">Medium</span></td><td><span class="badge worry-watch">Watch</span></td><td><strong>New Supplier Co</strong> — First invoice from a new supplier</td><td>No reply needed</td></tr>'
  + '<tr><td><span class="badge low">Low</span></td><td><span class="badge worry-no">No</span></td><td><strong>Google Payments</strong> — Monthly Workspace invoice, filed</td><td>No reply needed</td></tr>'
  + '<tr><td><span class="badge spam">Probably spam</span></td><td><span class="badge worry-no">No</span></td><td><strong>Offers Weekly</strong> — Marketing newsletter</td><td>No reply needed</td></tr>'
  + '</tbody></table>';

const emails = '<h3>Emails</h3><ul>'
  + card({ cls: 'high', urgency: 'High', worry: 'Yes', worryCls: 'worry-yes', cat: 'Client', draft: 'Draft ready',
    from: '<strong>Alex Sample</strong> (alex@sample-client.example) · 14 Oct 2026, 09:14 · Complaint – still no reply after two emails',
    gist: 'A client says nobody called back as promised on 6 Oct and two emails went unanswered. They want an explanation and a call back by Monday 19 Oct 2026, and say they may take their business elsewhere.',
    why: '<strong>How urgent?</strong> High — the client wants a call back by 19 Oct 2026. <strong>Should you worry?</strong> Yes — worry: an unhappy client who may leave.',
    status: ['<span style="color:#E45858">Handle personally, review carefully</span>'],
    quote: "Hello,<br><br>I'm writing to make a formal complaint. On 6 Oct I was promised a call back about my account the same day. Nobody called. … (open the email to read the rest)",
    reply: 'Hi Alex,<br><br>Thank you for letting me know, and I am sorry nobody called you back. I will call you before Monday 19 Oct.<br><br>Best regards, Jiri Havelka, Founder, PrimeLevel.',
    flags: ['Needs your input'],
    link: LINK('1a00000000000001', 'alex%40sample-client.example', 1792000000) })
  + card({ cls: 'medium', urgency: 'Medium', worry: 'Watch', worryCls: 'worry-watch', cat: 'Supplier', draft: 'No reply needed',
    from: '<strong>New Supplier Co</strong> (accounts@new-supplier.example) · 14 Oct 2026, 10:02 · Invoice INV-0001',
    gist: 'A first invoice from a supplier that is not on the known-supplier list: £120.00, due on 30 Oct 2026. It was left in your inbox.',
    why: '<strong>How urgent?</strong> Medium — due on 30 Oct 2026. <strong>Should you worry?</strong> Keep an eye on it — a first-time sender asking for money.',
    status: ["New supplier invoice: check it's genuine before paying"],
    quote: 'Please find attached invoice INV-0001. Payment details: https://payments.new-supplier.example/invoices/INV-0001/pay-online-securely-with-card-or-bank-transfer-before-the-due-date',
    link: LINK('1a00000000000002', 'accounts%40new-supplier.example', 1792003700) })
  + card({ cls: 'low', urgency: 'Low', worry: 'No', worryCls: 'worry-no', cat: 'Supplier', draft: 'No reply needed',
    from: '<strong>Google Payments</strong> (payments-noreply@google.com) · 14 Oct 2026, 07:30 · Google Workspace: Your invoice is available',
    gist: 'The monthly Google Workspace invoice. Attachment included: invoice.pdf (application/pdf).',
    why: '<strong>How urgent?</strong> Low — already paid, no deadline. <strong>Should you worry?</strong> No — routine.',
    status: ['Filed to Expenses/Google (moved out of the inbox)'],
    quote: 'Your Google Workspace monthly invoice is available. Please find the PDF document attached at the bottom of this email.',
    link: LINK('1a00000000000003', 'payments-noreply%40google.com', 1791995400) })
  + '</ul>';

const spam = '<h3>Probably spam</h3><ul>'
  + card({ cls: 'spam', urgency: 'Probably spam', worry: 'No', worryCls: 'worry-no', cat: 'Unknown', draft: 'No reply needed',
    from: '<strong>Offers Weekly</strong> (news@offers.example) · 14 Oct 2026, 06:00 · This week only: 50% off',
    gist: 'A marketing newsletter.',
    why: '<strong>How urgent?</strong> Low — no deadline. <strong>Should you worry?</strong> No — routine.',
    quote: 'This week only: half price on everything in our autumn range. … (open the email to read the rest)',
    link: LINK('1a00000000000004', 'news%40offers.example', 1791986400) })
  + '</ul>';

const notebook = '<h3>Notebook</h3><ul><li>(self) For emails from accounts@new-supplier.example: leave invoices in the inbox until the owner adds the supplier to the known list.</li><li>(self) WAITING FOR APPROVAL: for marketing newsletters from news@offers.example, mark them probably spam without reading past the first paragraph. — Waiting for your approval</li></ul>';

export const fullReport = {
  id: 9101, created_at: '2026-10-14T07:10:00Z', run_date: '2026-10-14', status: 'success',
  title: 'Inbox Report — 14 Oct 2026', error_text: null,
  html_content: summary + table + emails + spam + notebook,
};
// The shape of the 17 Oct 2026 report: no new emails, one overdue email brought
// back, so the table holds only one short "High" badge (that report's table
// heading broke into "Urgenc / y").
export const overdueReport = {
  id: 9102, created_at: '2026-10-15T07:10:00Z', run_date: '2026-10-15', status: 'success',
  title: 'Inbox Report — 15 Oct 2026', error_text: null,
  html_content: glance({ n: 0, h: 0, m: 0, l: 0, spam: 0, drafts: 0, filed: 0, left: 0, inUse: 6, waiting: 0, extra: '<br><strong>Overdue:</strong> 1' }) + '<p>No new emails.</p>'
    + '<h3>Email list</h3><table class="scan"><thead><tr><th>Urgency</th><th>Worry</th><th>From — what it is</th><th>Draft</th></tr></thead><tbody><tr><td><span class="badge high">High</span></td><td><span class="badge worry-yes">Yes</span></td><td><strong>Sample Office Supplies Ltd</strong> — OVERDUE: unpaid invoice INV-0001 (£480.00), payment asked by 22 Oct 2026; still no reply from you on this thread, and the supplier is not on your known-suppliers list</td><td>Needs you</td></tr></tbody></table>'
    + '<h3>Overdue</h3><ul>'
    + card({ cls: 'high', urgency: 'High', worry: 'Yes', worryCls: 'worry-yes', cat: 'Client', draft: 'No reply needed',
      from: '<strong>Alex Sample</strong> (alex@sample-client.example) · 14 Oct 2026, 09:14 · Complaint – still no reply after two emails',
      gist: 'Still unanswered (2nd report): a client wants an explanation and a call back by Monday 19 Oct 2026.',
      why: '<strong>How urgent?</strong> High — a call back is asked for by 19 Oct 2026, 4 days from today. <strong>Should you worry?</strong> Yes — worry: an unhappy client who may leave.',
      quote: "Hello,<br><br>I'm writing to make a formal complaint. … (open the email to read the rest)",
      link: LINK('1a00000000000001', 'alex%40sample-client.example', 1792000000) })
    + '</ul>',
};
export const quietReport = {
  id: 9100, created_at: '2026-10-13T07:10:00Z', run_date: '2026-10-13', status: 'success',
  title: 'Inbox Report — 13 Oct 2026', error_text: null,
  html_content: glance({ n: 0, h: 0, m: 0, l: 0, spam: 0, drafts: 0, filed: 0, left: 0, inUse: 6, waiting: 0 }) + '<p>No new emails.</p>',
};
