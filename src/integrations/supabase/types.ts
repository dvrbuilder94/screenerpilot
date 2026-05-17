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
      hidden_gems_metrics: {
        Row: {
          atr_percentile: number | null
          balance_sheet_pctl: number | null
          calculated_at: string
          current_ratio: number | null
          ev_ebitda: number | null
          fcf_delta_pctl: number | null
          fcf_delta_qoq: number | null
          id: string
          margin_improvement_pctl: number | null
          margin_improvement_qoq: number | null
          neglect_pctl: number | null
          net_debt_ebitda: number | null
          price_sales: number | null
          price_structure_pctl: number | null
          revenue_growth_pctl: number | null
          revenue_growth_qoq: number | null
          shares_diluted: boolean | null
          symbol: string
          trend_slope: number | null
          valuation_pctl: number | null
          volume_rank: number | null
        }
        Insert: {
          atr_percentile?: number | null
          balance_sheet_pctl?: number | null
          calculated_at?: string
          current_ratio?: number | null
          ev_ebitda?: number | null
          fcf_delta_pctl?: number | null
          fcf_delta_qoq?: number | null
          id?: string
          margin_improvement_pctl?: number | null
          margin_improvement_qoq?: number | null
          neglect_pctl?: number | null
          net_debt_ebitda?: number | null
          price_sales?: number | null
          price_structure_pctl?: number | null
          revenue_growth_pctl?: number | null
          revenue_growth_qoq?: number | null
          shares_diluted?: boolean | null
          symbol: string
          trend_slope?: number | null
          valuation_pctl?: number | null
          volume_rank?: number | null
        }
        Update: {
          atr_percentile?: number | null
          balance_sheet_pctl?: number | null
          calculated_at?: string
          current_ratio?: number | null
          ev_ebitda?: number | null
          fcf_delta_pctl?: number | null
          fcf_delta_qoq?: number | null
          id?: string
          margin_improvement_pctl?: number | null
          margin_improvement_qoq?: number | null
          neglect_pctl?: number | null
          net_debt_ebitda?: number | null
          price_sales?: number | null
          price_structure_pctl?: number | null
          revenue_growth_pctl?: number | null
          revenue_growth_qoq?: number | null
          shares_diluted?: boolean | null
          symbol?: string
          trend_slope?: number | null
          valuation_pctl?: number | null
          volume_rank?: number | null
        }
        Relationships: []
      }
      hidden_gems_scores: {
        Row: {
          balance_sheet_score: number
          calculated_at: string
          company_name: string | null
          explanation: string
          fundamentals_score: number
          hidden_gem_score: number
          id: string
          market_cap: number | null
          market_neglect_score: number
          previous_score: number | null
          price_structure_score: number
          rank: number | null
          sector: string | null
          symbol: string
          valuation_score: number
        }
        Insert: {
          balance_sheet_score: number
          calculated_at?: string
          company_name?: string | null
          explanation: string
          fundamentals_score: number
          hidden_gem_score: number
          id?: string
          market_cap?: number | null
          market_neglect_score: number
          previous_score?: number | null
          price_structure_score: number
          rank?: number | null
          sector?: string | null
          symbol: string
          valuation_score: number
        }
        Update: {
          balance_sheet_score?: number
          calculated_at?: string
          company_name?: string | null
          explanation?: string
          fundamentals_score?: number
          hidden_gem_score?: number
          id?: string
          market_cap?: number | null
          market_neglect_score?: number
          previous_score?: number | null
          price_structure_score?: number
          rank?: number | null
          sector?: string | null
          symbol?: string
          valuation_score?: number
        }
        Relationships: []
      }
      macro_indicators: {
        Row: {
          category: string
          change_pct: number | null
          change_value: number | null
          country: string | null
          created_at: string
          current_value: number | null
          display_name: string
          fetched_at: string
          frequency: string | null
          history: Json | null
          id: string
          notes: string | null
          observation_date: string | null
          previous_value: number | null
          series_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          change_pct?: number | null
          change_value?: number | null
          country?: string | null
          created_at?: string
          current_value?: number | null
          display_name: string
          fetched_at?: string
          frequency?: string | null
          history?: Json | null
          id?: string
          notes?: string | null
          observation_date?: string | null
          previous_value?: number | null
          series_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          change_pct?: number | null
          change_value?: number | null
          country?: string | null
          created_at?: string
          current_value?: number | null
          display_name?: string
          fetched_at?: string
          frequency?: string | null
          history?: Json | null
          id?: string
          notes?: string | null
          observation_date?: string | null
          previous_value?: number | null
          series_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      market_snapshots: {
        Row: {
          category: string
          change_1d: number | null
          change_pct_1d: number | null
          change_pct_1m: number | null
          change_pct_1w: number | null
          change_pct_1y: number | null
          change_pct_ytd: number | null
          created_at: string
          current_price: number | null
          display_name: string
          fetched_at: string
          id: string
          market_cap: number | null
          previous_close: number | null
          raw_data: Json | null
          region: string | null
          symbol: string
          updated_at: string
          volume: number | null
        }
        Insert: {
          category: string
          change_1d?: number | null
          change_pct_1d?: number | null
          change_pct_1m?: number | null
          change_pct_1w?: number | null
          change_pct_1y?: number | null
          change_pct_ytd?: number | null
          created_at?: string
          current_price?: number | null
          display_name: string
          fetched_at?: string
          id?: string
          market_cap?: number | null
          previous_close?: number | null
          raw_data?: Json | null
          region?: string | null
          symbol: string
          updated_at?: string
          volume?: number | null
        }
        Update: {
          category?: string
          change_1d?: number | null
          change_pct_1d?: number | null
          change_pct_1m?: number | null
          change_pct_1w?: number | null
          change_pct_1y?: number | null
          change_pct_ytd?: number | null
          created_at?: string
          current_price?: number | null
          display_name?: string
          fetched_at?: string
          id?: string
          market_cap?: number | null
          previous_close?: number | null
          raw_data?: Json | null
          region?: string | null
          symbol?: string
          updated_at?: string
          volume?: number | null
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
      ratio_snapshots: {
        Row: {
          category: string
          change_pct_1d: number | null
          change_pct_1m: number | null
          change_pct_1w: number | null
          change_pct_3m: number | null
          created_at: string
          current_value: number | null
          denominator_symbol: string
          display_name: string
          fetched_at: string
          history_90d: Json | null
          id: string
          max_5y: number | null
          mean_5y: number | null
          min_5y: number | null
          notes: string | null
          numerator_symbol: string
          percentile_5y: number | null
          ratio_id: string
          std_5y: number | null
          updated_at: string
          z_score: number | null
        }
        Insert: {
          category: string
          change_pct_1d?: number | null
          change_pct_1m?: number | null
          change_pct_1w?: number | null
          change_pct_3m?: number | null
          created_at?: string
          current_value?: number | null
          denominator_symbol: string
          display_name: string
          fetched_at?: string
          history_90d?: Json | null
          id?: string
          max_5y?: number | null
          mean_5y?: number | null
          min_5y?: number | null
          notes?: string | null
          numerator_symbol: string
          percentile_5y?: number | null
          ratio_id: string
          std_5y?: number | null
          updated_at?: string
          z_score?: number | null
        }
        Update: {
          category?: string
          change_pct_1d?: number | null
          change_pct_1m?: number | null
          change_pct_1w?: number | null
          change_pct_3m?: number | null
          created_at?: string
          current_value?: number | null
          denominator_symbol?: string
          display_name?: string
          fetched_at?: string
          history_90d?: Json | null
          id?: string
          max_5y?: number | null
          mean_5y?: number | null
          min_5y?: number | null
          notes?: string | null
          numerator_symbol?: string
          percentile_5y?: number | null
          ratio_id?: string
          std_5y?: number | null
          updated_at?: string
          z_score?: number | null
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
      stock_fundamentals: {
        Row: {
          capital_expenditures: number | null
          cash_and_equivalents: number | null
          created_at: string
          current_assets: number | null
          current_liabilities: number | null
          ebitda: number | null
          enterprise_value: number | null
          ev_ebitda: number | null
          fiscal_quarter: string
          free_cash_flow: number | null
          id: string
          net_income: number | null
          operating_cash_flow: number | null
          operating_income: number | null
          price_sales: number | null
          revenue: number | null
          shares_outstanding: number | null
          symbol: string
          total_debt: number | null
          total_equity: number | null
        }
        Insert: {
          capital_expenditures?: number | null
          cash_and_equivalents?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          ebitda?: number | null
          enterprise_value?: number | null
          ev_ebitda?: number | null
          fiscal_quarter: string
          free_cash_flow?: number | null
          id?: string
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_income?: number | null
          price_sales?: number | null
          revenue?: number | null
          shares_outstanding?: number | null
          symbol: string
          total_debt?: number | null
          total_equity?: number | null
        }
        Update: {
          capital_expenditures?: number | null
          cash_and_equivalents?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          ebitda?: number | null
          enterprise_value?: number | null
          ev_ebitda?: number | null
          fiscal_quarter?: string
          free_cash_flow?: number | null
          id?: string
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_income?: number | null
          price_sales?: number | null
          revenue?: number | null
          shares_outstanding?: number | null
          symbol?: string
          total_debt?: number | null
          total_equity?: number | null
        }
        Relationships: []
      }
      stock_universe: {
        Row: {
          avg_volume_90d: number | null
          company_name: string | null
          country: string | null
          current_price: number | null
          id: string
          industry: string | null
          is_active: boolean | null
          last_updated: string
          market_cap: number | null
          sector: string | null
          symbol: string
        }
        Insert: {
          avg_volume_90d?: number | null
          company_name?: string | null
          country?: string | null
          current_price?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          last_updated?: string
          market_cap?: number | null
          sector?: string | null
          symbol: string
        }
        Update: {
          avg_volume_90d?: number | null
          company_name?: string | null
          country?: string | null
          current_price?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          last_updated?: string
          market_cap?: number | null
          sector?: string | null
          symbol?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      get_user_tier: { Args: { p_user_id: string }; Returns: string }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
