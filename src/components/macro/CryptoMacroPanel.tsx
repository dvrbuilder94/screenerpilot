import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bitcoin, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface CryptoMetric {
  label: string;
  value: string;
  change?: number;
  status?: "bullish" | "bearish" | "neutral";
  notes?: string;
}

export function CryptoMacroPanel() {
  const [metrics, setMetrics] = useState<CryptoMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const out: CryptoMetric[] = [];

      try {
        // CoinGecko global - dominance, market cap
        const globalRes = await fetch("https://api.coingecko.com/api/v3/global");
        if (globalRes.ok) {
          const g = (await globalRes.json()).data;
          out.push({
            label: "Total Market Cap",
            value: "$" + (g.total_market_cap.usd / 1e12).toFixed(2) + "T",
            change: g.market_cap_change_percentage_24h_usd,
            status: g.market_cap_change_percentage_24h_usd > 0 ? "bullish" : "bearish",
            notes: "Total crypto market cap, all assets",
          });
          out.push({
            label: "BTC Dominance",
            value: g.market_cap_percentage.btc.toFixed(2) + "%",
            status: g.market_cap_percentage.btc > 55 ? "bullish" : g.market_cap_percentage.btc < 40 ? "bearish" : "neutral",
            notes: "BTC share of total crypto market cap",
          });
          out.push({
            label: "ETH Dominance",
            value: g.market_cap_percentage.eth.toFixed(2) + "%",
            status: "neutral",
            notes: "ETH share of total crypto market cap",
          });
          out.push({
            label: "24h Volume",
            value: "$" + (g.total_volume.usd / 1e9).toFixed(0) + "B",
            status: "neutral",
            notes: "Total trading volume across exchanges",
          });
          out.push({
            label: "Active Cryptos",
            value: g.active_cryptocurrencies.toLocaleString(),
            status: "neutral",
            notes: "Number of active crypto assets tracked",
          });
        }

        // Fear & Greed Index
        const fgRes = await fetch("https://api.alternative.me/fng/?limit=2");
        if (fgRes.ok) {
          const fg = (await fgRes.json()).data;
          const cur = parseInt(fg[0].value);
          const prev = parseInt(fg[1].value);
          out.push({
            label: "Fear & Greed Index",
            value: cur + " · " + fg[0].value_classification,
            change: cur - prev,
            status: cur >= 60 ? "bullish" : cur <= 40 ? "bearish" : "neutral",
            notes: "Crypto market sentiment (0=fear, 100=greed)",
          });
        }

        // BTC & ETH price + ratios via Binance
        const [btcRes, ethRes] = await Promise.all([
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
          fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT"),
        ]);
        if (btcRes.ok && ethRes.ok) {
          const btc = await btcRes.json();
          const eth = await ethRes.json();
          const btcPrice = parseFloat(btc.lastPrice);
          const ethPrice = parseFloat(eth.lastPrice);
          out.push({
            label: "BTC/USD",
            value: "$" + btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            change: parseFloat(btc.priceChangePercent),
            status: parseFloat(btc.priceChangePercent) > 0 ? "bullish" : "bearish",
            notes: "Bitcoin spot price · 24h change",
          });
          out.push({
            label: "ETH/USD",
            value: "$" + ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            change: parseFloat(eth.priceChangePercent),
            status: parseFloat(eth.priceChangePercent) > 0 ? "bullish" : "bearish",
            notes: "Ethereum spot price · 24h change",
          });
          const ratio = ethPrice / btcPrice;
          out.push({
            label: "ETH/BTC Ratio",
            value: ratio.toFixed(5),
            status: ratio > 0.06 ? "bullish" : ratio < 0.04 ? "bearish" : "neutral",
            notes: "ETH outperforms BTC when rising",
          });
        }

        // Funding rates (BTC perp)
        const fundingRes = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT");
        if (fundingRes.ok) {
          const f = await fundingRes.json();
          const fr = parseFloat(f.lastFundingRate) * 100;
          out.push({
            label: "BTC Funding Rate",
            value: (fr > 0 ? "+" : "") + fr.toFixed(4) + "%",
            status: fr > 0.05 ? "bearish" : fr < -0.02 ? "bullish" : "neutral",
            notes: "Perpetual funding (>+0.05% = overheated longs)",
          });
        }

        // Open Interest
        const oiRes = await fetch("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT");
        const btcOiPriceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        if (oiRes.ok && btcOiPriceRes.ok) {
          const oi = await oiRes.json();
          const p = await btcOiPriceRes.json();
          const oiUsd = parseFloat(oi.openInterest) * parseFloat(p.price);
          out.push({
            label: "BTC Open Interest",
            value: "$" + (oiUsd / 1e9).toFixed(2) + "B",
            status: "neutral",
            notes: "Total open futures positions on Binance",
          });
        }
      } catch (e) {
        console.error("Crypto macro fetch error:", e);
      }

      setMetrics(out);
      setLoading(false);
    }

    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bitcoin className="h-4 w-4" />
        <span>Crypto Market Microstructure & Sentiment</span>
        <span className="ml-auto text-[11px]">Source: CoinGecko + Binance + Alternative.me · Live</span>
      </div>

      <div className="rounded-lg border border-border/40 bg-card/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/40">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left py-2 px-3 font-medium">Metric</th>
              <th className="text-right py-2 px-3 font-medium">Value</th>
              <th className="text-right py-2 px-3 font-medium">24h Δ</th>
              <th className="text-right py-2 px-3 font-medium">Signal</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => (
              <tr key={idx} className="border-b border-border/40 hover:bg-card/40 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-medium text-sm">{m.label}</div>
                  {m.notes && <div className="text-[11px] text-muted-foreground mt-0.5">{m.notes}</div>}
                </td>
                <td className="py-3 px-3 text-right font-mono text-base font-semibold tabular-nums">{m.value}</td>
                <td className="py-3 px-3 text-right">
                  {m.change !== undefined ? (
                    <span className={`inline-flex items-center gap-1 font-mono text-sm tabular-nums ${
                      m.change > 0 ? "text-emerald-400" : m.change < 0 ? "text-rose-400" : "text-muted-foreground"
                    }`}>
                      {m.change > 0 && <TrendingUp className="h-3 w-3" />}
                      {m.change < 0 && <TrendingDown className="h-3 w-3" />}
                      {m.change > 0 ? "+" : ""}{m.change.toFixed(2)}%
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide ${
                    m.status === "bullish" ? "bg-emerald-500/15 text-emerald-400" :
                    m.status === "bearish" ? "bg-rose-500/15 text-rose-400" :
                    "bg-muted/40 text-muted-foreground"
                  }`}>
                    <Activity className="h-2.5 w-2.5" />
                    {m.status === "bullish" ? "Risk-On" : m.status === "bearish" ? "Risk-Off" : "Neutral"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
