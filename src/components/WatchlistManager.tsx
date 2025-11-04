import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, X } from "lucide-react";
import { Symbol } from "@/lib/binanceApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSymbolsByType, getAssetType } from "@/lib/binanceApi";

interface WatchlistManagerProps {
  onSymbolSelect: (symbol: Symbol) => void;
}

export default function WatchlistManager({ onSymbolSelect }: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<Symbol[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<'crypto' | 'stock' | 'index' | 'etf'>('crypto');

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trading-watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage
  const saveWatchlist = (newWatchlist: Symbol[]) => {
    setWatchlist(newWatchlist);
    localStorage.setItem('trading-watchlist', JSON.stringify(newWatchlist));
  };

  const addToWatchlist = (symbol: Symbol) => {
    if (!watchlist.includes(symbol)) {
      saveWatchlist([...watchlist, symbol]);
    }
    setIsAdding(false);
  };

  const removeFromWatchlist = (symbol: Symbol) => {
    saveWatchlist(watchlist.filter(s => s !== symbol));
  };

  const availableSymbols = getSymbolsByType(selectedAssetType);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
          <h3 className="text-lg font-bold">Watchlist</h3>
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
              <SelectItem value="crypto">Criptomonedas</SelectItem>
              <SelectItem value="stock">Acciones</SelectItem>
              <SelectItem value="index">Índices</SelectItem>
              <SelectItem value="etf">ETFs</SelectItem>
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

      {watchlist.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay símbolos en tu watchlist.
          <br />
          Haz clic en + para agregar.
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
