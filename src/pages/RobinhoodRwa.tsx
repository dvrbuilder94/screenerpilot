import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, ExternalLink, Loader2, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";

const ROBINHOOD_API = "https://api.robinhood.com/rhj";
const PAGE_SIZE = 25;

type Deployment = {
  contractAddress: string;
  chainId: number;
};

type RobinhoodAsset = {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  deployments?: Deployment[];
  currentMultiplier?: string;
  logoUrl?: string;
  status?: string;
};

type RobinhoodQuote = {
  tokenSymbol: string;
  deployments?: Deployment[];
  bid?: string;
  ask?: string;
  currency?: string;
  dailyTradingVolume?: string;
  isTradingHalt?: boolean;
  generatedAt?: string;
};

type RwaRow = RobinhoodAsset & {
  quote?: RobinhoodQuote;
  bid: number | null;
  ask: number | null;
  midpoint: number | null;
  dailyVolume: number | null;
  dailyNotional: number | null;
  spreadBps: number | null;
};

type Fundamental = {
  marketCap: string;
  companyName: string;
};

// On-chain data for a Robinhood Chain token, from Blockscout.
type OnchainToken = {
  symbol: string;
  holders: number;
  totalSupply: number;
  onchainPrice: number | null;
  onchainMarketCap: number | null;
  volume24h: number | null;
};

type ChainStats = {
  totalAddresses: number;
  totalTransactions: number;
  transactionsToday: number;
  averageBlockTime: number;
  gasAverage: number;
};


async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Robinhood API returned ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchRobinhoodMarket(): Promise<RwaRow[]> {
  const [assetsPayload, pricesPayload] = await Promise.all([
    fetchJson<{ assets?: RobinhoodAsset[] } | RobinhoodAsset[]>(`${ROBINHOOD_API}/assets`),
    fetchJson<{ quotes?: RobinhoodQuote[] } | RobinhoodQuote[]>(`${ROBINHOOD_API}/prices`),
  ]);

  const assets = Array.isArray(assetsPayload) ? assetsPayload : assetsPayload.assets ?? [];
  const quotes = Array.isArray(pricesPayload) ? pricesPayload : pricesPayload.quotes ?? [];
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.tokenSymbol.toUpperCase(), quote]));

  return assets
    .filter((asset) => !asset.status || asset.status === "ASSET_STATUS_ACTIVE")
    .map((asset) => {
      const quote = quoteBySymbol.get(asset.tokenSymbol.toUpperCase());
      const bid = quote?.bid ? Number(quote.bid) : null;
      const ask = quote?.ask ? Number(quote.ask) : null;
      const dailyVolume = quote?.dailyTradingVolume ? Number(quote.dailyTradingVolume) : null;
      const midpoint = bid != null && ask != null && bid > 0 && ask > 0 ? (bid + ask) / 2 : bid ?? ask;
      const spreadBps = midpoint && bid != null && ask != null ? ((ask - bid) / midpoint) * 10_000 : null;
      const dailyNotional = midpoint != null && dailyVolume != null ? midpoint * dailyVolume : null;

      return { ...asset, quote, bid, ask, midpoint, dailyVolume, dailyNotional, spreadBps };
    });
}

async function fetchFundamental(symbol: string): Promise<Fundamental | null> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-stock", {
      body: { symbol, timeframe: "daily" },
    });
    if (error || data?.error) return null;
    return {
      marketCap: typeof data?.marketCap === "string" ? data.marketCap : "—",
      companyName: typeof data?.companyName === "string" ? data.companyName : symbol,
    };
  } catch {
    return null;
  }
}

const compactUsd = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

const compactNumber = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
};

const price = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
};

const shortAddress = (address?: string) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—");

const liquidityLabel = (spreadBps: number | null, notional: number | null) => {
  if (spreadBps == null || notional == null) return "Unknown";
  if (spreadBps <= 8 && notional >= 100_000_000) return "Deep";
  if (spreadBps <= 25 && notional >= 20_000_000) return "Good";
  if (spreadBps <= 75 && notional >= 2_000_000) return "Moderate";
  return "Thin";
};

