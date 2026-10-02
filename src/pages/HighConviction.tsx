import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Gauge,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { rsi } from "@/lib/indicators";
import {
  HIGH_CONVICTION_BUCKET_WEIGHTS,
  HIGH_CONVICTION_HOLDINGS,
  HIGH_CONVICTION_SNAPSHOT_DATE,
  HIGH_CONVICTION_TOTAL,
  HIGH_CONVICTION_WEIGHTS,
} from "@/lib/highConviction";

type Candle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

type Period = "1M" | "3M" | "6M" | "1Y";

const PERIOD_DAYS: Record<Period, number> = {
  "1M": 22,
  "3M": 66,
  "6M": 132,
  "1Y": 252,
};

const SYMBOLS = [...HIGH_CONVICTION_HOLDINGS.map((holding) => holding.symbol), "SPY"];

function dayKey(candle: Candle) {
  return new Date(candle.openTime).toISOString().slice(0, 10);
}

function pct(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function last<T>(values: T[]) {
  return values[values.length - 1];
}

function nearestCloseAtOrBefore(candles: Candle[], date: string) {
  let match: Candle | undefined;
  for (const candle of candles) {
    if (dayKey(candle) <= date) match = candle;
    else break;
  }
  return match?.close;
}

function dailyReturns(values: number[]) {
  const result: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) result.push(values[i] / values[i - 1] - 1);
  }
  return result;
}

function annualizedVolatility(values: number[]) {
  const returns = dailyReturns(values);
  if (returns.length < 2) return NaN;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function beta(portfolio: number[], benchmark: number[]) {
  const p = dailyReturns(portfolio);
  const b = dailyReturns(benchmark);
  const n = Math.min(p.length, b.length);
  if (n < 2) return NaN;

  const pp = p.slice(-n);
  const bb = b.slice(-n);
  const meanP = pp.reduce((sum, value) => sum + value, 0) / n;
  const meanB = bb.reduce((sum, value) => sum + value, 0) / n;
  let covariance = 0;
  let varianceB = 0;

  for (let i = 0; i < n; i++) {
    covariance += (pp[i] - meanP) * (bb[i] - meanB);
    varianceB += Math.pow(bb[i] - meanB, 2);
  }

  return varianceB === 0 ? NaN : covariance / varianceB;
}

function maxDrawdown(values: number[]) {
  if (!values.length) return NaN;
  let peak = values[0];
  let worst = 0;
  for (const value of values) {
    peak = Math.max(peak, value);
    worst = Math.min(worst, value / peak - 1);
  }
  return worst * 100;
}

async function fetchDaily(symbol: string): Promise<Candle[]> {
  const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
    body: { symbol, interval: "1d" },
  });
  if (error) throw error;
  return (data?.candles ?? []).sort((a: Candle, b: Candle) => a.openTime - b.openTime);
}

