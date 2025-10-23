# Crypto & Stock Multi-Timeframe Dashboard

Dashboard profesional de análisis técnico para criptomonedas y acciones con análisis multi-timeframe y múltiples indicadores técnicos.

## 🚀 Características

- **Multi-Asset Support**: Analiza criptomonedas, acciones, índices y ETFs
- **Magnificent Seven**: Análisis grupal de las 7 magníficas (AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA)
- **Análisis Multi-Timeframe**: Compara tendencia macro (1D/1W) con señales operativas micro (1H/4H)
- **Indicadores Técnicos**:
  - EMA 20 / EMA 50 (Exponential Moving Averages)
  - RSI 14 (Relative Strength Index)
  - MACD (12, 26, 9) (Moving Average Convergence Divergence)
  - ATR 14 (Average True Range)
  - Supertrend (10, 3)
- **Sistema de Scoring Inteligente**: Combina todos los indicadores para generar señales BUY/SELL/HOLD
- **Análisis Combinado**: Identifica cuando macro y micro están alineados para señales fuertes
- **Ranking de Grupos**: Vista de ranking para analizar múltiples símbolos simultáneamente
- **Visualización Avanzada**: Gráficos de velas con EMAs, cards de KPIs y tabla detallada
- **Auto-refresh**: Actualización automática cada 60 segundos
- **Exportar CSV**: Descarga últimas 200 velas con todos los indicadores
- **Persistencia**: Guarda preferencias en localStorage

## 📊 Activos Disponibles

### Criptomonedas (Binance)
- BTCUSDT (Bitcoin)
- ETHUSDT (Ethereum)

### Acciones (Yahoo Finance)
**Magnificent Seven:**
- AAPL (Apple)
- MSFT (Microsoft)
- NVDA (NVIDIA)
- AMZN (Amazon)
- GOOGL (Google/Alphabet)
- META (Meta/Facebook)
- TSLA (Tesla)

**Otras acciones destacadas:**
BMNR, FIGS, ADBE, FIG, BRK-B, AVGO, LLY, V, UNH, XOM, WMT, JNJ, ORCL, COST, MA, PG

### Índices
- ^GSPC (S&P 500)
- ^RUT (Russell 2000)
- ^NDX (Nasdaq 100)

### ETFs
- SPY (S&P 500 ETF)
- IWM (Russell 2000 ETF)
- QQQ (Nasdaq 100 ETF)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

## 📊 Fuentes de Datos

### Criptomonedas
API pública de Binance (sin necesidad de API key):
```
https://api.binance.com/api/v3/klines
```

### Acciones, Índices y ETFs
API pública de Yahoo Finance:
```
https://query1.finance.yahoo.com/v8/finance/chart
```

**Intervalos disponibles:**
- 1h (1 hora)
- 4h (4 horas)
- 1d (1 día)
- 1w (1 semana)

## 📈 Interpretación de Indicadores

### EMA (Exponential Moving Average)
- **EMA 20 > EMA 50**: Tendencia alcista (+2 puntos)
- **EMA 20 < EMA 50**: Tendencia bajista (-2 puntos)

### RSI (Relative Strength Index)
- **RSI < 40**: Momentum alcista (+1 punto)
- **RSI > 60**: Momentum bajista (-1 punto)
- **RSI < 30**: Zona de sobreventa
- **RSI > 70**: Zona de sobrecompra

### MACD (Moving Average Convergence Divergence)
- **MACD > Signal**: Momentum positivo (+1 punto)
- **MACD < Signal**: Momentum negativo (-1 punto)

### ATR (Average True Range)
- Mide la volatilidad del activo
- ATR alto = mayor volatilidad = stops más amplios

### Supertrend
- **Verde (uptrend)**: Señal alcista (+1 punto)
- **Rojo (downtrend)**: Señal bajista (-1 punto)

## 🎯 Sistema de Señales

**Score Total**: Suma de todos los indicadores (rango: -5 a +5)

- **Score ≥ +3**: 🟢 **BUY** - Señal de compra
- **Score ≤ -3**: 🔴 **SELL** - Señal de venta
- **-3 < Score < +3**: 🟡 **HOLD** - Mantener / esperar

**Señales Combinadas:**
- **Strong BUY 🔥**: Macro BUY + Micro BUY
- **Strong SELL ⚠️**: Macro SELL + Micro SELL
- **Mixed 🤔**: Divergencia entre macro y micro

## 🎯 Análisis de Grupos

### Magnificent Seven
El modo de grupo permite analizar las 7 magníficas simultáneamente:

1. **Ranking por Score**: Ordenadas de mejor a peor señal operativa (micro)
2. **Resumen Macro**: Tendencia general de cada acción
3. **Resumen del Grupo**: Contadores de BUY/HOLD/SELL

**Cómo usar:**
1. Seleccionar "Stocks" como tipo de activo
2. Elegir "Magnificent Seven" en el selector de grupos
3. Ver el ranking y análisis comparativo

Los datos se actualizan para todos los símbolos del grupo simultáneamente.

## ⚠️ Disclaimer

**IMPORTANTE**: Este dashboard es una herramienta de análisis educativa y no ejecuta órdenes de trading. Las señales generadas NO constituyen asesoramiento financiero.

- No se ejecutan operaciones automáticas
- Los datos son informativos únicamente
- Siempre realiza tu propia investigación (DYOR)
- El trading de criptomonedas implica riesgos significativos
- Solo invierte lo que puedas permitirte perder

## 🏗️ Tecnologías

- **React 18** con TypeScript
- **Vite** para build ultrarrápido
- **Tailwind CSS** para diseño moderno
- **shadcn/ui** componentes profesionales
- **TanStack Query** para gestión de datos
- **Binance API** datos crypto en tiempo real
- **Yahoo Finance API** datos de acciones e índices

## 🔧 Configuración de Presets

Los símbolos disponibles se configuran en `src/config/presets.json`:

```json
{
  "crypto": ["BTCUSDT", "ETHUSDT"],
  "groups": {
    "magnificent_seven": ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"]
  },
  "stocks": [...],
  "indices": ["^GSPC", "^RUT", "^NDX"],
  "etf_alt": ["SPY", "IWM", "QQQ"]
}
```

Puedes agregar más símbolos o crear nuevos grupos editando este archivo.

## 📝 Licencia

MIT

---

**Desarrollado con ❤️ para traders e inversores**
