// Shared cron authentication for the write-side Squeeze Radar jobs.
// Accepts a request when the x-cron-secret header matches either the
// CRON_SECRET env var or the `cron_secret` value stored in the database vault
// (which is what the pg_cron schedules use — the value never leaves the server).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function isAuthorizedCron(
  req: Request,
  supabase: SupabaseClient,
): Promise<boolean> {
  const provided = req.headers.get("x-cron-secret");
  if (!provided) return false;

  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret && provided === envSecret) return true;

  const { data, error } = await supabase.rpc("verify_cron_secret", { candidate: provided });
  return !error && data === true;
}
