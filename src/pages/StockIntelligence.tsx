import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  Zap,
  Info,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StockChart from "@/components/stock/StockChart";
import IndicatorPanels from "@/components/stock/IndicatorPanels";
type Timeframe = "daily" | "weekly" | "monthly";

const TIMEFRAMES: { value: Timeframe; label: string; sub: string }[] = [
  { value: "daily", label: "Daily", sub: "1Y" },
  { value: "weekly", label: "Weekly", sub: "5Y" },
  { value: "monthly", label: "Monthly", sub: "10Y" },
];

interface InsightBullet {
  category: string;
  text: string;
}

type Tone = "positive" | "negative" | "neutral";

interface AnalysisResult {
  symbol: string;
  timeframe?: Timeframe;
  companyName: string;
  price: number;
  marketCap: string;
  dayChangePercent?: number;
  verdict: string;
  confidence: number;
  priceAction?: {
    trend: string;
    momentum: string;
    volatility: string;
    support: string;
  };
  summary: string;
  intelligenceInsight?: InsightBullet[];
  indicators?: {
    rsi: { value: number; label: string; tone: Tone };
    macd: { macd: number; signal: number; hist: number; label: string; tone: Tone };
    bollinger: { upper: number; mid: number; lower: number; width: number; label: string; tone: Tone };
    emas: { ema20: number | null; ema50: number | null; ema200: number | null };
    range52w: { high: number; low: number; position: number };
  };
  chart?: {
    timestamps: number[];
    close: number[];
    ema20: (number | null)[];
    ema50: (number | null)[];
    ema200: (number | null)[];
    bbUpper: (number | null)[];
    bbLower: (number | null)[];
    rsi: (number | null)[];
    macd: (number | null)[];
    macdSignal: (number | null)[];
    macdHist: (number | null)[];
  };
}

function ConfidenceBar({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 70) return "bg-emerald-500";
    if (value >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${getColor()} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const config: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
    "Bullish inflection": {
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20 border-emerald-500/30",
    },
    "Fundamentals improving, price lagging": {
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/20 border-blue-500/30",
    },
    "Neutral / mixed signals": {
      icon: AlertCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/20 border-amber-500/30",
    },
    "Deteriorating fundamentals": {
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/20 border-red-500/30",
    },
  };

  const { icon: Icon, color, bg } = config[verdict] || config["Neutral / mixed signals"];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${bg}`}>
      <Icon className={`h-5 w-5 ${color}`} />
      <span className={`font-semibold ${color}`}>{verdict}</span>
    </div>
  );
}

function SignalItem({
  label,
  value,
  type = "neutral",
}: {
  label: string;
  value: string;
  type?: "positive" | "negative" | "neutral";
}) {
  const colorClass =
    type === "positive" ? "text-emerald-400" : type === "negative" ? "text-red-400" : "text-foreground";

  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`font-medium ${colorClass}`}>{value}</span>
    </div>
  );
}

function getSignalType(value: string, positive: string[], negative: string[]): "positive" | "negative" | "neutral" {
  const lower = value.toLowerCase();
  if (positive.some((p) => lower.includes(p))) return "positive";
  if (negative.some((n) => lower.includes(n))) return "negative";
  return "neutral";
}

export default function StockIntelligence() {
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeStock = async (tfOverride?: Timeframe) => {
    if (!symbol.trim()) return;
    const tf = tfOverride ?? timeframe;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-stock", {
        body: { symbol: symbol.trim().toUpperCase(), timeframe: tf },
      });

      if (fnError) {
        throw new Error(fnError.message || "Analysis failed");
      }

      if (data.error) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze stock");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    if (symbol.trim()) analyzeStock(tf);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      analyzeStock();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Stock Intelligence</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl">
          On-demand technical analysis. Enter any US stock ticker to get an instant diagnostic of its current state.
        </p>
      </div>

      {/* Search Input */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter ticker symbol (e.g., SOFI, PLTR, COIN)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="pl-10 text-lg font-medium"
                maxLength={10}
              />
            </div>
            <Button onClick={() => analyzeStock()} disabled={loading || !symbol.trim()} className="px-6">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Timeframe:</span>
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {TIMEFRAMES.map((tf) => {
                const active = timeframe === tf.value;
                return (
                  <button
                    key={tf.value}
                    type="button"
                    disabled={loading}
                    onClick={() => handleTimeframeChange(tf.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {tf.label}
                    <span className="ml-1 text-[10px] opacity-60">{tf.sub}</span>
                  </button>
                );
              })}
            </div>
            {result?.timeframe && (
              <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                Showing: {result.timeframe}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-400">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold">{result.symbol}</h2>
                    <Badge variant="outline" className="text-xs">
                      {result.marketCap}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">{result.companyName}</p>
                  <p className="text-lg font-medium mt-2">${result.price.toFixed(2)}</p>
                </div>
                <VerdictBadge verdict={result.verdict} />
              </div>

              <ConfidenceBar value={result.confidence} />

              <p className="text-muted-foreground mt-4 text-sm bg-muted/30 p-3 rounded-lg">
                <Info className="inline h-4 w-4 mr-1.5 opacity-70" />
                {result.summary}
              </p>
            </CardContent>
          </Card>

          {/* Chart 1Y */}
          {result.chart && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {result.timeframe === "weekly" ? "5-Year Weekly" : result.timeframe === "monthly" ? "10-Year Monthly" : "1-Year Daily"} Price · EMAs · Bollinger Bands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StockChart data={result.chart} height={340} />
              </CardContent>
            </Card>
          )}

          {/* Technical Indicators */}
          {result.indicators && (
            <IndicatorPanels indicators={result.indicators} price={result.price} />
          )}

          {/* Signals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Action */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Price Action
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <SignalItem
                  label="Trend"
                  value={result.priceAction?.trend || "N/A"}
                  type={getSignalType(result.priceAction?.trend || "", ["uptrend", "strong"], ["downtrend"])}
                />
                <SignalItem
                  label="Momentum"
                  value={result.priceAction?.momentum || "N/A"}
                  type={getSignalType(result.priceAction?.momentum || "", ["strong", "highs"], ["weak", "lows"])}
                />
                <SignalItem label="Volume" value={result.priceAction?.volatility || "N/A"} type="neutral" />
                <SignalItem
                  label="Support"
                  value={result.priceAction?.support || "N/A"}
                  type={getSignalType(result.priceAction?.support || "", ["at 50", "above"], ["below", "extended"])}
                />
              </CardContent>
            </Card>

            {/* Intelligence Insight */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Intelligence Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {result.intelligenceInsight ? (
                  result.intelligenceInsight.map((bullet, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-semibold text-foreground">{bullet.category}:</span>{" "}
                      <span className="text-muted-foreground">{bullet.text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Insight generation unavailable
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            Analysis based on most recent quarterly filings. This is not financial advice.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">Enter a ticker to analyze</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Get instant fundamental insights for any US stock</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