function buildPortfolioMetrics(data: Record<string, Candle[]>, period: Period) {
  const spyAll = data.SPY ?? [];
  if (spyAll.length < 15) return null;

  const spyWindow = spyAll.slice(-PERIOD_DAYS[period]);
  if (spyWindow.length < 2) return null;

  const firstDate = dayKey(spyWindow[0]);
  const lastDate = dayKey(last(spyWindow));
  const firstSpy = spyWindow[0].close;

  const priceMaps = Object.fromEntries(
    HIGH_CONVICTION_HOLDINGS.map((holding) => [
      holding.symbol,
      new Map((data[holding.symbol] ?? []).map((candle) => [dayKey(candle), candle.close])),
    ]),
  ) as Record<string, Map<string, number>>;

  const models = HIGH_CONVICTION_HOLDINGS.map((holding) => {
    const candles = data[holding.symbol] ?? [];
    const snapshotPrice = nearestCloseAtOrBefore(candles, HIGH_CONVICTION_SNAPSHOT_DATE);
    const firstPrice = priceMaps[holding.symbol]?.get(firstDate);
    const lastPrice = priceMaps[holding.symbol]?.get(lastDate);

    if (!snapshotPrice || !firstPrice || !lastPrice) return null;
    return {
      ...holding,
      shares: holding.snapshotValue / snapshotPrice,
    };
  }).filter(Boolean) as Array<
    (typeof HIGH_CONVICTION_HOLDINGS)[number] & { shares: number }
  >;

  const coverage =
    models.reduce((sum, holding) => sum + holding.snapshotValue, 0) /
    HIGH_CONVICTION_TOTAL;

  const raw = spyWindow
    .map((spyCandle) => {
      const date = dayKey(spyCandle);
      const available = models.every((holding) =>
        priceMaps[holding.symbol]?.has(date),
      );
      if (!available) return null;

      const portfolioValue = models.reduce(
        (sum, holding) =>
          sum + holding.shares * (priceMaps[holding.symbol].get(date) ?? 0),
        0,
      );

      const exOrbs = models.filter((holding) => holding.symbol !== "ORBS");
      const exOrbsValue = exOrbs.reduce(
        (sum, holding) =>
          sum + holding.shares * (priceMaps[holding.symbol].get(date) ?? 0),
        0,
      );

      return {
        date,
        portfolioValue,
        exOrbsValue,
        spy: spyCandle.close,
      };
    })
    .filter(Boolean) as Array<{
      date: string;
      portfolioValue: number;
      exOrbsValue: number;
      spy: number;
    }>;

  if (raw.length < 2) return null;

  const basePortfolio = raw[0].portfolioValue;
  const baseExOrbs = raw[0].exOrbsValue;
  const series = raw.map((point) => ({
    date: point.date.slice(5),
    portfolio: (point.portfolioValue / basePortfolio) * 100,
    exOrbs: baseExOrbs > 0 ? (point.exOrbsValue / baseExOrbs) * 100 : 100,
    spy: (point.spy / firstSpy) * 100,
  }));

  const portfolioValues = series.map((point) => point.portfolio);
  const spyValues = series.map((point) => point.spy);
  const exOrbsValues = series.map((point) => point.exOrbs);
  const portfolioRsiValues = rsi(portfolioValues, 14);
  const spyRsiValues = rsi(spyValues, 14);

  const portfolioReturn = last(portfolioValues) - 100;
  const spyReturn = last(spyValues) - 100;

  return {
    series,
    coverage,
    portfolioReturn,
    spyReturn,
    alpha: portfolioReturn - spyReturn,
    exOrbsReturn: last(exOrbsValues) - 100,
    portfolioRsi: portfolioRsiValues.length ? last(portfolioRsiValues) : NaN,
    spyRsi: spyRsiValues.length ? last(spyRsiValues) : NaN,
    volatility: annualizedVolatility(portfolioValues),
    beta: beta(portfolioValues, spyValues),
    maxDrawdown: maxDrawdown(portfolioValues),
  };
}

function returnOver(candles: Candle[], tradingDays: number) {
  if (candles.length < tradingDays + 1) return NaN;
  const start = candles[candles.length - tradingDays - 1].close;
  const end = last(candles).close;
  return (end / start - 1) * 100;
}

