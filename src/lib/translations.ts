import { Language } from '@/contexts/LanguageContext';

export const translations = {
  en: {
    // Header
    title: 'ScreenerPilot',
    subtitle: 'Advanced Trading Analysis',
    
    // Market Sentiment
    marketSentiment: 'Market Sentiment',
    extremeFear: 'Extreme Fear',
    fear: 'Fear',
    neutral: 'Neutral',
    greed: 'Greed',
    extremeGreed: 'Extreme Greed',
    sentimentNotAvailable: 'Market sentiment not available',
    sentimentComingSoon: '(Coming soon: Fear & Greed Index)',
    
    // Sentiment descriptions
    extremeFearDesc: 'Possible accumulation moment - investors very pessimistic',
    fearDesc: 'Market caution - contrarian opportunities',
    neutralDesc: 'Balanced market without clear sentiment trends',
    greedDesc: 'High optimism - consider taking partial profits',
    extremeGreedDesc: 'Euphoria at peaks - high risk of correction',
    
    // Trading Style
    tradingStyle: 'Trading Style',
    scalping: 'Scalping',
    swing: 'Swing',
    investment: 'Investment',
    scalpingDesc: 'Fast operations in short timeframes (5m-15m)',
    swingDesc: 'Operations from days to weeks (1h-4h-1d)',
    investmentDesc: 'Positions from weeks to months (1d-1w)',
    
    // Filters
    filters: 'Filters',
    trend: 'Trend',
    signalType: 'Signal Type',
    assetTypeFilter: 'Asset Type',
    minConfidence: 'Min. Confidence',
    all: 'All',
    bullish: 'Bullish',
    bearish: 'Bearish',
    buy: 'Buy',
    sell: 'Sell',
    crypto: 'Crypto',
    forex: 'Forex',
    commodities: 'Commodities',
    
    // Watchlist
    watchlist: 'Watchlist',
    addToWatchlist: 'Add to Watchlist',
    removeFromWatchlist: 'Remove from Watchlist',
    
    // Top Setups
    topSetups: 'Top Setups',
    confidence: 'Confidence',
    signal: 'Signal',
    entry: 'Entry',
    stopLoss: 'Stop Loss',
    
    // Buttons
    refresh: 'Refresh',
    export: 'Export',
    autoRefresh: 'Auto Refresh',
    
    // Indicators
    indicators: 'Indicators',
    ema: 'EMA',
    rsi: 'RSI',
    macd: 'MACD',
    atr: 'ATR',
    volatility: 'Volatility',
    overbought: 'Overbought',
    oversold: 'Oversold',
    
    // Signal warnings
    warningExtremeFearbullish: '💡 Extreme fear sentiment - possible contrarian opportunity',
    warningExtremeGreedbullish: '⚠️ Extreme euphoria - caution with new bullish entries',
    warningExtremeFearBearish: '⚠️ Already extreme fear - beware of shorts at bottom',
    warningExtremeGreedBearish: '💡 Extreme euphoria - good timing for bearish positions',
    
    // Time intervals
    '1m': '1 Minute',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '1h': '1 Hour',
    '4h': '4 Hours',
    '1d': '1 Day',
    '1w': '1 Week',
    
    // Candle Chart
    candleChart: {
      lastCandles: 'Last {n} Candles',
      chartTitle: 'Candlestick Chart (last 100)',
      date: 'Date',
      open: 'Open',
      high: 'High',
      low: 'Low',
      close: 'Close',
      volume: 'Volume',
      change: 'Change %',
    },
    
    // Asset types
    assetType: 'Asset Type',
    
    // General
    loading: 'Loading...',
    error: 'Error',
    noData: 'No data available',
    
    // Enhanced Signal Card
    reasons: 'Reasons',
    warnings: 'Warnings',
    riskManagement: 'Risk Management',
    entryZone: 'Entry Zone',
    targets: 'Targets',
    target: 'Target',
    trendLabel: 'Trend',
    score: 'Score',
    
    // Top Setups
    topSetupsTitle: 'Top Daily Setups',
    topSetupsDesc: 'Best technical opportunities ranked by confidence',
    noSetupsAvailable: 'No setups available. Select a group to analyze.',
    
    // Watchlist
    noSymbolsInWatchlist: 'No symbols in your watchlist.',
    clickToAdd: 'Click + to add.',
    
    // Filter Panel
    allTrends: 'All',
    allSignals: 'All',
    allAssets: 'All',
    stocks: 'Stocks',
    indices: 'Indices',
    etfs: 'ETFs',
    hold: 'Hold',
    strongBuy: 'Strong Buy',
    strongSell: 'Strong Sell',
    
    // Dashboard
    summary: 'Summary',
    totalSetups: 'Total setups',
    filtered: 'Filtered',
    currentPrice: 'Current price',
    macroAnalysis: '🟢 Macro Analysis',
    microAnalysis: '🔵 Micro Analysis',
    chartAndData: 'Chart and Data',
    exportCsv: 'Export CSV',
    loadingInitialData: 'Loading initial data...',
    dataUpdated: 'Data updated successfully',
    errorFetchingData: 'Error fetching data. Please try again.',
    groupDataUpdated: 'Group data updated',
    csvExported: 'CSV exported successfully',
    cryptocurrencies: 'Cryptocurrencies',
    
    // Combined Signal
    strongBuyDesc: 'Macro trend and micro signal bullish. High potential.',
    strongSellDesc: 'Macro trend and micro signal bearish. Avoid long positions.',
    bullishTrendWaitEntry: 'BULLISH TREND - Wait for entry 📊',
    bullishTrendDesc: 'Macro bullish but micro neutral. Look for better entry points.',
    bearishTrendAvoidLongs: 'BEARISH TREND - Avoid longs 📉',
    bearishTrendDesc: 'Macro bearish. Wait for trend change to buy.',
    mixedSignalsPullback: 'MIXED SIGNALS - Pullback in bullish trend 🤔',
    mixedSignalsPullbackDesc: 'Macro bullish but micro bearish. Possible short-term correction.',
    mixedSignalsBounce: 'MIXED SIGNALS - Bounce in bearish trend 🤔',
    mixedSignalsBounceDesc: 'Macro bearish but micro bullish. Possible temporary bounce.',
    neutralNoSignal: 'NEUTRAL - No clear signal 💤',
    neutralNoSignalDesc: 'No clear signals. Wait for trend confirmation.',
    scores: 'Scores',
    macro: 'Macro',
    micro: 'Micro',
    
    // Group Ranking
    loadingGroupData: 'Loading group data...',
    rankingByMicroScore: 'Ranking by micro score (trading)',
    groupSummary: '📈 Group Summary',
    
    // Indicator Panel
    signalLabel: 'Signal',
    bullishTrend: '↑ Bullish',
    bearishTrend: '↓ Bearish',
    momentum: 'Momentum',
    convergence: 'Convergence',
    positive: '↑ Positive',
    negative: '↓ Negative',
    percentage: 'Percentage',
    highVolatility: 'High volatility',
    mediumVolatility: 'Medium volatility',
    lowVolatility: 'Low volatility',
  },
  es: {
    // Header
    title: 'ScreenerPilot',
    subtitle: 'Análisis Avanzado de Trading',
    
    // Market Sentiment
    marketSentiment: 'Sentimiento de Mercado',
    extremeFear: 'Miedo Extremo',
    fear: 'Miedo',
    neutral: 'Neutral',
    greed: 'Codicia',
    extremeGreed: 'Codicia Extrema',
    sentimentNotAvailable: 'Sentimiento de mercado no disponible',
    sentimentComingSoon: '(Próximamente: Fear & Greed Index)',
    
    // Sentiment descriptions
    extremeFearDesc: 'Momento de posible acumulación - inversores muy pesimistas',
    fearDesc: 'Cautela en el mercado - oportunidades contrarian',
    neutralDesc: 'Mercado equilibrado sin tendencias de sentimiento claras',
    greedDesc: 'Optimismo alto - considerar tomar ganancias parciales',
    extremeGreedDesc: 'Euforia en máximos - alto riesgo de corrección',
    
    // Trading Style
    tradingStyle: 'Estilo de Trading',
    scalping: 'Scalping',
    swing: 'Swing',
    investment: 'Inversión',
    scalpingDesc: 'Minutos a horas',
    swingDesc: 'Días a semanas',
    investmentDesc: 'Semanas a meses',
    
    // Filters
    filters: 'Filtros',
    trend: 'Tendencia',
    signalType: 'Tipo de Señal',
    assetTypeFilter: 'Tipo de Activo',
    minConfidence: 'Confianza Mín.',
    all: 'Todos',
    bullish: 'Alcista',
    bearish: 'Bajista',
    buy: 'Compra',
    sell: 'Venta',
    crypto: 'Cripto',
    forex: 'Forex',
    commodities: 'Commodities',
    
    // Watchlist
    watchlist: 'Lista de Seguimiento',
    addToWatchlist: 'Añadir a Lista',
    removeFromWatchlist: 'Quitar de Lista',
    
    // Top Setups
    topSetups: 'Mejores Setups',
    confidence: 'Confianza',
    signal: 'Señal',
    entry: 'Entrada',
    stopLoss: 'Stop Loss',
    
    // Buttons
    refresh: 'Actualizar',
    export: 'Exportar',
    autoRefresh: 'Auto Actualizar',
    
    // Indicators
    indicators: 'Indicadores',
    ema: 'EMA',
    rsi: 'RSI',
    macd: 'MACD',
    atr: 'ATR',
    volatility: 'Volatilidad',
    overbought: 'Sobrecompra',
    oversold: 'Sobreventa',
    
    // Signal warnings
    warningExtremeFearbullish: '💡 Sentimiento de miedo extremo - posible oportunidad contrarian',
    warningExtremeGreedbullish: '⚠️ Euforia extrema - precaución con nuevas entradas alcistas',
    warningExtremeFearBearish: '⚠️ Ya hay miedo extremo - cuidado con shorts en suelo',
    warningExtremeGreedBearish: '💡 Euforia extrema - buen timing para posiciones bajistas',
    
    // Time intervals
    '1m': '1 Minuto',
    '5m': '5 Minutos',
    '15m': '15 Minutos',
    '1h': '1 Hora',
    '4h': '4 Horas',
    '1d': '1 Día',
    '1w': '1 Semana',
    
    // Candle Chart
    candleChart: {
      lastCandles: 'Últimas {n} Velas',
      chartTitle: 'Gráfico de Velas (últimas 100)',
      date: 'Fecha',
      open: 'Apertura',
      high: 'Máximo',
      low: 'Mínimo',
      close: 'Cierre',
      volume: 'Volumen',
      change: 'Cambio %',
    },
    
    // Asset types
    assetType: 'Tipo de Activo',
    
    // General
    loading: 'Cargando...',
    error: 'Error',
    noData: 'No hay datos disponibles',
    
    // Enhanced Signal Card
    reasons: 'Razones',
    warnings: 'Advertencias',
    riskManagement: 'Gestión de Riesgo',
    entryZone: 'Zona de entrada',
    targets: 'Objetivos',
    target: 'Target',
    trendLabel: 'Tendencia',
    score: 'Score',
    
    // Top Setups
    topSetupsTitle: 'Mejores Setups del Día',
    topSetupsDesc: 'Mejores oportunidades técnicas ordenadas por confianza',
    noSetupsAvailable: 'No hay setups disponibles. Selecciona un grupo para analizar.',
    
    // Watchlist
    noSymbolsInWatchlist: 'No hay símbolos en tu watchlist.',
    clickToAdd: 'Haz clic en + para agregar.',
    
    // Filter Panel
    allTrends: 'Todas',
    allSignals: 'Todas',
    allAssets: 'Todos',
    stocks: 'Acciones',
    indices: 'Índices',
    etfs: 'ETFs',
    hold: 'Hold',
    strongBuy: 'Strong Buy',
    strongSell: 'Strong Sell',
    
    // Dashboard
    summary: 'Resumen',
    totalSetups: 'Total setups',
    filtered: 'Filtrados',
    currentPrice: 'Precio actual',
    macroAnalysis: '🟢 Análisis Macro',
    microAnalysis: '🔵 Análisis Micro',
    chartAndData: 'Gráfico y Datos',
    exportCsv: 'Exportar CSV',
    loadingInitialData: 'Cargando datos iniciales...',
    dataUpdated: 'Datos actualizados correctamente',
    errorFetchingData: 'Error al obtener datos. Intenta nuevamente.',
    groupDataUpdated: 'Datos del grupo actualizados',
    csvExported: 'CSV exportado correctamente',
    cryptocurrencies: 'Criptomonedas',
    
    // Combined Signal
    strongBuyDesc: 'Tendencia macro y señal micro alcistas. Alto potencial.',
    strongSellDesc: 'Tendencia macro y señal micro bajistas. Evitar posiciones largas.',
    bullishTrendWaitEntry: 'TENDENCIA ALCISTA - Esperar entrada 📊',
    bullishTrendDesc: 'Macro alcista pero micro neutral. Buscar mejores puntos de entrada.',
    bearishTrendAvoidLongs: 'TENDENCIA BAJISTA - Evitar largos 📉',
    bearishTrendDesc: 'Macro bajista. Esperar cambio de tendencia para comprar.',
    mixedSignalsPullback: 'SEÑALES MIXTAS - Retroceso en tendencia alcista 🤔',
    mixedSignalsPullbackDesc: 'Macro alcista pero micro bajista. Posible corrección a corto plazo.',
    mixedSignalsBounce: 'SEÑALES MIXTAS - Rebote en tendencia bajista 🤔',
    mixedSignalsBounceDesc: 'Macro bajista pero micro alcista. Posible rebote temporal.',
    neutralNoSignal: 'NEUTRAL - Sin señal clara 💤',
    neutralNoSignalDesc: 'Sin señales claras. Esperar confirmación de tendencia.',
    scores: 'Scores',
    macro: 'Macro',
    micro: 'Micro',
    
    // Group Ranking
    loadingGroupData: 'Cargando datos del grupo...',
    rankingByMicroScore: 'Ranking por score micro (operativa)',
    groupSummary: '📈 Resumen del Grupo',
    
    // Indicator Panel
    signalLabel: 'Señal',
    bullishTrend: '↑ Alcista',
    bearishTrend: '↓ Bajista',
    momentum: 'Momentum',
    convergence: 'Convergencia',
    positive: '↑ Positivo',
    negative: '↓ Negativo',
    percentage: 'Porcentaje',
    highVolatility: 'Alta volatilidad',
    mediumVolatility: 'Volatilidad media',
    lowVolatility: 'Baja volatilidad',
  },
};

export function t(key: string, language: Language = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

export function useTranslation() {
  return { t, translations };
}
