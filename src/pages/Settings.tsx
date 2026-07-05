import { useState } from "react";
import { Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user, profile, refreshProfile, loading } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleToggleDigest = async (checked: boolean) => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ email_digest_enabled: checked })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Could not update preference");
      return;
    }
    await refreshProfile();
    toast.success(checked ? "Daily digest enabled" : "Daily digest disabled");
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl text-center text-muted-foreground">
        Sign in to manage your settings.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <Seo title="Settings - ScreenerPilot" description="Manage your account and email preferences." path="/settings" />
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Settings</h1>

      <section className="rounded-lg border border-border/40 bg-card/30">
        <div className="px-4 py-3 border-b border-border/40">
          <h2 className="text-sm font-medium text-foreground">Email preferences</h2>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Daily morning wire</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Get BEN's market briefing in your inbox every morning. Sent to {user.email}.
              </p>
            </div>
          </div>
          <Switch
            checked={profile?.email_digest_enabled ?? true}
            onCheckedChange={handleToggleDigest}
            disabled={saving}
          />
        </div>
      </section>
    </div>
  );
}
