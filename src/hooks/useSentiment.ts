import { useState, useEffect } from 'react';
import { SentimentData, getSentimentLevel } from '@/types/sentiment';

/**
 * Hook para obtener datos de sentimiento de mercado
 * PLACEHOLDER: Por ahora retorna datos de ejemplo
 * TODO: Integrar con Fear & Greed Index API o similar
 */
export function useSentiment() {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulación de carga de datos
    const fetchSentiment = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Reemplazar con llamada real a API
        // Ejemplo: Fear & Greed Index para crypto
        // const response = await fetch('https://api.alternative.me/fng/');
        // const data = await response.json();
        
        // Datos de ejemplo (simulación)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generar un sentimiento simulado basado en el día
        const dayScore = (new Date().getDate() * 3.33) % 100;
        const score = Math.round(dayScore);
        const level = getSentimentLevel(score);

        const mockSentiment: SentimentData = {
          level,
          score,
          label: level.replace('_', ' ').toUpperCase(),
          description: getDescriptionForLevel(level),
          timestamp: Date.now(),
          source: 'Demo', // Cambiar a 'Fear & Greed Index' cuando se integre
        };

        setSentiment(mockSentiment);
      } catch (err) {
        setError('Error al cargar sentimiento de mercado');
        console.error('Sentiment fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { sentiment, loading, error };
}

function getDescriptionForLevel(level: SentimentData['level']): string {
  const descriptions = {
    extreme_fear: 'Momento de posible acumulación - inversores muy pesimistas',
    fear: 'Cautela en el mercado - oportunidades contrarian',
    neutral: 'Mercado equilibrado sin tendencias de sentimiento claras',
    greed: 'Optimismo alto - considerar tomar ganancias parciales',
    extreme_greed: 'Euforia en máximos - alto riesgo de corrección',
  };
  return descriptions[level];
}
