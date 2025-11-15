import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, X } from "lucide-react";
import { Symbol } from "@/lib/binanceApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSymbolsByType, getAssetType } from "@/lib/binanceApi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WatchlistManagerProps {
  onSymbolSelect: (symbol: Symbol) => void;
}

export default function WatchlistManager({ onSymbolSelect }: WatchlistManagerProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [watchlist, setWatchlist] = useState<Symbol[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<'crypto' | 'stock' | 'index' | 'etf'>('crypto');
  const [loading, setLoading] = useState(true);

  // Load watchlist from Supabase
  useEffect(() => {
    loadWatchlist();
  }, [user]);

  const loadWatchlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_watchlists')
        .select('symbol')
        .eq('user_id', user.id);

      if (error) throw error;

      setWatchlist(data?.map(item => item.symbol as Symbol) || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: Symbol) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your watchlist",
        variant: "destructive",
      });
      return;
    }

    if (watchlist.includes(symbol)) {
      setIsAdding(false);
      return;
    }

    try {
      const assetType = getAssetType(symbol);
      const { error } = await supabase
        .from('user_watchlists')
        .insert({
          user_id: user.id,
          symbol,
          asset_type: assetType,
        });

      if (error) throw error;

      setWatchlist([...watchlist, symbol]);
      setIsAdding(false);
      toast({
        title: "Added to watchlist",
        description: `${symbol} has been added to your watchlist`,
      });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to add symbol to watchlist",
        variant: "destructive",
      });
    }
  };

  const removeFromWatchlist = async (symbol: Symbol) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

      if (error) throw error;

      setWatchlist(watchlist.filter(s => s !== symbol));
      toast({
        title: "Removed from watchlist",
        description: `${symbol} has been removed from your watchlist`,
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove symbol from watchlist",
        variant: "destructive",
      });
    }
  };

  const availableSymbols = getSymbolsByType(selectedAssetType);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
          <h3 className="text-lg font-bold">{t.watchlist}</h3>
          <Badge variant="secondary">{watchlist.length}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 space-y-2 p-3 bg-secondary/50 rounded-lg">
          <Select
            value={selectedAssetType}
            onValueChange={(value: any) => setSelectedAssetType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crypto">{t.cryptocurrencies}</SelectItem>
              <SelectItem value="stock">{t.stocks}</SelectItem>
              <SelectItem value="index">{t.indices}</SelectItem>
              <SelectItem value="etf">{t.etfs}</SelectItem>
            </SelectContent>
          </Select>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableSymbols
              .filter(sym => !watchlist.includes(sym))
              .map((symbol) => (
                <Button
                  key={symbol}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => addToWatchlist(symbol)}
                >
                  {symbol}
                </Button>
              ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Loading watchlist...
        </p>
      ) : watchlist.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t.noSymbolsInWatchlist}
          <br />
          {t.clickToAdd}
        </p>
      ) : (
        <div className="space-y-2">
          {watchlist.map((symbol) => {
            const assetType = getAssetType(symbol);
            return (
              <div
                key={symbol}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <button
                  onClick={() => onSymbolSelect(symbol)}
                  className="flex-1 text-left font-mono font-semibold hover:text-primary transition-colors"
                >
                  {symbol}
                </button>
                <Badge variant="outline" className="text-xs mr-2">
                  {assetType}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromWatchlist(symbol)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
