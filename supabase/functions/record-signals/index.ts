// Records the day's top squeeze signals (crypto + stocks) into signal_snapshots,
// now including the per-factor z-scores so the model can be re-fit on realized
// outcomes. Daily schedule. Strict cron guard — the track record is the moat.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { scoreCrossSection, signalFor } from "../_shared/quant.ts";
import { isAuthorizedCron } from "../_shared/cron-guard.ts";
import {
  buildCryptoItems, buildStockItems, withWeights, CRYPTO_FACTORS, STOCK_FACTORS, type ScanRow,
} from "../_shared/scan.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOP_N = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  if (!(await isAuthorizedCron(req, supabase))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {


    const [cryptoRows, stockRows] = await Promise.all([
      buildCryptoItems(),
      buildStockItems(supabase),
    ]);
    const [cryptoW, stockW] = await Promise.all([
      withWeights(supabase, "crypto", CRYPTO_FACTORS),
      withWeights(supabase, "stock", STOCK_FACTORS),
    ]);

    const toRows = (rows: ScanRow[], weights: typeof CRYPTO_FACTORS, assetType: string) => {
      if (!rows.length) return [];
      const scored = scoreCrossSection(rows.map((r) => r.vals), weights);
      return rows
        .map((r, i) => ({ r, s: scored[i] }))
        .sort((a, b) => b.s.score - a.s.score)
        .slice(0, TOP_N)
        .map(({ r, s }) => ({
          symbol: r.symbol,
          asset_type: assetType,
          timeframe: "1d",
          signal: signalFor(s.score),
          score: s.score,
          confidence: s.confidence,
          price_at_signal: r.price,
          factors: s.z,
        }));
    };

    const rows = [
      ...toRows(cryptoRows, cryptoW, "crypto"),
      ...toRows(stockRows, stockW, "stock"),
    ];

    if (rows.length) {
      const { error } = await supabase.from("signal_snapshots").insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, recorded: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
