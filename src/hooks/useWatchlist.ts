import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Device-local watchlist — works with no login, persists across sessions.
// (Cross-device DB sync can layer on later; the key goal is: add any ticker,
// see it, remove it — end to end, no friction.)
const KEY = "sp_watchlist_v1";

export interface WatchlistItem {
  id: string;
  symbol: string;
  asset_type: string;
  created_at: string;
}

function read(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: WatchlistItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => read(),
    staleTime: Infinity,
  });

  const add = useMutation({
    mutationFn: async ({ symbol, asset_type = "stock" }: { symbol: string; asset_type?: string }) => {
      const sym = symbol.trim().toUpperCase();
      if (!sym) return;
      const items = read();
      if (items.some((i) => i.symbol === sym)) return;
      write([
        { id: crypto.randomUUID(), symbol: sym, asset_type, created_at: new Date().toISOString() },
        ...items,
      ]);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${v.symbol.trim().toUpperCase()} agregada a tu watchlist`);
    },
    onError: (e: any) => toast.error(e?.message || "No se pudo agregar"),
  });

  const remove = useMutation({
    mutationFn: async (symbol: string) => {
      const sym = symbol.toUpperCase();
      write(read().filter((i) => i.symbol !== sym));
    },
    onSuccess: (_d, symbol) => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${symbol.toUpperCase()} quitada`);
    },
    onError: (e: any) => toast.error(e?.message || "No se pudo quitar"),
  });

  const items = query.data ?? [];
  const symbols = items.map((w) => w.symbol);
  const has = (symbol: string) => symbols.includes(symbol.toUpperCase());
  const toggle = (symbol: string, asset_type = "stock") =>
    has(symbol) ? remove.mutate(symbol) : add.mutate({ symbol, asset_type });

  return {
    items,
    symbols,
    isLoading: query.isLoading,
    has,
    add: add.mutate,
    remove: remove.mutate,
    toggle,
    isAuthed: !!user,
  };
}
