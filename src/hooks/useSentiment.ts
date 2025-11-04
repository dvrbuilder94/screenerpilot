import { useState, useEffect } from 'react';
import { SentimentData, getSentimentLevel } from '@/types/sentiment';

/**
 * Hook to get market sentiment data from Fear & Greed Index API
 * Data source: https://api.alternative.me/fng/
 * Updates every 5 minutes with fallback to simulated data if API fails
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
        // Fetch real Fear & Greed Index data from alternative.me API
        const response = await fetch('https://api.alternative.me/fng/?limit=1');
        const data = await response.json();
        
        if (data && data.data && data.data[0]) {
          const fngData = data.data[0];
          const score = parseInt(fngData.value);
          const level = getSentimentLevel(score);

          const realSentiment: SentimentData = {
            level,
            score,
            label: level.replace('_', ' ').toUpperCase(),
            description: '', // Will be set by component based on language
            timestamp: parseInt(fngData.timestamp) * 1000, // Convert to milliseconds
            source: 'Fear & Greed Index',
          };

          setSentiment(realSentiment);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (err) {
        console.error('Sentiment fetch error:', err);
        setError('Error loading market sentiment');
        
        // Fallback to simulated data if API fails
        const now = new Date();
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        const hourFactor = now.getHours() / 24;
        const score = Math.round(50 + (Math.sin(dayOfYear / 7) * 30) + (Math.sin(hourFactor * Math.PI) * 20));
        const level = getSentimentLevel(score);

        const fallbackSentiment: SentimentData = {
          level,
          score,
          label: level.replace('_', ' ').toUpperCase(),
          description: '',
          timestamp: Date.now(),
          source: 'Simulated Data',
        };

        setSentiment(fallbackSentiment);
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
