import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgentBias = "bullish" | "neutral" | "bearish";

export interface AgentResponse {
  bias: AgentBias;
  confidence: number;
  thesis: string;
  evidence: string[];
}

export interface CommitteeResponse {
  macro: AgentResponse;
  momentum: AgentResponse;
  quant: AgentResponse;
  summary: string;
}

export interface MarketContext {
  regime?: string;
  fearGreed?: number;
  vix?: number;
  spy_1d?: number;
  btc_1d?: number;
  topMovers?: { symbol: string; change_pct: number }[];
  sectors?: { name: string; change_pct: number }[];
}

export function useCommitteeAnalysis() {
  return useMutation<CommitteeResponse, Error, { question: string; context?: MarketContext }>({
    mutationFn: async ({ question, context }) => {
      const { data, error } = await supabase.functions.invoke("committee-analysis", {
        body: { question, context },
      });
      if (error) {
        // Try to extract structured error
        const msg = (data as any)?.error || error.message || "Committee unavailable";
        throw new Error(msg);
      }
      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }
      return data as CommitteeResponse;
    },
  });
}
