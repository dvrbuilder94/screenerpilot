import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
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
      toast.success("Briefing generado");
    } catch (e) {
      toast.error("No se pudo generar el briefing");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-transparent border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Briefing diario de AlexIA</CardTitle>
              <p className="text-xs text-muted-foreground">
                {data
                  ? new Date(data.briefing_date + "T00:00:00").toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Sin briefing aún"}
                {!isToday && data && " · desactualizado"}
              </p>
            </div>
          </div>
          {(!isToday || !data) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generando..." : "Generar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!data ? (
          <p className="text-sm text-muted-foreground">
            El briefing diario se genera automáticamente cada mañana a las 08:00 UTC.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium leading-relaxed mb-3">{data.headline}</p>
            {expanded && (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2">
                <ReactMarkdown>{data.content_md}</ReactMarkdown>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 h-7 px-2 text-xs gap-1"
            >
              {expanded ? (
                <>
                  Ocultar <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Leer briefing completo <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
