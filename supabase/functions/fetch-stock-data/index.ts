import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* =========================
   Validation
========================= */

const requestSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[\^]?[A-Za-z0-9.\-]+(=F|USDT)?$/, "Invalid symbol"),
  interval: z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"]),
});

/* =========================
   Interval mapping
========================= */

const intervalConfig: Record<string, { range: string; yahooInterval: string; ms: number; aggregate?: number }> = {
  "1m": { range: "1d", yahooInterval: "1m", ms: 60_000 },
  "5m": { range: "5d", yahooInterval: "5m", ms: 5 * 60_000 },
  "15m": { range: "5d", yahooInterval: "15m", ms: 15 * 60_000 },
  "30m": { range: "1mo", yahooInterval: "30m", ms: 30 * 60_000 },
  "1h": { range: "1mo", yahooInterval: "1h", ms: 60 * 60_000 },
  "4h": { range: "3mo", yahooInterval: "1h", ms: 4 * 60 * 60_000, aggregate: 4 },
  "1d": { range: "2y", yahooInterval: "1d", ms: 24 * 60 * 60_000 },
  "1w": { range: "5y", yahooInterval: "1wk", ms: 7 * 24 * 60 * 60_000 },
  "1M": { range: "10y", yahooInterval: "1mo", ms: 30 * 24 * 60 * 60_000 },
};

/* =========================
   Helpers
========================= */

function aggregateCandles(candles: any[], size: number, intervalMs: number) {
  const aggregated = [];

  for (let i = 0; i < candles.length; i += size) {
    const slice = candles.slice(i, i + size);
    if (slice.length < size) continue;

    aggregated.push({
      openTime: slice[0].openTime,
      open: slice[0].open,
      high: Math.max(...slice.map((c) => c.high)),
      low: Math.min(...slice.map((c) => c.low)),
      close: slice[slice.length - 1].close,
      volume: slice.reduce((s, c) => s + c.volume, 0),
      closeTime: slice[0].openTime + intervalMs,
    });
  }

  return aggregated;
}

/* =========================
   Server
========================= */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { symbol, interval } = parsed.data;
    const config = intervalConfig[interval];

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?range=${config.range}&interval=${config.yahooInterval}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    /* =========================
       Yahoo error → graceful skip
    ========================= */

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          symbol,
          interval,
          source: "yahoo",
          candles: [],
          skipped: true,
          reason: "symbol_not_supported",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
          },
        },
      );
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
      return new Response(
        JSON.stringify({
          symbol,
          interval,
          source: "yahoo",
          candles: [],
          skipped: true,
          reason: "no_price_data",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { timestamp } = result;
    const quote = result.indicators.quote[0];

    let candles = timestamp
      .map((t: number, i: number) => {
        const o = quote.open[i];
        const h = quote.high[i];
        const l = quote.low[i];
        const c = quote.close[i];
        const v = quote.volume[i];

        if ([o, h, l, c].some((x) => x == null)) return null;

        return {
          openTime: t * 1000,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v ?? 0,
          closeTime: t * 1000 + config.ms,
        };
      })
      .filter(Boolean);

    if (config.aggregate) {
      candles = aggregateCandles(candles, config.aggregate, config.ms);
    }

    return new Response(
      JSON.stringify({
        symbol,
        interval,
        source: "yahoo",
        candles,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
