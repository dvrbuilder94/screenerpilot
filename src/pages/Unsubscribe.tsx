import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const d = await r.json();
        if (r.ok && d.valid) setState("valid");
        else if (d.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch { setState("error"); }
    })();
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    if (error) { setState("error"); return; }
    if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else setState("done");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
      <Seo title="Unsubscribe — ScreenerPilot" description="Manage your email preferences." path="/unsubscribe" />
      <div className="fin-card p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold mb-3">Email preferences</h1>
        {state === "loading" && <p className="text-sm text-muted-foreground">Checking your link…</p>}
        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Click the button below to confirm you want to unsubscribe from ScreenerPilot emails.
            </p>
            <Button onClick={confirm} disabled={busy}>{busy ? "Processing…" : "Confirm unsubscribe"}</Button>
          </>
        )}
        {state === "done" && <p className="text-sm text-muted-foreground">You've been unsubscribed. Sorry to see you go.</p>}
        {state === "already" && <p className="text-sm text-muted-foreground">This address is already unsubscribed.</p>}
        {state === "invalid" && <p className="text-sm text-muted-foreground">This link is invalid or expired.</p>}
        {state === "error" && <p className="text-sm text-muted-foreground">Something went wrong. Please try again later.</p>}
      </div>
    </div>
  );
}
