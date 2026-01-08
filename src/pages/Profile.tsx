import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Crown, Users, Target, Calendar, TrendingUp, Award } from "lucide-react";

interface ParticipationStats {
  sentimentVotes: number;
  priceExpectations: number;
  daysActive: number;
  expectationAccuracy: number | null;
}

export default function Profile() {
  const { user, profile, subscription, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch participation stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['participation-stats', user?.id],
    queryFn: async (): Promise<ParticipationStats> => {
      if (!user?.id) throw new Error('No user');

      // Get sentiment votes count
      const { count: votesCount } = await supabase
        .from('sentiment_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get price expectations count
      const { count: expectationsCount } = await supabase
        .from('price_expectations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get unique active days from sentiment_votes
      const { data: voteDays } = await supabase
        .from('sentiment_votes')
        .select('vote_date')
        .eq('user_id', user.id);

      const uniqueDays = new Set(voteDays?.map(v => v.vote_date) || []);

      // Calculate accuracy from resolved price expectations
      const { data: resolvedExpectations } = await supabase
        .from('price_expectations')
        .select('error_pct')
        .eq('user_id', user.id)
        .not('error_pct', 'is', null);

      let accuracy: number | null = null;
      if (resolvedExpectations && resolvedExpectations.length > 0) {
        const avgError = resolvedExpectations.reduce((sum, e) => sum + Math.abs(e.error_pct || 0), 0) / resolvedExpectations.length;
        accuracy = Math.max(0, 100 - avgError);
      }

      return {
        sentimentVotes: votesCount || 0,
        priceExpectations: expectationsCount || 0,
        daysActive: uniqueDays.size,
        expectationAccuracy: accuracy
      };
    },
    enabled: !!user?.id
  });

  // Calculate Participation Score
  const calculateParticipationScore = (stats: ParticipationStats | undefined): number => {
    if (!stats) return 0;
    
    let score = 0;
    
    // Sentiment votes: 2 points each (max 200)
    score += Math.min(stats.sentimentVotes * 2, 200);
    
    // Price expectations: 10 points each (max 100)
    score += Math.min(stats.priceExpectations * 10, 100);
    
    // Days active: 5 points each (max 150)
    score += Math.min(stats.daysActive * 5, 150);
    
    // Accuracy bonus: up to 50 points
    if (stats.expectationAccuracy !== null) {
      score += Math.round(stats.expectationAccuracy * 0.5);
    }
    
    return score;
  };

  const getReputationLevel = (score: number): { level: string; color: string } => {
    if (score >= 400) return { level: "Expert Analyst", color: "from-yellow-500 to-amber-600" };
    if (score >= 250) return { level: "Senior Contributor", color: "from-purple-500 to-violet-600" };
    if (score >= 100) return { level: "Active Member", color: "from-blue-500 to-cyan-600" };
    if (score >= 25) return { level: "Newcomer", color: "from-green-500 to-emerald-600" };
    return { level: "Observer", color: "from-gray-500 to-slate-600" };
  };

  const participationScore = calculateParticipationScore(stats);
  const reputation = getReputationLevel(participationScore);

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

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
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
              <Badge 
                className={`${tierColors[subscription?.tier || 'free']}`}
              >
                <Crown className="w-3 h-3 mr-1" />
                {subscription?.tier?.toUpperCase() || "FREE"} Account
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Community Participation Score */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Community Reputation
          </CardTitle>
          <CardDescription>
            Your participation and contribution to the community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Score Display */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Participation Score</p>
              <p className="text-4xl font-bold text-foreground">{participationScore}</p>
            </div>
            <div className="text-right">
              <Badge className={`bg-gradient-to-r ${reputation.color} text-white px-3 py-1`}>
                {reputation.level}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">Community Rank</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-bullish" />
                <span className="text-xs text-muted-foreground">Sentiment Votes</span>
              </div>
              <p className="text-2xl font-semibold">{statsLoading ? "-" : stats?.sentimentVotes || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Price Targets</span>
              </div>
              <p className="text-2xl font-semibold">{statsLoading ? "-" : stats?.priceExpectations || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Days Active</span>
              </div>
              <p className="text-2xl font-semibold">{statsLoading ? "-" : stats?.daysActive || 0}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-bullish" />
                <span className="text-xs text-muted-foreground">Prediction Accuracy</span>
              </div>
              <p className="text-2xl font-semibold">
                {statsLoading ? "-" : stats?.expectationAccuracy !== null ? `${stats.expectationAccuracy.toFixed(0)}%` : "N/A"}
              </p>
            </div>
          </div>

          {/* How to Improve */}
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium mb-3">How to improve your score</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-bullish" />
                Vote on asset sentiment daily (+2 points per vote)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Submit monthly price expectations (+10 points each)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Stay active consistently (+5 points per active day)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                Improve prediction accuracy (bonus up to 50 points)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
