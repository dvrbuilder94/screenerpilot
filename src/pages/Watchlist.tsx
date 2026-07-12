import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Star, Plus, X, TrendingUp, TrendingDown, Search, LayoutGrid, List } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useQuotes } from "@/hooks/useQuotes";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Custom themes rather than rigid GICS sectors — how a trader groups ideas.
const SECTORS = [
  "AI & Data",
  "Semiconductors",
  "Quantum",
  "Crypto & Mining",
  "Energy & Lithium",
  "Healthcare",
  "Fintech",
  "Consumer",
  "Defense & Space",
  "Other",
];
const UNSET = "Unclassified";

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || !isFinite(n)
    ? "—"
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export default function Watchlist() {
  const { items, add, remove, setSector, has } = useWatchlist();
  const symbols = items.map((i) => i.symbol);
  const { data: quotes = {}, isLoading, isFetching, error } = useQuotes(symbols);

  const [input, setInput] = useState("");
  const [pickSector, setPickSector] = useState<string>("");
  const [grouped, setGrouped] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    if (!has(sym)) add({ symbol: sym, sector: pickSector || undefined });
    setInput("");
  };

  // Build ordered groups: known sectors in SECTORS order, then UNSET last.
  const groups: { sector: string; rows: typeof items }[] = [];
  if (grouped) {
    const order = [...SECTORS, UNSET];
    const byKey = new Map<string, typeof items>();
    for (const it of items) {
      const key = it.sector && SECTORS.includes(it.sector) ? it.sector : UNSET;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(it);
    }
    for (const key of order) if (byKey.has(key)) groups.push({ sector: key, rows: byKey.get(key)! });
  } else {
    groups.push({ sector: "", rows: items });
  }

  const Row = ({ it }: { it: (typeof items)[number] }) => {
    const q = quotes[it.symbol];
    const pct = q?.changePct ?? null;
    const up = (pct ?? 0) >= 0;
    const priceMissing = !isLoading && q?.price == null;
    return (
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Link to={`/asset/${it.symbol}`} className="flex-1 min-w-0">
          <div className="font-mono font-semibold text-foreground text-[15px]">{it.symbol}</div>
          <div className="text-[11.5px] text-muted-foreground truncate">
            {q?.name && q.name !== it.symbol ? q.name : priceMissing ? "Ticker not found" : "—"}
          </div>
        </Link>

        {/* reassign sector inline */}
        <select
          value={it.sector && SECTORS.includes(it.sector) ? it.sector : ""}
          onChange={(e) => setSector({ symbol: it.symbol, sector: e.target.value || undefined })}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Sector for ${it.symbol}`}
          className="hidden sm:block bg-secondary/50 border border-border rounded-md text-[11px] text-muted-foreground px-1.5 py-1 max-w-[140px] focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— sector —</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="text-right shrink-0 w-[76px]">
          {isLoading && !q ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
          ) : (
            <>
              <div className="font-mono text-[14px] tabular-nums text-foreground">{q?.price != null ? fmt(q.price) : "—"}</div>
              <div className={cn("inline-flex items-center gap-0.5 font-mono text-[11.5px] tabular-nums", pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-red-400")}>
                {pct != null && (up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
                {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => remove(it.symbol)}
          aria-label={`Remove ${it.symbol}`}
          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 pb-28 lg:pb-12">
      <Seo title="My Watchlist — ScreenerPilot" description="Track any ticker with live prices, organized by your own themes." path="/watchlist" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" /> My Watchlist
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Any ticker, live, organized by your themes.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => setGrouped((g) => !g)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5"
          >
            {grouped ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            {grouped ? "Flat list" : "By sector"}
          </button>
        )}
      </div>

      {/* Add any ticker + choose sector */}
      <form onSubmit={submit} className="flex gap-2 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Add ticker — AAPL, PLTR, BTC-USD…"
            aria-label="Add ticker"
            maxLength={12}
            className="pl-9 uppercase"
          />
        </div>
        <select
          value={pickSector}
          onChange={(e) => setPickSector(e.target.value)}
          aria-label="Sector for new ticker"
          className="bg-secondary/50 border border-border rounded-md text-sm text-foreground px-2.5 h-10 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Sector…</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button type="submit" disabled={!input.trim()} className="flex-shrink-0">
          <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Add</span>
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="fin-card p-10 text-center space-y-3">
          <Star className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="text-foreground font-medium">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Type a ticker above to start tracking.</p>
          </div>
          <div className="flex gap-2 justify-center pt-1 flex-wrap">
            {["AAPL", "NVDA", "PLTR", "TSLA", "BTC-USD"].map((s) => (
              <button key={s} onClick={() => add({ symbol: s })} className="text-xs font-mono px-2.5 py-1 rounded-md border border-border hover:border-primary/40 hover:text-primary transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.sector || "all"}>
              {grouped && (
                <div className="flex items-center gap-2 px-1 mb-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{g.sector}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground/60">{g.rows.length}</span>
                  <span className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="fin-card divide-y divide-border/40 overflow-hidden">
                {g.rows.map((it) => <Row key={it.id} it={it} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          {error ? "Couldn't refresh prices — retrying…" : isFetching ? "Updating prices…" : "Prices from Yahoo · refreshes every minute"}
        </p>
      )}
    </div>
  );
}
