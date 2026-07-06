import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Star, Plus, X, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useQuotes } from "@/hooks/useQuotes";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || !isFinite(n)
    ? "—"
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export default function Watchlist() {
  const { items, add, remove, has } = useWatchlist();
  const symbols = items.map((i) => i.symbol);
  const { data: quotes = {}, isLoading, isFetching } = useQuotes(symbols);
  const [input, setInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    if (has(sym)) {
      setInput("");
      return;
    }
    add({ symbol: sym });
    setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 pb-28 lg:pb-12">
      <Seo title="Mi Watchlist — ScreenerPilot" description="Sigue cualquier acción con precio en vivo. Agrega, mira y quita — sin fricción." path="/watchlist" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Star className="w-6 h-6 text-primary" /> Mi Watchlist
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Agrega cualquier ticker y síguelo en vivo. Se guarda en este dispositivo.
        </p>
      </div>

      {/* Add any ticker */}
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Agregar ticker — PLTR, LAC, BMNR…"
            aria-label="Agregar ticker"
            maxLength={12}
            className="pl-9 uppercase"
          />
        </div>
        <Button type="submit" disabled={!input.trim()} className="flex-shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Agregar
        </Button>
      </form>

      {/* List */}
      {items.length === 0 ? (
        <div className="fin-card p-10 text-center space-y-3">
          <Star className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="text-foreground font-medium">Tu watchlist está vacía</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escribe un ticker arriba para empezar a seguir tus gemas.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-1 flex-wrap">
            {["PLTR", "LAC", "BMNR", "IONQ"].map((s) => (
              <button
                key={s}
                onClick={() => add({ symbol: s })}
                className="text-xs font-mono px-2.5 py-1 rounded-md border border-border hover:border-primary/40 hover:text-primary transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="fin-card divide-y divide-border/40 overflow-hidden">
          {items.map((it) => {
            const q = quotes[it.symbol];
            const pct = q?.changePct ?? null;
            const up = (pct ?? 0) >= 0;
            const priceMissing = !isLoading && q?.price == null;
            return (
              <div key={it.id} className="flex items-center gap-3 px-4 py-3.5 group">
                <Link to={`/stock-intelligence?symbol=${it.symbol}`} className="flex-1 min-w-0">
                  <div className="font-mono font-semibold text-foreground text-[15px]">{it.symbol}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">
                    {q?.name && q.name !== it.symbol ? q.name : priceMissing ? "Ticker no encontrado" : "—"}
                  </div>
                </Link>

                <div className="text-right shrink-0">
                  {isLoading && !q ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
                  ) : (
                    <>
                      <div className="font-mono text-[15px] tabular-nums text-foreground">
                        {q?.price != null ? fmt(q.price) : "—"}
                      </div>
                      <div className={cn("inline-flex items-center gap-0.5 font-mono text-[12px] tabular-nums", pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-red-400")}>
                        {pct != null && (up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
                        {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => remove(it.symbol)}
                  aria-label={`Quitar ${it.symbol}`}
                  className="flex-shrink-0 p-2 -mr-1 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          {isFetching ? "Actualizando precios…" : "Precios de Yahoo · se refresca cada minuto"}
        </p>
      )}
    </div>
  );
}
