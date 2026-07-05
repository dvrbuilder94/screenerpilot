import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  symbol: string;
  article_date: string;
  company_name: string | null;
  headline: string;
  content_md: string;
  squeeze_score: number | null;
  price: number | null;
  change_5d: number | null;
  volume_ratio: number | null;
  market_cap_label: string | null;
}

export default function StockArticle() {
  const { symbol = "" } = useParams<{ symbol: string }>();
  const sym = symbol.toUpperCase();

  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("stock_articles")
      .select("symbol,article_date,company_name,headline,content_md,squeeze_score,price,change_5d,volume_ratio,market_cap_label")
      .eq("symbol", sym)
      .order("article_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    setArticle(data ?? null);
  };

  useEffect(() => {
    setArticle(undefined);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sym]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    const { data, error } = await supabase.functions.invoke("generate-stock-articles", { body: { symbol: sym } });
    setGenerating(false);
    if (error || data?.error) {
      setGenError(data?.error || "Could not generate this analysis right now.");
      return;
    }
    await load();
  };

  const loading = article === undefined;

  return (
    <div className="landing-light min-h-screen bg-background text-foreground">
      <Seo
        title={
          article
            ? `${article.symbol} Squeeze Score ${article.squeeze_score ?? "—"} — Technical Analysis | ScreenerPilot`
            : `${sym} Squeeze Radar Analysis | ScreenerPilot`
        }
        description={
          article
            ? article.headline
            : `Technical squeeze setup analysis for ${sym}: volume, RSI, drawdown and momentum read.`
        }
        path={`/squeeze-radar/${sym}`}
      />

      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex h-16 items-center justify-between px-5 gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="h-9 text-[13px] hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="h-9 text-[13px]">
              <Link to="/signup">Start free trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <Link to="/squeeze-radar" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Squeeze Screener
        </Link>

        {loading ? (
          <div className="flex items-center gap-2 py-16 justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : article ? (
          <>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-foreground">
                {article.symbol}
              </h1>
              {article.company_name && (
                <span className="text-[15px] text-muted-foreground">{article.company_name}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <StatPill label="Squeeze Score" value={article.squeeze_score ?? "—"} />
              {article.price != null && <StatPill label="Price" value={`$${article.price.toFixed(2)}`} />}
              {article.change_5d != null && (
                <StatPill
                  label="5d"
                  value={`${article.change_5d >= 0 ? "+" : ""}${article.change_5d.toFixed(1)}%`}
                  tone={article.change_5d >= 0 ? "positive" : "negative"}
                />
              )}
              {article.volume_ratio != null && <StatPill label="Vol×" value={`${article.volume_ratio.toFixed(1)}x`} />}
              {article.market_cap_label && <StatPill label="Mkt Cap" value={article.market_cap_label} />}
            </div>

            <p className="text-[17px] font-medium text-foreground leading-snug mb-6">{article.headline}</p>

            <div
              className="
                prose prose-sm dark:prose-invert max-w-none
                prose-p:my-3 prose-p:leading-[1.8] prose-p:text-foreground/85
                prose-strong:font-bold prose-strong:text-foreground
              "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content_md}</ReactMarkdown>
            </div>

            <p className="text-[11px] text-muted-foreground mt-6">
              Analysis date: {new Date(article.article_date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · AI · Gemini 2.5
            </p>

            <div className="mt-10 fin-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-semibold text-foreground">Want the full breakdown?</h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground max-w-md">
                  Stock Intelligence gives you AI-powered analysis, quant fund holdings and the full
                  squeeze radar — on demand, for any symbol.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="h-11 px-5 text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:opacity-90 border-0 flex-shrink-0"
              >
                <Link to="/signup">
                  Start free trial <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="fin-card p-8 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <h1 className="text-[20px] font-semibold text-foreground">{sym}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              No analysis generated yet for {sym} today. If it's currently on the Squeeze Radar,
              you can generate one now.
            </p>
            {genError && <p className="text-xs text-red-600 mt-3">{genError}</p>}
            <Button onClick={handleGenerate} disabled={generating} className="mt-5">
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                "Generate analysis"
              )}
            </Button>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-5 py-8 border-t border-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} ScreenerPilot</span>
          <span className="font-mono-tabular uppercase tracking-[0.12em]">Read-only · no advice</span>
        </div>
      </footer>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string | number; tone?: "positive" | "negative" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "positive" && "text-emerald-600",
          tone === "negative" && "text-red-600",
          !tone && "text-foreground"
        )}
      >
        {value}
      </span>
    </span>
  );
}
