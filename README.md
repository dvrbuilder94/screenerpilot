# Crypto Multi-Timeframe Dashboard

Dashboard profesional de análisis técnico para criptomonedas (Bitcoin y Ethereum) con análisis multi-timeframe y múltiples indicadores técnicos.

## 🚀 Características

- **Análisis Multi-Timeframe**: Compara tendencia macro (1D/1W) con señales operativas micro (1H/4H)
- **Indicadores Técnicos**:
  - EMA 20 / EMA 50 (Exponential Moving Averages)
  - RSI 14 (Relative Strength Index)
  - MACD (12, 26, 9) (Moving Average Convergence Divergence)
  - ATR 14 (Average True Range)
  - Supertrend (10, 3)
- **Sistema de Scoring Inteligente**: Combina todos los indicadores para generar señales BUY/SELL/HOLD
- **Análisis Combinado**: Identifica cuando macro y micro están alineados para señales fuertes
- **Visualización Avanzada**: Gráficos de velas con EMAs, cards de KPIs y tabla detallada
- **Auto-refresh**: Actualización automática cada 60 segundos
- **Exportar CSV**: Descarga últimas 200 velas con todos los indicadores
- **Persistencia**: Guarda preferencias en localStorage

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

## 📊 Fuente de Datos

Utiliza la API pública de Binance (sin necesidad de API key):

```
https://api.binance.com/api/v3/klines
```

**Símbolos disponibles:**
- BTCUSDT (Bitcoin)
- ETHUSDT (Ethereum)

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
- **Binance API** datos en tiempo real

## 📝 Licencia

MIT

---

**Desarrollado con ❤️ para la comunidad crypto**
