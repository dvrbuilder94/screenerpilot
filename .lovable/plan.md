

# Plan: Agregar Panel BMNR vs ETH en Crypto Macro

## Resumen
Crear un nuevo panel comparativo que muestre BitMine (BMNR) vs Ethereum, comparando retorno, volatilidad, drawdown y risk/reward a 90 días. Se ubicará en la sección crypto de Macro junto a los paneles existentes.

## Archivos a crear/modificar

### 1. Crear `src/components/BmnrVsEthPanel.tsx`
- Componente nuevo basado en el patrón de `EthVsBtcPanel`
- Fetch de BMNR via Yahoo Finance (`fetchCandles('BMNR', '1d', 90)`) y ETH via Binance (`fetchCandles('ETHUSDT', '1d', 90)`)
- Calcula métricas (return, volatility, max drawdown, risk/reward) para ambos
- Muestra comparación lado a lado con badge "Better R/R" y conclusión

### 2. Agregar `BMNR` a `src/lib/assetNames.ts`
- Agregar entrada `"BMNR": "BitMine"` para nombre legible

### 3. Modificar `src/pages/Macro.tsx`
- Importar `BmnrVsEthPanel`
- Agregarlo en la sección crypto, en el grid de "Secondary Metrics" (cambiar a grid de 2x2 o agregar una fila extra)

## Detalle técnico
- BMNR es un stock → usa `fetchYahooCandles` automáticamente via `getAssetType`
- ETHUSDT es crypto → usa `fetchBinanceCandles`
- Las funciones `calculateVolatility`, `calculateMaxDrawdown` de `cryptoMacro.ts` se reutilizan directamente
- useQuery con staleTime de 5min, mismo patrón que `EthVsBtcPanel`

