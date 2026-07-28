// Records the day's top squeeze signals into signal_snapshots so a verifiable
// track record can accrue. Meant to run on a daily schedule. STRICT guard: the
// track record is the product's moat, so an unauthenticated caller must never be
// able to pollute it — requires x-cron-secret to match the CRON_SECRET env.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { scoreCrossSection, signalFor, type FactorSpec } from "../_shared/quant.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PremiumIndex { symbol: string; lastFundingRate: string }
interface Ticker24h { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }

const FACTORS: FactorSpec[] = [
  { key: "funding", weight: 1.4, value: (t) => -t.funding },
  { key: "momentum", weight: 1.0, value: (t) => t.change24h },
  { key: "liquidity", weight: 0.5, value: (t) => Math.log10(Math.max(1, t.volume24h)) },
];

const MIN_VOLUME = 10_000_000;
const TOP_N = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Strict cron guard — no secret set or mismatch → denied.
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected || req.headers.get("x-cron-secret") !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const [pRes, tRes] = await Promise.all([
      fetch("https://fapi.binance.com/fapi/v1/premiumIndex"),
      fetch("https://fapi.binance.com/fapi/v1/ticker/24hr"),
    ]);
    if (!pRes.ok || !tRes.ok) throw new Error("Binance upstream error");

    const premium = (await pRes.json()) as PremiumIndex[];
    const tickers = (await tRes.json()) as Ticker24h[];
    const funding = new Map(premium.map((p) => [p.symbol, p]));

    const universe = tickers
      .filter((t) => t.symbol.endsWith("USDT") && funding.has(t.symbol))
      .map((t) => ({
        symbol: t.symbol.replace(/USDT$/, ""),
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        funding: parseFloat(funding.get(t.symbol)!.lastFundingRate),
        volume24h: parseFloat(t.quoteVolume),
      }))
      .filter((t) => t.volume24h >= MIN_VOLUME && t.funding < 0);

    const scored = scoreCrossSection(universe as unknown as Record<string, number>[], FACTORS);
    const rows = universe
      .map((t, i) => ({ t, s: scored[i] }))
      .sort((a, b) => b.s.score - a.s.score)
      .slice(0, TOP_N)
      .map(({ t, s }) => ({
        symbol: t.symbol,
        asset_type: "crypto",
        timeframe: "1d",
        signal: signalFor(s.score),
        score: s.score,
        confidence: s.confidence,
        price_at_signal: t.price,
      }));

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await supabase.from("signal_snapshots").insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, recorded: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
