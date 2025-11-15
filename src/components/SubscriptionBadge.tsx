import { Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SubscriptionBadge() {
  const { user } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  if (!user || !subscription) return null;

  const tier = subscription.tier;

  const tierConfig = {
    free: {
      label: 'Free',
      icon: null,
      className: 'bg-muted text-muted-foreground border-border'
    },
    pro: {
      label: 'Pro',
      icon: Sparkles,
      className: 'bg-gradient-to-r from-primary to-accent text-primary-foreground border-primary'
    },
    premium: {
      label: 'Premium',
      icon: Crown,
      className: 'bg-gradient-to-r from-accent to-bullish text-primary-foreground border-accent'
    }
  };

  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} flex items-center gap-1.5 px-3 py-1`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </Badge>
  );
}
