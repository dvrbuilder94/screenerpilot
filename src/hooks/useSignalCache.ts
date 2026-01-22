import { useState, useEffect, useCallback } from 'react';
import { TradingSetup } from '@/types/trading';

const CACHE_KEY = 'signal-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  signals: TradingSetup[];
  category: string;
  timestamp: number;
}

interface CacheData {
  [category: string]: CacheEntry;
}

/**
 * Custom hook for caching trading signals in localStorage
 * Provides instant loading from cache while fetching fresh data in background
 */
export function useSignalCache() {
  const [cache, setCache] = useState<CacheData>({});

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheData;
        // Clean expired entries
        const now = Date.now();
        const validEntries: CacheData = {};
        for (const [category, entry] of Object.entries(parsed)) {
          if (now - entry.timestamp < CACHE_TTL) {
            validEntries[category] = entry;
          }
        }
        setCache(validEntries);
      }
    } catch (error) {
      console.warn('Failed to load signal cache:', error);
    }
  }, []);

  // Get cached signals for a category
  const getCachedSignals = useCallback((category: string): TradingSetup[] | null => {
    const entry = cache[category];
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
      return null; // Cache expired
    }
    
    return entry.signals;
  }, [cache]);

  // Check if cache is fresh (less than TTL old)
  const isCacheFresh = useCallback((category: string): boolean => {
    const entry = cache[category];
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
  }, [cache]);

  // Update cache for a category
  const setCachedSignals = useCallback((category: string, signals: TradingSetup[]) => {
    const entry: CacheEntry = {
      signals,
      category,
      timestamp: Date.now(),
    };

    setCache(prev => {
      const newCache = { ...prev, [category]: entry };
      
      // Persist to localStorage
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      } catch (error) {
        console.warn('Failed to persist signal cache:', error);
      }
      
      return newCache;
    });
  }, []);

  // Clear cache for a category or all
  const clearCache = useCallback((category?: string) => {
    if (category) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[category];
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
        } catch (error) {
          console.warn('Failed to clear signal cache:', error);
        }
        return newCache;
      });
    } else {
      setCache({});
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.warn('Failed to clear signal cache:', error);
      }
    }
  }, []);

  // Get cache age in seconds
  const getCacheAge = useCallback((category: string): number | null => {
    const entry = cache[category];
    if (!entry) return null;
    return Math.floor((Date.now() - entry.timestamp) / 1000);
  }, [cache]);

  return {
    getCachedSignals,
    setCachedSignals,
    isCacheFresh,
    clearCache,
    getCacheAge,
  };
}
