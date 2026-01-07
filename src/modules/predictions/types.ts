export interface Season {
  id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'ended';
  created_at: string;
}

export interface PredictionCondition {
  type: 'price_above' | 'price_below' | 'price_change_percent';
  target: number;
  timeframe?: string;
}

export interface Prediction {
  id: string;
  season_id: string;
  title: string;
  symbol: string;
  condition: PredictionCondition;
  resolve_at: string;
  status: 'open' | 'resolved';
  result?: boolean | null;
  created_at: string;
}

export interface PredictionVote {
  id: string;
  prediction_id: string;
  user_id: string;
  choice: boolean;
  created_at: string;
}

export interface UserSeasonStats {
  user_id: string;
  season_id: string;
  xp: number;
  correct: number;
  total: number;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  xp: number;
  correct: number;
  total: number;
  accuracy: number;
  rank: number;
}

export interface PredictionWithVotes extends Prediction {
  yesCount: number;
  noCount: number;
  totalVotes: number;
  consensusPercent: number;
  userVote?: boolean | null;
}