const RobinhoodRwa = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"notional" | "volume" | "spread" | "symbol">("notional");

  const marketQuery = useQuery({
    queryKey: ["robinhood-rwa-market"],
    queryFn: fetchRobinhoodMarket,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = (marketQuery.data ?? []).filter((row) =>
      !term || row.tokenSymbol.toLowerCase().includes(term) || row.tokenName.toLowerCase().includes(term),
    );

    return [...rows].sort((a, b) => {
      if (sort === "symbol") return a.tokenSymbol.localeCompare(b.tokenSymbol);
      if (sort === "spread") return (a.spreadBps ?? Number.MAX_SAFE_INTEGER) - (b.spreadBps ?? Number.MAX_SAFE_INTEGER);
      if (sort === "volume") return (b.dailyVolume ?? -1) - (a.dailyVolume ?? -1);
      return (b.dailyNotional ?? -1) - (a.dailyNotional ?? -1);
    });
  }, [marketQuery.data, search, sort]);

  useEffect(() => setPage(0), [search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const symbols = visibleRows.map((row) => row.tokenSymbol).join(",");

  const fundamentalsQuery = useQuery({
    queryKey: ["robinhood-rwa-fundamentals", symbols],
    enabled: visibleRows.length > 0,
    staleTime: 15 * 60_000,
    queryFn: async () => {
      const entries = await Promise.all(
        visibleRows.map(async (row) => [row.tokenSymbol, await fetchFundamental(row.tokenSymbol)] as const),
      );
      return Object.fromEntries(entries) as Record<string, Fundamental | null>;
    },
  });

  const totalNotional = useMemo(
    () => (marketQuery.data ?? []).reduce((sum, row) => sum + (row.dailyNotional ?? 0), 0),
    [marketQuery.data],
  );
  const deepLiquidity = useMemo(
    () => (marketQuery.data ?? []).filter((row) => liquidityLabel(row.spreadBps, row.dailyNotional) === "Deep").length,
    [marketQuery.data],
  );

  return (
    <div className="space-y-7 pb-14">
      <Seo
        title="Robinhood RWA Market - ScreenerPilot"
        description="Live Robinhood Stock Token market: assets, prices, volume, liquidity proxies, market cap and onchain deployments."
        path="/rwa"
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground mb-2">
            <Database className="w-3.5 h-3.5" /> Robinhood Chain
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tighter">Real World Assets</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Robinhood Stock Tokens ranked by underlying trading liquidity. Live catalog and quotes come from Robinhood; market cap is enriched by ScreenerPilot.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4" /> Canonical deployments only
        </div>
      </div>

      {marketQuery.isError && (
        <div className="fin-card p-5 border-destructive/40 text-sm">
          Could not load Robinhood Stock Token data. The module will retry automatically.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="fin-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Active tokens</div>
          <div className="text-2xl font-semibold mt-1">{marketQuery.data?.length ?? "—"}</div>
        </div>
        <div className="fin-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Underlying $ volume</div>
          <div className="text-2xl font-semibold mt-1">{compactUsd(totalNotional)}</div>
        </div>
        <div className="fin-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Deep liquidity</div>
          <div className="text-2xl font-semibold mt-1">{deepLiquidity}</div>
        </div>
        <div className="fin-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Refresh</div>
          <div className="text-2xl font-semibold mt-1">30s</div>
        </div>
      </div>

      <div className="fin-card p-3 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search NVIDIA, NVDA, Apple…"
            className="w-full h-10 rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="notional">Sort: $ liquidity</option>
          <option value="volume">Sort: volume</option>
          <option value="spread">Sort: tightest spread</option>
          <option value="symbol">Sort: ticker</option>
        </select>
      </div>

      {marketQuery.isLoading ? (
        <div className="min-h-[360px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="fin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-4 py-3 font-normal">Asset</th>
                  <th className="text-right px-3 py-3 font-normal">Bid</th>
                  <th className="text-right px-3 py-3 font-normal">Ask</th>
                  <th className="text-right px-3 py-3 font-normal">Spread</th>
                  <th className="text-right px-3 py-3 font-normal">Volume</th>
                  <th className="text-right px-3 py-3 font-normal">$ Liquidity</th>
                  <th className="text-right px-3 py-3 font-normal">Market cap</th>
                  <th className="text-left px-3 py-3 font-normal">Depth</th>
                  <th className="text-left px-3 py-3 font-normal">Onchain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/35">
                {visibleRows.map((row) => {
                  const deployment = row.deployments?.[0] ?? row.quote?.deployments?.[0];
                  const fundamental = fundamentalsQuery.data?.[row.tokenSymbol];
                  const depth = liquidityLabel(row.spreadBps, row.dailyNotional);
                  return (
                    <tr key={row.id || row.tokenSymbol} className="hover:bg-muted/25 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.logoUrl ? (
                            <img src={row.logoUrl} alt="" className="w-8 h-8 rounded-full bg-muted object-cover" loading="lazy" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                              {row.tokenSymbol.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link to={`/asset/${encodeURIComponent(row.tokenSymbol)}`} className="font-medium hover:underline">
                              {row.tokenSymbol}
                            </Link>
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">{row.tokenName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{price(row.bid)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{price(row.ask)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        {row.spreadBps == null ? "—" : `${row.spreadBps.toFixed(1)} bps`}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">{compactNumber(row.dailyVolume)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums font-medium">{compactUsd(row.dailyNotional)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        {fundamentalsQuery.isFetching && !fundamental ? "…" : fundamental?.marketCap ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full border border-border px-2 py-1 text-[11px]">{depth}</span>
                      </td>
                      <td className="px-3 py-3">
                        {deployment ? (
                          <a
                            href={`https://explorer.robinhoodchain.com/address/${deployment.contractAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                          >
                            {shortAddress(deployment.contractAddress)}
                            <span className="font-sans">· {deployment.chainId}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No Stock Tokens match this search.</div>
          )}

          <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {filtered.length ? `${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}` : "0 assets"}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="rounded border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                className="rounded border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
        Liquidity is a ScreenerPilot proxy based on the underlying equity bid/ask spread and daily notional volume reported by Robinhood. It is not DEX TVL and should not be interpreted as guaranteed executable token liquidity. Stock Tokens track underlying securities and have product, counterparty and regulatory risks distinct from owning the underlying share.
      </div>
    </div>
  );
};

export default RobinhoodRwa;
