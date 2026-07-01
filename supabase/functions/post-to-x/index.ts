// Posts BEN's daily squeeze radar picks to X (Twitter) with yesterday's performance.
// Requires env vars: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
// Call after save-daily-picks, ~9am ET.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const X_API_KEY = Deno.env.get("X_API_KEY")!;
const X_API_SECRET = Deno.env.get("X_API_SECRET")!;
const X_ACCESS_TOKEN = Deno.env.get("X_ACCESS_TOKEN")!;
const X_ACCESS_TOKEN_SECRET = Deno.env.get("X_ACCESS_TOKEN_SECRET")!;

// OAuth 1.0a signing — dependency-free, uses Deno Web Crypto
async function buildOAuthHeader(
  method: string,
  url: string,
): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const enc = (s: string) => encodeURIComponent(s);
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${enc(k)}=${enc(oauthParams[k])}`)
    .join("&");

  const baseString = `${method}&${enc(url)}&${enc(sortedParams)}`;
  const signingKey = `${enc(X_API_SECRET)}&${enc(X_ACCESS_TOKEN_SECRET)}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(baseString));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  oauthParams["oauth_signature"] = signature;

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${enc(k)}="${enc(oauthParams[k])}"`)
      .join(", ")
  );
}

async function postTweet(text: string): Promise<{ id: string } | null> {
  const url = "https://api.twitter.com/2/tweets";
  const auth = await buildOAuthHeader("POST", url);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    console.error("X API error", res.status, await res.text());
    return null;
  }
  const j = await res.json();
  return j?.data ?? null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Get today's picks
  const { data: todayPicks } = await supabase
    .from("squeeze_daily_picks")
    .select("rank, symbol, squeeze_score, price_at_pick")
    .eq("pick_date", today)
    .order("rank");

  if (!todayPicks?.length) {
    return new Response(JSON.stringify({ error: "no picks for today yet" }), { status: 400 });
  }

  // Get yesterday's performance
  const { data: prevPicks } = await supabase
    .from("squeeze_daily_picks")
    .select("symbol, change_pct")
    .eq("pick_date", yesterday)
    .not("change_pct", "is", null)
    .order("rank");

  // Build tweet text
  const lines: string[] = [];
  lines.push(`🔥 BEN's Squeeze Radar — ${formatDate(today)}`);
  lines.push("");

  if (prevPicks?.length) {
    lines.push("Yesterday's picks:");
    for (const p of prevPicks.slice(0, 3)) {
      const pct = p.change_pct as number;
      const sign = pct >= 0 ? "+" : "";
      const emoji = pct >= 5 ? " 🚀" : pct >= 0 ? " ✅" : " ❌";
      lines.push(`${p.symbol} ${sign}${pct.toFixed(1)}%${emoji}`);
    }
    lines.push("");
  }

  lines.push("Today's top setups:");
  for (const p of todayPicks.slice(0, 3)) {
    lines.push(`#${p.rank} ${p.symbol} — Score ${p.squeeze_score}`);
  }
  lines.push("");
  lines.push("Free daily scan (no signup) 👇");
  lines.push("screenerpilot.com/squeeze-radar");

  const text = lines.join("\n");

  if (!X_API_KEY || !X_ACCESS_TOKEN) {
    // Return the text without posting (useful for dry-run / preview)
    return new Response(JSON.stringify({ ok: false, reason: "X credentials not set", preview: text }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const tweet = await postTweet(text);
  if (!tweet) {
    return new Response(JSON.stringify({ error: "failed to post tweet" }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ ok: true, tweet_id: tweet.id, text }),
    { headers: { "Content-Type": "application/json" } }
  );
});
