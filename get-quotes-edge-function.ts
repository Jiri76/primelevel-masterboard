// supabase/functions/get-quotes/index.ts
//
// Read-only proxy in front of Finnhub's quote endpoint. Exists entirely so
// the Finnhub API key never has to sit in investments.html's own
// client-side JS (visible to anyone via "view source") -- the key lives
// only as a Supabase secret (FINNHUB_API_KEY), read server-side here via
// Deno.env.get, never sent to or readable by the browser.
//
// GET /functions/v1/get-quotes?symbols=AAPL,MSFT,WILD-USDT
// -> { "AAPL": { "price": 254.32, "change": 1.2 }, "MSFT": { "price": 421.1, "change": -3.4 }, "WILD-USDT": null }
// A symbol Finnhub can't price (bad ticker, or a genuine API error for
// that one symbol) comes back as `null` rather than failing the whole
// batch -- one bad holding shouldn't block the other real ones from
// refreshing.
//
// OWNER ONLY, 2026-10-13 (v7; owner: "lock it in, change nothing else"):
// step 6 of the Masterboard single sign-in. Before v7 anyone could ask
// for prices (no personal data, but a stranger could use up the free
// Finnhub allowance). Now every request must carry the signed-in OWNER's
// session: the page sends its public key (`apikey`) and the session's
// access token (`Authorization: Bearer ...`), and this function asks the
// database's own owner test, is_email_report_viewer() -- the same test
// the front door (door.js) uses -- with exactly those two headers. Only
// `true` gets prices. Anything else (no token, the public key alone, a
// signed-in stranger) gets 401 "Not allowed." before Finnhub is called
// at all; if the test itself can't run (time limit, database down) it is
// 503, and the page keeps its last known prices either way. verify_jwt
// stays OFF on purpose: the gateway check would only prove "some valid
// sign-in", this proves "the owner". Also v7: Access-Control-Max-Age, so
// the browser asks its CORS question once per two hours, not before every
// 60-second refresh (the sign-in headers make it ask). Everything else is
// v6 unchanged. v6's source is saved for a one-step undo:
// ClaudeCode-Backup/reference-files/get-quotes/index-v6-2026-10-01.ts.
//
// RETRIES + TIME LIMIT, 2026-10-01 (v5, v6): Finnhub's KuCoin prices are
// unreliable -- measured live: PAXG-USDT came back empty in 3 of 6 calls
// ten seconds apart, WILD-USDT in 1 of 6, for valid, listed pairs. Each
// missing price is now asked for up to ATTEMPTS times, RETRY_DELAY_MS
// apart, before it is reported as null (measured after v5 went live: gold
// missing 0 times in 10 calls). v6: each Finnhub call is abandoned after
// CALL_TIMEOUT_MS (one call hung for 37s live), so a hung call is retried
// instead of holding the whole answer up. A per-request
// FINNHUB_CALL_BUDGET caps the total Finnhub calls one request can make
// (retries included), so a list of wrong tickers can never burn through
// the free tier's 60-calls-a-minute limit. Same answer shape as v4, so
// the page needs no change to read it. (The page also keeps a holding's
// last good price when a refresh comes back empty -- see refreshPrices()
// in investments.html. v4's source is saved for a one-step undo:
// ClaudeCode-Backup/reference-files/get-quotes/index-v4-UNDO-2026-10-01.ts.)
//
// `change`, 2026-09-03: added for the portfolio summary bar's daily
// change figure. Finnhub's own /quote response already includes this
// (`d`, the day's $ change) on the exact same call already being made
// for `c` (price) -- no second request, no extra Finnhub-rate-limit
// cost. `change` is null whenever Finnhub doesn't report one (rare, but
// possible), independent of whether `price` itself resolved.
//
// Crypto, 2026-09-02: a ticker containing "-" (e.g. "WILD-USDT") is
// treated as a crypto pair and looked up on KuCoin specifically
// (`KUCOIN:WILD-USDT`), per explicit request -- the user trades on
// KuCoin, and KuCoin's own symbol format on Finnhub already IS
// "BASE-QUOTE" hyphenated, so the ticker you type is used as-is, just
// prefixed with the exchange. A plain ticker with no "-" (AAPL, MSFT)
// still goes through the original stock /quote lookup, completely
// unchanged.
//
// Real bug found and fixed the same day, before landing on this
// KuCoin-only design: a BARE crypto symbol with no exchange prefix
// (e.g. "BTC") is NOT rejected by Finnhub's stock /quote endpoint --
// it silently resolves to whatever unrelated real stock/ETF happens to
// share that ticker (confirmed live: bare "BTC" is the Grayscale
// Bitcoin Mini ETF, an entirely different security trading around $34,
// not the ~$77,000 cryptocurrency). That's a genuinely dangerous
// silent wrong-answer, not a missing-data case like an unmatched
// ticker returning null -- the whole reason crypto tickers require the
// explicit "-USDT" suffix here, so a stock lookup and a crypto lookup
// can never collide on the same bare symbol.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "7200", // v7: one CORS question per two hours, not per refresh
};

