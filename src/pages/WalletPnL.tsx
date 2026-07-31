import { useState } from "react";
import { Wallet, Search, Info, TrendingUp, TrendingDown } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_WALLET, isEvmAddress, fmtUsd, type WalletPnL } from "@/lib/walletPnl";

const POS = "hsl(152 46% 56%)";
const NEG = "hsl(356 72% 66%)";
const ret = (v: number) => (v > 0 ? POS : v < 0 ? NEG : "hsl(var(--muted-foreground))");

function Tile({ label, value, tone }: { label: string; value: number; tone?: "gain" | "plain" }) {
  const color = tone === "gain" ? ret(value) : undefined;
  const prefix = tone === "gain" && value > 0 ? "+" : "";
  return (
    <div className="fin-card p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">{label}</div>
      <div className="text-xl font-semibold mt-1 font-mono tabular-nums" style={{ color }}>{prefix}{fmtUsd(value)}</div>
    </div>
  );
}

export default function WalletPnLPage() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState<WalletPnL | null>(null);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = address.trim();
    if (!isEvmAddress(addr)) { setError("Enter a valid EVM address (0x…)"); return; }
    setError(null);
    setLoading(true);
    try {
      const { data: res, error: err } = await supabase.functions.invoke("wallet-pnl", { body: { address: addr } });
      if (err || !res || res.error || res.needsKey) {
        setData(SAMPLE_WALLET);
        setLive(false);
      } else {
        setData(res as WalletPnL);
        setLive(true);
      }
    } catch {
      setData(SAMPLE_WALLET);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  const totalPnl = data ? data.realized + data.unrealized : 0;
  const maxChain = data ? Math.max(...data.byChain.map((c) => c.value), 1) : 1;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-12">
      <Seo title="Wallet PnL — ScreenerPilot" description="Multi-EVM wallet PnL: paste any address and see net invested, in/out flows, realized & unrealized gains across chains." path="/wallet" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight inline-flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> Wallet PnL
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Paste any EVM address — see what you put in, took out and gained, across every chain.</p>

        <form onSubmit={analyze} className="relative mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x… wallet address"
            aria-label="Wallet address"
            autoComplete="off"
            spellCheck={false}
            className="h-14 pl-12 pr-28 text-[15px] font-mono bg-secondary/40"
          />
          <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium disabled:opacity-60">
            {loading ? "Reading…" : "Analyze"}
          </button>
        </form>
        {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}

        {data && (
          <>
            {!live && (
              <div className="mt-4 flex items-start gap-2 text-[12px] text-muted-foreground bg-secondary/40 border border-border rounded-xl px-3 py-2.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                <span>Sample data. Set <span className="font-mono">ZERION_API_KEY</span> in Supabase and deploy <span className="font-mono">wallet-pnl</span> to read real wallets.</span>
              </div>
            )}

            {/* Headline */}
            <div className="fin-card p-5 mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Portfolio value</div>
                <div className="text-3xl font-semibold mt-1 font-mono tabular-nums">{fmtUsd(data.totalValue)}</div>
                <div className="text-[13px] font-mono mt-0.5 inline-flex items-center gap-1" style={{ color: ret(data.change1d) }}>
                  {data.change1d >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {data.change1d >= 0 ? "+" : ""}{data.change1d.toFixed(2)}% 24h
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Total PnL</div>
                <div className="text-2xl font-semibold mt-1 font-mono tabular-nums" style={{ color: ret(totalPnl) }}>
                  {totalPnl > 0 ? "+" : ""}{fmtUsd(totalPnl)}
                </div>
              </div>
            </div>

            {/* Flows + gains */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <Tile label="Net invested" value={data.netInvested} />
              <Tile label="Received in" value={data.received} />
              <Tile label="Sent out" value={data.sent} />
              <Tile label="Realized gain" value={data.realized} tone="gain" />
              <Tile label="Unrealized gain" value={data.unrealized} tone="gain" />
              <Tile label="Fees paid" value={data.fees} />
            </div>

            {/* Chain distribution */}
            {data.byChain.length > 0 && (
              <section className="mt-7">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">By chain</h2>
                <div className="fin-card divide-y divide-border/40 overflow-hidden">
                  {data.byChain.map((c) => (
                    <div key={c.chain} className="grid grid-cols-[90px_1fr_auto] gap-3 items-center px-4 py-2.5">
                      <span className="text-[13px] font-medium">{c.chain}</span>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${(c.value / maxChain) * 100}%` }} />
                      </div>
                      <span className="font-mono text-[13px] text-right tabular-nums">{fmtUsd(c.value)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Holdings */}
            {data.holdings.length > 0 && (
              <section className="mt-7">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">Top holdings</h2>
                <div className="fin-card divide-y divide-border/40 overflow-hidden">
                  {data.holdings.map((h, i) => (
                    <div key={`${h.symbol}-${i}`} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold text-[14px]">{h.symbol}</span>
                        <span className="text-[12px] text-muted-foreground ml-2">{h.name}</span>
                        {h.chain && <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-2">{h.chain}</span>}
                      </div>
                      <span className="font-mono text-[13px] tabular-nums">{fmtUsd(h.value)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              PnL across 20+ EVM chains via Zerion. Net invested = value in − value out; realized/unrealized are computed from cost basis.
              Read-only, view any address. Not financial advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
