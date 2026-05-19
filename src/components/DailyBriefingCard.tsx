import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChevronDown, ChevronUp, Radio } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Briefing {
  briefing_date: string;
  headline: string;
  content_md: string;
  created_at: string;
}

async function fetchLatestBriefing(): Promise<Briefing | null> {
  const { data, error } = await supabase
    .from("daily_briefings")
    .select("briefing_date,headline,content_md,created_at")
    .order("briefing_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const DailyBriefingCard = () => {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["daily-briefing-latest"],
    queryFn: fetchLatestBriefing,
    staleTime: 10 * 60 * 1000,
  });

  const today = new Date().toISOString().split("T")[0];
  const isToday = data?.briefing_date === today;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-daily-briefing");
      if (error) throw error;
      await refetch();
      toast.success("Briefing generated");
    } catch {
      toast.error("Could not generate briefing");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    );
  }

  const dateLabel = data
    ? new Date(data.briefing_date + "T00:00:00")
        .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase()
    : "—";

  const timeLabel = data
    ? new Date(data.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="relative border border-border bg-card font-sans">
      {/* Left accent stripe — Bloomberg orange */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[hsl(28,95%,55%)]" />

      {/* Terminal header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2 pl-5">
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          <span className="flex items-center gap-1.5 text-[hsl(28,95%,55%)] font-semibold">
            <Radio className="h-3 w-3" />
            BEN · MORNING WIRE
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="hidden sm:inline">{dateLabel}</span>
          {timeLabel && (
            <>
              <span className="hidden md:inline text-border">|</span>
              <span className="hidden md:inline">{timeLabel} GMT</span>
            </>
          )}
          {!isToday && data && (
            <span className="hidden md:inline text-amber-500">· STALE</span>
          )}
        </div>

        {(!isToday || !data) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerate}
            disabled={generating}
            className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider gap-1.5 hover:bg-[hsl(28,95%,55%)]/10 hover:text-[hsl(28,95%,55%)]"
          >
            <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
            {generating ? "RUNNING" : "RUN"}
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {!data ? (
          <p className="text-sm text-muted-foreground font-mono">
            Daily wire generates automatically at 08:00 UTC.
          </p>
        ) : (
          <>
            {/* Headline */}
            <div className="flex items-start gap-3">
              <span className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(28,95%,55%)]" />
              <p className="text-[15px] leading-snug font-medium text-foreground">
                {data.headline}
              </p>
            </div>

            {expanded && (
              <div
                className="
                  mt-6 pt-5 border-t border-border
                  font-serif text-[15px] leading-[1.75] tracking-[0.005em] text-foreground/90
                  [font-feature-settings:'liga','kern','onum']
                  prose prose-sm dark:prose-invert max-w-[68ch]
                  prose-headings:font-sans prose-headings:uppercase prose-headings:tracking-[0.22em]
                  prose-headings:text-[10.5px] prose-headings:font-semibold
                  prose-headings:text-[hsl(28,95%,55%)]
                  prose-headings:border-b prose-headings:border-border prose-headings:pb-1.5
                  prose-headings:mt-8 prose-headings:mb-4
                  prose-h1:hidden
                  prose-p:font-serif prose-p:my-3 prose-p:leading-[1.75]
                  prose-strong:font-sans prose-strong:font-semibold prose-strong:text-foreground
                  prose-em:text-foreground/80
                  prose-ul:my-3 prose-ul:pl-0 prose-ul:list-none
                  prose-li:font-serif prose-li:my-1.5 prose-li:leading-[1.7]
                  prose-li:relative prose-li:pl-5
                  prose-li:before:content-['—'] prose-li:before:absolute prose-li:before:left-0
                  prose-li:before:text-[hsl(28,95%,55%)] prose-li:before:font-sans
                  prose-li:marker:hidden
                  prose-table:font-sans prose-table:text-[12px] prose-table:my-4
                  prose-table:border-collapse prose-table:w-full
                  prose-th:font-sans prose-th:uppercase prose-th:tracking-[0.14em]
                  prose-th:text-[10px] prose-th:font-semibold prose-th:text-muted-foreground
                  prose-th:text-left prose-th:border-b prose-th:border-border prose-th:pb-2 prose-th:pr-3
                  prose-td:font-mono prose-td:tabular-nums
                  prose-td:py-2 prose-td:pr-3 prose-td:border-b prose-td:border-border/50
                  prose-hr:my-5 prose-hr:border-border
                  prose-code:font-mono prose-code:text-[hsl(28,95%,55%)] prose-code:bg-transparent
                  prose-code:text-[13px] prose-code:font-medium
                  prose-code:before:content-[''] prose-code:after:content-['']
                  prose-blockquote:border-l-2 prose-blockquote:border-[hsl(28,95%,55%)]
                  prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/80
                "
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content_md}</ReactMarkdown>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-[hsl(28,95%,55%)] transition-colors"
              >
                {expanded ? (
                  <>
                    Collapse <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Open full wire <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground/60">
                AI · GEMINI 2.5
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
