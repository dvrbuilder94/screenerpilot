import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Symbol } from "@/lib/binanceApi";
import { supabase } from "@/integrations/supabase/client";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface StockNewsProps {
  symbol: Symbol;
}

export default function StockNews({ symbol }: StockNewsProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('fetch-news', {
        body: { symbol }
      });

      if (functionError) {
        // Check if it's a quota/rate limit error
        const errorMessage = functionError.message || '';
        if (errorMessage.includes('402') || errorMessage.includes('usage_limit') || errorMessage.includes('rate limit')) {
          setError('quota_exceeded');
          return;
        }
        throw functionError;
      }
      
      if (data?.articles && data.articles.length > 0) {
        setArticles(data.articles);
      } else if (data?.error && (data.error.includes('402') || data.error.includes('usage_limit'))) {
        setError('quota_exceeded');
      } else {
        setError('no_news');
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('402') || errorMessage.includes('usage_limit') || errorMessage.includes('rate limit')) {
        setError('quota_exceeded');
      } else {
        setError('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">
          {language === 'en' ? 'Latest News' : 'Últimas Noticias'} - {symbol}
        </h3>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-6 text-muted-foreground">
          {error === 'quota_exceeded' ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                News service temporarily unavailable
              </p>
              <p className="text-xs opacity-70">
                API quota exceeded. News will be available again soon.
              </p>
            </div>
          ) : error === 'no_news' ? (
            <p className="text-sm">
              No news available
            </p>
          ) : (
            <p className="text-sm">
              Unable to load news
            </p>
          )}
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              
              {article.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {article.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {article.source.name}
                </Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">
            {language === 'en' ? 'No news available' : 'No hay noticias disponibles'}
          </p>
        </div>
      )}
    </Card>
  );
}