export default function HighConviction() {
  const [period, setPeriod] = useState<Period>("3M");

  const queries = useQueries({
    queries: SYMBOLS.map((symbol) => ({
      queryKey: ["high-conviction", symbol],
      queryFn: () => fetchDaily(symbol),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  const data = useMemo(
    () =>
      Object.fromEntries(
        SYMBOLS.map((symbol, index) => [symbol, queries[index]?.data ?? []]),
      ) as Record<string, Candle[]>,
    [queries],
  );

  const metrics = useMemo(() => buildPortfolioMetrics(data, period), [data, period]);
  const loading = queries.some((query) => query.isLoading);
  const failedSymbols = SYMBOLS.filter((_, index) => queries[index]?.isError);
  const spy3m = returnOver(data.SPY ?? [], 66);

  const rows = useMemo(
    () =>
      HIGH_CONVICTION_HOLDINGS.map((holding) => {
        const candles = data[holding.symbol] ?? [];
        const closes = candles.map((candle) => candle.close);
        const rsiValues = rsi(closes, 14);
        const rsi14 = rsiValues.length ? last(rsiValues) : NaN;
        const oneDay =
          candles.length >= 2
            ? (last(candles).close / candles[candles.length - 2].close - 1) * 100
            : NaN;
        const threeMonth = returnOver(candles, 66);
        const relative3m =
          Number.isFinite(threeMonth) && Number.isFinite(spy3m)
            ? threeMonth - spy3m
            : NaN;

        return {
          ...holding,
          weight: HIGH_CONVICTION_WEIGHTS[holding.symbol] * 100,
          rsi14,
          oneDay,
          relative3m,
          contribution: Number.isFinite(oneDay)
            ? HIGH_CONVICTION_WEIGHTS[holding.symbol] * oneDay
            : NaN,
        };
      }).sort((a, b) => b.snapshotValue - a.snapshotValue),
    [data, spy3m],
  );

  const sortedWeights = [...rows].sort((a, b) => b.weight - a.weight);
  const top3 = sortedWeights.slice(0, 3).reduce((sum, row) => sum + row.weight, 0);
  const concentration =
    rows.reduce((sum, row) => sum + Math.pow(row.weight / 100, 2), 0) * 10000;

  return (
    <div className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">High Conviction OS</Badge>
            <Badge variant="secondary">GitHub-first</Badge>
            <Badge variant="outline">Snapshot {HIGH_CONVICTION_SNAPSHOT_DATE}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Portfolio Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Current-holdings backtest versus SPY, portfolio-level RSI, concentration,
            attribution and thesis buckets. Built from the portfolio snapshot, not from
            broker transaction history.
          </p>
        </div>

        <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <TabsList>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="3M">3M</TabsTrigger>
            <TabsTrigger value="6M">6M</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Snapshot value</div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {money(HIGH_CONVICTION_TOTAL)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">12 positions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Portfolio {period}</div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {metrics ? pct(metrics.portfolioReturn) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">current holdings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">S&P 500 {period}</div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {metrics ? pct(metrics.spyReturn) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">SPY benchmark</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Excess return</div>
            <div
              className={`text-xl sm:text-2xl font-semibold mt-1 ${
                metrics && metrics.alpha >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {metrics ? pct(metrics.alpha) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">portfolio − SPY</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Portfolio RSI(14)</div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {metrics && Number.isFinite(metrics.portfolioRsi)
                ? metrics.portfolioRsi.toFixed(1)
                : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              SPY {metrics && Number.isFinite(metrics.spyRsi) ? metrics.spyRsi.toFixed(1) : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Ex-ORBS {period}</div>
            <div className="text-xl sm:text-2xl font-semibold mt-1">
              {metrics ? pct(metrics.exOrbsReturn) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">selection breadth check</div>
          </CardContent>
        </Card>
      </div>

      {failedSymbols.length > 0 && (
        <Card className="border-amber-500/40">
          <CardContent className="p-4 flex gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
            <div>
              Price history failed for: <strong>{failedSymbols.join(", ")}</strong>.
              Metrics automatically use the symbols with sufficient history; check data
              coverage before interpreting the result.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Current holdings vs S&P 500
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[330px]">
              {metrics ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={28} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      domain={["auto", "auto"]}
                      tickFormatter={(value) => value.toFixed(0)}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value.toFixed(2),
                        name === "portfolio"
                          ? "Portfolio"
                          : name === "exOrbs"
                            ? "Ex-ORBS"
                            : "SPY",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="portfolio"
                      name="Portfolio"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.4}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="spy"
                      name="SPY"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="exOrbs"
                      name="Ex-ORBS"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={1.2}
                      strokeDasharray="5 5"
                      dot={false}
                      opacity={0.65}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  {loading ? "Building portfolio history…" : "Not enough price history."}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Coverage for this window:{" "}
              <strong className="text-foreground">
                {metrics ? `${(metrics.coverage * 100).toFixed(1)}%` : "—"}
              </strong>
              . Historical returns reconstruct the current composition using shares
              inferred from the {HIGH_CONVICTION_SNAPSHOT_DATE} snapshot. They are not
              your actual time-weighted broker return before that date.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Risk map
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Top position</div>
                <div className="text-lg font-semibold">{sortedWeights[0]?.weight.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{sortedWeights[0]?.symbol}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Top 3</div>
                <div className="text-lg font-semibold">{top3.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">concentration</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Beta vs SPY</div>
                <div className="text-lg font-semibold">
                  {metrics && Number.isFinite(metrics.beta) ? metrics.beta.toFixed(2) : "—"}
                </div>
                <div className="text-xs text-muted-foreground">{period}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Max drawdown</div>
                <div className="text-lg font-semibold">
                  {metrics ? pct(metrics.maxDrawdown) : "—"}
                </div>
                <div className="text-xs text-muted-foreground">{period}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ann. volatility</div>
                <div className="text-lg font-semibold">
                  {metrics ? `${metrics.volatility.toFixed(1)}%` : "—"}
                </div>
                <div className="text-xs text-muted-foreground">realized estimate</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">HHI</div>
                <div className="text-lg font-semibold">{concentration.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">position weights</div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(HIGH_CONVICTION_BUCKET_WEIGHTS)
                .sort((a, b) => b[1] - a[1])
                .map(([bucket, weight]) => (
                  <div key={bucket}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{bucket}</span>
                      <span className="text-muted-foreground">{(weight * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-foreground/70 rounded-full"
                        style={{ width: `${Math.max(2, weight * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Holdings: momentum, attribution and relative strength
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-y border-border bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Asset</th>
                <th className="text-right px-3">Weight</th>
                <th className="text-right px-3">Snapshot</th>
                <th className="text-right px-3">1D</th>
                <th className="text-right px-3">1D contribution</th>
                <th className="text-right px-3">RSI(14)</th>
                <th className="text-right px-3">3M vs SPY</th>
                <th className="text-left px-4">Theme</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.symbol} className="border-b border-border/70 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link to={`/asset/${row.symbol}`} className="font-semibold hover:underline">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="text-right px-3">{row.weight.toFixed(1)}%</td>
                  <td className="text-right px-3">{money(row.snapshotValue)}</td>
                  <td
                    className={`text-right px-3 ${
                      row.oneDay >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {pct(row.oneDay)}
                  </td>
                  <td
                    className={`text-right px-3 ${
                      row.contribution >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {Number.isFinite(row.contribution)
                      ? `${row.contribution >= 0 ? "+" : ""}${row.contribution.toFixed(2)} pp`
                      : "—"}
                  </td>
                  <td className="text-right px-3">
                    {Number.isFinite(row.rsi14) ? row.rsi14.toFixed(1) : "—"}
                  </td>
                  <td
                    className={`text-right px-3 ${
                      row.relative3m >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {pct(row.relative3m)}
                  </td>
                  <td className="px-4 text-xs text-muted-foreground">{row.bucket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 font-medium">
              <Activity className="h-4 w-4" />
              Portfolio RSI
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              RSI is calculated on the reconstructed portfolio NAV, not by averaging
              each stock's RSI. This preserves position sizing in the momentum signal.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 font-medium">
              <BarChart3 className="h-4 w-4" />
              Ex-ORBS diagnostic
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ORBS is more than half of the snapshot, so the ex-ORBS line isolates
              whether the rest of the stock-selection process is adding or losing ground.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 font-medium">
              <Target className="h-4 w-4" />
              Next data upgrade
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Import broker transactions or cost basis to replace the current-holdings
              backtest with actual money-weighted and time-weighted performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
