import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WatchlistItem {
  id: string;
  symbol: string;
  asset_type: string;
  created_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      if (!user) return [] as WatchlistItem[];
      const { data, error } = await supabase
        .from("user_watchlists")
        .select("id, symbol, asset_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WatchlistItem[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: async ({ symbol, asset_type = "stock" }: { symbol: string; asset_type?: string }) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase
        .from("user_watchlists")
        .insert({ user_id: user.id, symbol: symbol.toUpperCase(), asset_type });
      if (error && !String(error.message).includes("duplicate")) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${v.symbol.toUpperCase()} added to watchlist`);
    },
    onError: (e: any) => toast.error(e?.message || "Could not add to watchlist"),
  });

  const remove = useMutation({
    mutationFn: async (symbol: string) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase
        .from("user_watchlists")
        .delete()
        .eq("user_id", user.id)
        .eq("symbol", symbol.toUpperCase());
      if (error) throw error;
    },
    onSuccess: (_d, symbol) => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${symbol.toUpperCase()} removed from watchlist`);
    },
    onError: (e: any) => toast.error(e?.message || "Could not remove from watchlist"),
  });

  const symbols = (query.data ?? []).map((w) => w.symbol);
  const has = (symbol: string) => symbols.includes(symbol.toUpperCase());
  const toggle = (symbol: string, asset_type = "stock") =>
    has(symbol) ? remove.mutate(symbol) : add.mutate({ symbol, asset_type });

  return {
    items: query.data ?? [],
    symbols,
    isLoading: query.isLoading,
    has,
    add: add.mutate,
    remove: remove.mutate,
    toggle,
    isAuthed: !!user,
  };
}
