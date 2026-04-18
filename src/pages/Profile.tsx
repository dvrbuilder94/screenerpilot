import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Crown, CreditCard } from "lucide-react";

export default function Profile() {
  const { user, profile, subscription, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const tierColors = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/20 text-primary",
    premium: "bg-gradient-to-r from-primary to-accent text-primary-foreground"
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const tier = subscription?.tier || 'free';

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      {/* Profile Header */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-4 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-bold text-2xl">
                {getInitials(profile?.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-2xl">{profile?.display_name || "User"}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profile?.email || user.email}</span>
              </div>
              <Badge className={tierColors[tier]}>
                <Crown className="w-3 h-3 mr-1" />
                {tier.toUpperCase()} Account
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subscription */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your plan and unlock advanced features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-lg font-semibold">{tier.toUpperCase()}</p>
            </div>
            <Button onClick={() => navigate('/pricing')} className="gap-2">
              <CreditCard className="w-4 h-4" />
              {tier === 'free' ? 'Upgrade' : 'Manage'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
