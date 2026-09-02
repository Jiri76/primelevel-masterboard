// supabase/functions/get-quotes/index.ts
//
// Public, read-only proxy in front of Finnhub's quote endpoint. Exists
// entirely so the Finnhub API key never has to sit in investments.html's
// own client-side JS (visible to anyone via "view source") -- the key
// lives only as a Supabase secret (FINNHUB_API_KEY), read server-side
// here via Deno.env.get, never sent to or readable by the browser.
//
// GET /functions/v1/get-quotes?symbols=AAPL,MSFT,WILD-USDT
// -> { "AAPL": { "price": 254.32, "change": 1.2 }, "MSFT": { "price": 421.1, "change": -3.4 }, "WILD-USDT": null }
// A symbol Finnhub can't price (bad ticker, or a genuine API error for
// that one symbol) comes back as `null` rather than failing the whole
// batch -- one bad holding shouldn't block the other real ones from
// refreshing.
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
//
// verify_jwt is off (see deploy call) -- this page has no sign-in at
// all (confirmed: investments.html never calls supabase.auth), so
// there's no user JWT to check. The function itself has no side
// effects (no writes, no PII) and Finnhub's own free-tier key is the
// real rate-limit boundary, so leaving this open is a deliberate,
// low-risk choice, not an oversight.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Hard cap, independent of whatever the client sends -- keeps one
// request from ever burning through a meaningful slice of Finnhub's
// 60-calls-per-minute free-tier limit by itself. Comfortably above any
// real holdings list this page will ever have.
const MAX_SYMBOLS = 20;

interface Quote {
  price: number;
  change: number | null;
}

async function fetchFinnhubQuote(finnhubSymbol: string, apiKey: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${apiKey}`
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

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const finnhubSymbol = symbol.includes("-") ? `KUCOIN:${symbol}` : symbol;
      const quote = await fetchFinnhubQuote(finnhubSymbol, apiKey);
      return [symbol, quote] as const;
    })
  );

  const quotes: Record<string, Quote | null> = {};
  for (const [symbol, quote] of results) quotes[symbol] = quote;

  return new Response(JSON.stringify(quotes), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
