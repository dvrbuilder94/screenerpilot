// Cron-driven companion to squeeze-radar. squeeze-radar itself is stateless
// (rescans live on every call, no persistence), so this function calls it,
// diffs the resulting scores against the last-seen score per ticker, and
// writes a market_alerts row whenever a candidate crosses into squeeze
// territory (score >= ALERT_THRESHOLD) coming from below it.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALERT_THRESHOLD = 70;
// Avoid re-alerting on the same ticker while it stays hot across scans.
const REALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Candidate {
  symbol: string;
  companyName: string;
  price: number;
  squeezeScore: number;
  volumeRatio: number;
  drawdownFrom52w: number;
  change5d: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const scanRes = await fetch(`${SUPABASE_URL}/functions/v1/squeeze-radar`, {
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!scanRes.ok) {
    return new Response(JSON.stringify({ error: `squeeze-radar returned ${scanRes.status}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const scan = await scanRes.json();
  const candidates: Candidate[] = scan?.candidates ?? [];

  const tickers = candidates.map((c) => c.symbol);
  const { data: stateRows } = await supabase
    .from("squeeze_alert_state")
    .select("ticker, last_score, last_alerted_at")
    .in("ticker", tickers.length ? tickers : ["__none__"]);
  const stateByTicker = new Map((stateRows ?? []).map((r) => [r.ticker, r]));

  let alerts = 0;
  const now = Date.now();

  for (const c of candidates) {
    const prevState = stateByTicker.get(c.symbol);
    const prevScore = prevState?.last_score ?? null;
    const wasBelow = prevScore === null || prevScore < ALERT_THRESHOLD;
    const isAbove = c.squeezeScore >= ALERT_THRESHOLD;
    const cooledDown =
      !prevState?.last_alerted_at || now - new Date(prevState.last_alerted_at).getTime() > REALERT_COOLDOWN_MS;

    let alerted = false;
    if (prevState && isAbove && wasBelow && cooledDown) {
      const { error } = await supabase.from("market_alerts").insert({
        alert_type: "squeeze",
        entity_id: c.symbol,
        entity_label: c.companyName || c.symbol,
        title: `${c.symbol} squeeze score ${c.squeezeScore}`,
        message: `${c.companyName || c.symbol} crossed into squeeze territory (score ${c.squeezeScore}/100, volume ${c.volumeRatio}x avg, ${c.change5d > 0 ? "+" : ""}${c.change5d}% over 5d).`,
        severity: c.squeezeScore >= 85 ? "warning" : "info",
        metadata: { score: c.squeezeScore, previous_score: prevScore, price: c.price, volume_ratio: c.volumeRatio, change5d: c.change5d },
      });
      if (!error) {
        alerts++;
        alerted = true;
      }
    }

    await supabase.from("squeeze_alert_state").upsert({
      ticker: c.symbol,
      last_score: c.squeezeScore,
      last_alerted_at: alerted ? new Date().toISOString() : prevState?.last_alerted_at ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  return new Response(
    JSON.stringify({ scanned: candidates.length, alerts }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
