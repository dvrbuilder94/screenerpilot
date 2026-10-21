import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowDownUp, RefreshCw, Search, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { formatUsd, sortAndFilterRadar, type CryptoRadarResponse, type CryptoRadarRow, type RadarFilter, type RadarSort } from "@/lib/cryptoRadar";

const filterOptions: { value: RadarFilter; label: string }[] = [
  { value: "all", label: "Top 200" },
  { value: "short", label: "Short squeeze candidates" },
  { value: "long", label: "Long squeeze candidates" },
  { value: "momentum", label: "Strong momentum" },
  { value: "oversold", label: "Oversold (RSI)" },
  { value: "derivatives", label: "With derivatives" },
];
const sortOptions: { value: RadarSort; label: string }[] = [
  { value: "rank", label: "Market cap rank" },
  { value: "shortSqueezeScore", label: "Short squeeze score" },
  { value: "longSqueezeScore", label: "Long squeeze score" },
  { value: "momentumScore", label: "Momentum score" },
  { value: "change24h", label: "Price change 24h" },
  { value: "change7d", label: "Price change 7d" },
  { value: "volumeToMarketCap", label: "Volume / market cap" },
  { value: "oiToMarketCap", label: "OI / market cap" },
];
function pct(n: number | null, digits = 1) {
  return n == null ? "—" : (n > 0 ? "+" : "") + n.toFixed(digits) + "%";
}
function changeColor(n: number | null) {
  if (n == null) return "text-muted-foreground";
  return n >= 0 ? "text-emerald-500" : "text-red-500";
}
function Score({ value, type }: { value: number | null; type: "short" | "long" | "momentum" }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const positive = value >= 65;
  return <span className={positive ? (type === "long" ? "text-orange-400 font-semibold" : "text-emerald-400 font-semibold") : "text-foreground"}>{value}</span>;
}
function RadarRow({ row }: { row: CryptoRadarRow }) {
  const link = "https://www.coingecko.com/en/coins/" + encodeURIComponent(row.id);
  return (
    <tr className="border-b border-border/50 hover:bg-secondary/30">
      <td className="px-3 py-3 text-xs text-muted-foreground">{row.rank}</td>
      <td className="px-3 py-3 min-w-[164px]">
        <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{row.symbol}</a>
        <div className="text-xs text-muted-foreground truncate max-w-[170px]">{row.name}</div>
      </td>
      <td className="px-3 py-3 text-right whitespace-nowrap">{formatUsd(row.price)}</td>
      <td className="px-3 py-3 text-right whitespace-nowrap">{formatUsd(row.marketCap)}</td>
      <td className={"px-3 py-3 text-right " + changeColor(row.change24h)}>{pct(row.change24h)}</td>
      <td className={"px-3 py-3 text-right " + changeColor(row.change7d)}>{pct(row.change7d)}</td>
      <td className={"px-3 py-3 text-right " + changeColor(row.change30d)}>{pct(row.change30d)}</td>
      <td className="px-3 py-3 text-right">{row.rsi7dSparkline == null ? "—" : row.rsi7dSparkline.toFixed(0)}</td>
      <td className="px-3 py-3 text-right">{row.volumeToMarketCap == null ? "—" : (row.volumeToMarketCap * 100).toFixed(1) + "%"}</td>
      <td className={"px-3 py-3 text-right " + changeColor(row.fundingPct)}>{pct(row.fundingPct, 4)}</td>
      <td className="px-3 py-3 text-right whitespace-nowrap">{formatUsd(row.openInterestUsd)}</td>
      <td className="px-3 py-3 text-right">{row.oiToMarketCap == null ? "—" : (row.oiToMarketCap * 100).toFixed(1) + "%"}</td>
      <td className="px-3 py-3 text-right"><Score value={row.shortSqueezeScore} type="short"/></td>
      <td className="px-3 py-3 text-right"><Score value={row.longSqueezeScore} type="long"/></td>
      <td className="px-3 py-3 text-right"><Score value={row.momentumScore} type="momentum"/></td>
    </tr>
  );
}
export default function CryptoTop200() {
  const [filter, setFilter] = useState<RadarFilter>("all");
  const [sort, setSort] = useState<RadarSort>("rank");
  const [search, setSearch] = useState("");
  const result = useQuery<CryptoRadarResponse>({
    queryKey: ["crypto-top200-radar-v1"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("crypto-top200-radar", { body: {} });
      if (error) throw error;
      if (!data || !Array.isArray(data.rows)) throw new Error(data?.error || "Missing radar data");
      return data as CryptoRadarResponse;
    },
    staleTime: 4 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
  const rows = sortAndFilterRadar(result.data?.rows ?? [], search, filter, sort);
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">
      <Seo title="Crypto Top 200 Radar — ScreenerPilot" description="Live market cap ranked crypto radar with funding, open interest, momentum and potential squeeze signals." path="/crypto-top200" />
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <div className="flex items-center gap-2 text-xs text-primary uppercase tracking-widest"><Activity size={15}/> Crypto Discovery</div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-2">Crypto Top 200 Radar</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">Market cap universe, with derivatives and momentum indicators. Potential squeeze scores are screening signals, not confirmed liquidations.</p>
        </div>
        <button onClick={() => result.refetch()} disabled={result.isFetching} className="flex items-center gap-2 border border-border rounded-md px-3 py-2 text-sm hover:bg-secondary disabled:opacity-60">
          <RefreshCw size={14} className={result.isFetching ? "animate-spin" : ""}/> Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="fin-card p-4"><div className="text-xs text-muted-foreground">Universe loaded</div><div className="text-2xl font-semibold mt-1">{result.data?.rows.length ?? "—"} / 200</div></div>
        <div className="fin-card p-4"><div className="text-xs text-muted-foreground">Perpetuals matched</div><div className="text-2xl font-semibold mt-1">{result.data?.derivativesMatched ?? "—"}</div></div>
        <div className="fin-card p-4"><div className="text-xs text-muted-foreground">Short squeeze candidates</div><div className="text-2xl font-semibold mt-1">{result.data ? result.data.rows.filter(r => r.fundingPct != null && r.fundingPct < 0 && (r.shortSqueezeScore ?? 0) >= 45).length : "—"}</div></div>
        <div className="fin-card p-4"><div className="text-xs text-muted-foreground">Last refreshed</div><div className="text-sm font-semibold mt-2">{result.data?.updatedAt ? new Date(result.data.updatedAt).toLocaleString() : "—"}</div></div>
      </div>
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map(option => (
            <button key={option.value} onClick={() => {
              setFilter(option.value);
              if (option.value === "short") setSort("shortSqueezeScore");
              else if (option.value === "long") setSort("longSqueezeScore");
              else if (option.value === "momentum") setSort("momentumScore");
              else if (option.value === "all") setSort("rank");
            }} className={"rounded-md border px-3 py-2 text-xs " + (filter === option.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary")}>{option.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 border border-border rounded-md px-2"><Search size={15} className="text-muted-foreground"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a token" aria-label="Search crypto" className="bg-transparent text-sm p-2 outline-none w-32"/></label>
          <label className="flex items-center gap-1 border border-border rounded-md px-2 text-muted-foreground"><ArrowDownUp size={14}/><select value={sort} onChange={e => setSort(e.target.value as RadarSort)} aria-label="Sort" className="bg-background text-sm p-2 max-w-[150px]">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select></label>
        </div>
      </div>
      {result.isLoading && <div className="fin-card p-10 text-center text-sm text-muted-foreground">Loading live market and derivatives data…</div>}
      {result.isError && <div className="fin-card p-6 text-sm text-red-400">Could not load live radar. The data provider or the edge function may be unavailable. No sample data is shown. {result.error instanceof Error ? result.error.message : ""}</div>}
      {result.data?.warning && <div className="fin-card p-3 text-xs text-orange-400">{result.data.warning}</div>}
      {result.data && <div className="text-xs text-muted-foreground flex gap-2 items-center"><Zap size={14}/> Showing {rows.length} of {result.data.rows.length} tokens · CoinGecko market cap + Bybit linear USDT perpetuals · {result.data.stale ? "Cached stale data" : "Live API snapshot"}</div>}
      {result.data && <div className="fin-card overflow-x-auto">
        <table className="w-full min-w-[1480px] text-xs sm:text-sm tabular-nums">
          <thead className="text-xs text-muted-foreground bg-secondary/50">
            <tr>{["#","Token","Price","Market cap","24h","7d","30d","RSI*","Vol/MC","Funding†","OI USD†","OI/MC†","Short SQ‡","Long SQ‡","Momentum"].map((h,i) =>
              <th key={h} className={"px-3 py-3 whitespace-nowrap " + (i < 2 ? "text-left" : "text-right")}>{h}</th>)}</tr>
          </thead>
          <tbody>{rows.map(r => <RadarRow key={r.id} row={r}/>)}</tbody>
        </table>
        {rows.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No tokens match this filter.</div>}
      </div>}
      <p className="text-xs leading-relaxed text-muted-foreground max-w-5xl">
        * RSI(14) is calculated on the 7-day CoinGecko sparkline samples; it is not daily RSI. † Funding (current exchange interval), OI and OI/market cap reflect one Bybit USDT perpetual snapshot, and may be unavailable for assets with no unique symbol match. OI is total open interest, not short positions. ‡ Short/long squeeze scores (0–100) are uncalibrated screening heuristics using funding direction, OI/market cap, 24h move and volume/market cap; they are not probabilities or predictions of forced liquidations. Missing data stays blank. The universe includes stablecoins/wrapped assets where market-cap-ranked. Not investment advice.
      </p>
    </div>
  );
}