// Hard cap, independent of whatever the client sends -- keeps one
// request from ever burning through a meaningful slice of Finnhub's
// 60-calls-per-minute free-tier limit by itself. Comfortably above any
// real holdings list this page will ever have.
const MAX_SYMBOLS = 20;

// Retries and time limit (v5, v6; see the note at the top).
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;
const FINNHUB_CALL_BUDGET = 30; // per request, retries included
const CALL_TIMEOUT_MS = 3000; // per Finnhub call (v6); worst case ~3 x 3s + 2 x 0.4s
const OWNER_CHECK_TIMEOUT_MS = 3000; // v7: the owner test (one database call)

interface Quote {
  price: number;
  change: number | null;
}

// v7: is this request the signed-in owner? Asks the database's own test
// with the caller's own two headers (see the note at the top).
async function ownerCheck(req: Request): Promise<"owner" | "not-owner" | "error"> {
  const auth = req.headers.get("authorization") ?? "";
  const apikey = req.headers.get("apikey") ?? "";
  if (!auth.startsWith("Bearer ") || !apikey) return "not-owner";
  try {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/is_email_report_viewer`, {
      method: "POST",
      headers: { apikey, Authorization: auth, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(OWNER_CHECK_TIMEOUT_MS),
    });
    if (res.status === 401 || res.status === 403) return "not-owner"; // no valid sign-in, or not allowed to ask
    if (!res.ok) return "error";
    return (await res.json()) === true ? "owner" : "not-owner";
  } catch {
    return "error"; // time limit or network: the page keeps its last prices
  }
}

async function fetchFinnhubQuote(finnhubSymbol: string, apiKey: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(CALL_TIMEOUT_MS) } // a hung call throws -> caught below -> null -> retried
    );
    if (!res.ok) return null;
    const data = await res.json();
    // `c` is current price. Finnhub returns `c: 0` (not an HTTP error)
    // for a symbol it doesn't recognize -- treated as "no real price
    // available" here, same as any other null.
    if (typeof data.c !== "number" || data.c <= 0) return null;
    const change = typeof data.d === "number" ? data.d : null;
    return { price: data.c, change };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // v7: owner only, before anything else is read or Finnhub is called.
  const who = await ownerCheck(req);
  if (who !== "owner") {
    return new Response(
      JSON.stringify({ error: who === "error" ? "Could not check access right now." : "Not allowed." }),
      { status: who === "error" ? 503 : 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("symbols");
  if (!raw) {
    return new Response(
      JSON.stringify({ error: "Missing required 'symbols' query parameter." }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const symbols = [...new Set(
    raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  )].slice(0, MAX_SYMBOLS);

  if (!symbols.length) {
    return new Response(
      JSON.stringify({ error: "No valid symbols provided." }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const apiKey = Deno.env.get("FINNHUB_API_KEY");
  if (!apiKey) {
    // A genuinely missing secret (not yet set in the Dashboard, or a
    // typo'd name) should read as a clear server-config error, not a
    // confusing empty/null price for every holding.
    return new Response(
      JSON.stringify({ error: "Server is not configured with a Finnhub API key." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Shared by every symbol in this request (JavaScript runs one step at a
  // time, so the count can't be raced).
  let callsLeft = FINNHUB_CALL_BUDGET;
  async function quoteWithRetries(finnhubSymbol: string): Promise<Quote | null> {
    for (let attempt = 1; attempt <= ATTEMPTS && callsLeft > 0; attempt++) {
      callsLeft--;
      const quote = await fetchFinnhubQuote(finnhubSymbol, apiKey!);
      if (quote) return quote;
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
    return null;
  }

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const finnhubSymbol = symbol.includes("-") ? `KUCOIN:${symbol}` : symbol;
      const quote = await quoteWithRetries(finnhubSymbol);
      return [symbol, quote] as const;
    })
  );

  const quotes: Record<string, Quote | null> = {};
  for (const [symbol, quote] of results) quotes[symbol] = quote;

  return new Response(JSON.stringify(quotes), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
