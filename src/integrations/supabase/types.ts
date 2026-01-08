export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points_reward: number
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points_reward?: number
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_reward?: number
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      asset_candles: {
        Row: {
          asset_type: string
          close: number
          created_at: string
          high: number
          id: string
          interval: string
          low: number
          open: number
          symbol: string
          timestamp: number
          volume: number
        }
        Insert: {
          asset_type: string
          close: number
          created_at?: string
          high: number
          id?: string
          interval: string
          low: number
          open: number
          symbol: string
          timestamp: number
          volume: number
        }
        Update: {
          asset_type?: string
          close?: number
          created_at?: string
          high?: number
          id?: string
          interval?: string
          low?: number
          open?: number
          symbol?: string
          timestamp?: number
          volume?: number
        }
        Relationships: []
      }
      asset_snapshots: {
        Row: {
          asset_type: string
          atr: number | null
          calculated_at: string
          confidence: number | null
          created_at: string
          current_price: number
          ema_200: number | null
          ema_21: number | null
          ema_50: number | null
          ema_9: number | null
          id: string
          interval: string
          macd: number | null
          macd_histogram: number | null
          macd_signal: number | null
          rsi: number | null
          signal_score: number | null
          signal_type: string | null
          supertrend: number | null
          supertrend_direction: string | null
          symbol: string
          trend: string | null
        }
        Insert: {
          asset_type: string
          atr?: number | null
          calculated_at?: string
          confidence?: number | null
          created_at?: string
          current_price: number
          ema_200?: number | null
          ema_21?: number | null
          ema_50?: number | null
          ema_9?: number | null
          id?: string
          interval: string
          macd?: number | null
          macd_histogram?: number | null
          macd_signal?: number | null
          rsi?: number | null
          signal_score?: number | null
          signal_type?: string | null
          supertrend?: number | null
          supertrend_direction?: string | null
          symbol: string
          trend?: string | null
        }
        Update: {
          asset_type?: string
          atr?: number | null
          calculated_at?: string
          confidence?: number | null
          created_at?: string
          current_price?: number
          ema_200?: number | null
          ema_21?: number | null
          ema_50?: number | null
          ema_9?: number | null
          id?: string
          interval?: string
          macd?: number | null
          macd_histogram?: number | null
          macd_signal?: number | null
          rsi?: number | null
          signal_score?: number | null
          signal_type?: string | null
          supertrend?: number | null
          supertrend_direction?: string | null
          symbol?: string
          trend?: string | null
        }
        Relationships: []
      }
      prediction_votes: {
        Row: {
          choice: boolean
          created_at: string
          id: string
          prediction_id: string
          user_id: string
        }
        Insert: {
          choice: boolean
          created_at?: string
          id?: string
          prediction_id: string
          user_id: string
        }
        Update: {
          choice?: boolean
          created_at?: string
          id?: string
          prediction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_votes_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          condition: Json
          created_at: string
          id: string
          resolve_at: string
          result: boolean | null
          season_id: string
          status: string
          symbol: string
          title: string
        }
        Insert: {
          condition: Json
          created_at?: string
          id?: string
          resolve_at: string
          result?: boolean | null
          season_id: string
          status?: string
          symbol: string
          title: string
        }
        Update: {
          condition?: Json
          created_at?: string
          id?: string
          resolve_at?: string
          result?: boolean | null
          season_id?: string
          status?: string
          symbol?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      price_expectations: {
        Row: {
          created_at: string
          error_pct: number | null
          id: string
          resolved_price: number | null
          symbol: string
          target_month: string
          target_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_pct?: number | null
          id?: string
          resolved_price?: number | null
          symbol: string
          target_month: string
          target_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_pct?: number | null
          id?: string
          resolved_price?: number | null
          symbol?: string
          target_month?: string
          target_price?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string
          id: string
          name: string
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          name: string
          starts_at: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          name?: string
          starts_at?: string
          status?: string
        }
        Relationships: []
      }
      sentiment_votes: {
        Row: {
          created_at: string
          direction: string
          id: string
          symbol: string
          user_id: string
          vote_date: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          symbol: string
          user_id: string
          vote_date?: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          symbol?: string
          user_id?: string
          vote_date?: string
        }
        Relationships: []
      }
      signal_outcomes: {
        Row: {
          end_price: number
          horizon: string
          id: string
          max_drawdown: number
          resolved_at: string
          return_pct: number
          snapshot_id: string
          start_price: number
        }
        Insert: {
          end_price: number
          horizon: string
          id?: string
          max_drawdown: number
          resolved_at?: string
          return_pct: number
          snapshot_id: string
          start_price: number
        }
        Update: {
          end_price?: number
          horizon?: string
          id?: string
          max_drawdown?: number
          resolved_at?: string
          return_pct?: number
          snapshot_id?: string
          start_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "signal_outcomes_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "signal_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_snapshots: {
        Row: {
          asset_type: string
          confidence: number
          created_at: string
          id: string
          price_at_signal: number
          score: number
          signal: string
          symbol: string
          timeframe: string
        }
        Insert: {
          asset_type: string
          confidence: number
          created_at?: string
          id?: string
          price_at_signal: number
          score: number
          signal: string
          symbol: string
          timeframe: string
        }
        Update: {
          asset_type?: string
          confidence?: number
          created_at?: string
          id?: string
          price_at_signal?: number
          score?: number
          signal?: string
          symbol?: string
          timeframe?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_usage: {
        Row: {
          created_at: string | null
          date: string
          id: string
          message_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          message_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          message_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          current_level: number
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_season_stats: {
        Row: {
          correct: number
          season_id: string
          total: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          correct?: number
          season_id: string
          total?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          correct?: number
          season_id?: string
          total?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          max_tickers: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_tickers?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_tickers?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlists: {
        Row: {
          asset_type: string
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: { Args: { points: number }; Returns: number }
      get_user_tier: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_prediction_vote: {
        Args: { p_choice: boolean; p_prediction_id: string }
        Returns: undefined
      }
      resolve_prediction: {
        Args: { p_prediction_id: string; p_result: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_tier: "free" | "pro" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      subscription_tier: ["free", "pro", "premium"],
    },
  },
} as const
