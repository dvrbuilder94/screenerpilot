import { useState, useEffect } from 'react';
import { SentimentData, getSentimentLevel } from '@/types/sentiment';

/**
 * Hook to get market sentiment data
 * PLACEHOLDER: Currently returns demo data
 * TODO: Integrate with Fear & Greed Index API
 */
export function useSentiment() {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // Example: Fear & Greed Index for crypto
        // const response = await fetch('https://api.alternative.me/fng/');
        // const data = await response.json();
        
        // Demo data simulation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate simulated sentiment based on day
        const dayScore = (new Date().getDate() * 3.33) % 100;
        const score = Math.round(dayScore);
        const level = getSentimentLevel(score);

        const mockSentiment: SentimentData = {
          level,
          score,
          label: level.replace('_', ' ').toUpperCase(),
          description: '', // Will be set by component based on language
          timestamp: Date.now(),
          source: 'Fear & Greed Index',
        };

        setSentiment(mockSentiment);
      } catch (err) {
        setError('Error loading market sentiment');
        console.error('Sentiment fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();

    // Update every 5 minutes
    const interval = setInterval(fetchSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { sentiment, loading, error };
}
