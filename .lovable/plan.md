# AI Market Intelligence Committee

Nueva ruta premium `/committee` con un "comité" de 3 agentes IA que analizan el mercado desde ángulos distintos, alimentados por datos reales que ya tienes en la app. Sin humo: cero data inventada en producción.

## Filosofía

- **3 agentes, no 6.** Bull/Bear forzados se sienten a teatro. En lugar de eso: Macro, Momentum, Quant — perspectivas complementarias, no opuestas artificiales.
- **1 llamada al modelo por consulta.** Un prompt estructurado devuelve las 3 opiniones + consensus en una sola request a Gemini. Barato y rápido.
- **Consensus derivado de datos reales**, no de la IA. Score calculado desde Market Regime Badges, Fear & Greed, Squeeze Radar, Sector Heatmap que ya existen.
- **Sin mocks en producción.** Smart Money Tracker y Unusual Options Flow se omiten hasta tener data real.

## Estructura de página

```
/committee  (premium-only, gate con ProGate existente)
├── Header
│   ├── "AI Market Intelligence Committee"
│   ├── Subtítulo + live dot + timestamp
│   └── Input: "Ask the committee…"
├── Consensus Panel  (datos reales)
│   ├── Sentiment bar (Bullish/Neutral/Bearish %)
│   ├── Market Regime label (reusa MarketRegimeBadges)
│   ├── Risk meter (reusa CryptoRiskMeter logic)
│   └── Volatility indicator (VIX desde Yahoo)
├── Agents Grid  (3 cards glassmorphism)
│   ├── Macro Agent (azul)
│   ├── Momentum Agent (verde)
│   └── Quant Agent (púrpura)
├── Committee Debate  (transcript de la última query)
│   └── Mensajes de los 3 agentes con typing animation
└── Live Signals Panel  (reusa componentes existentes)
    ├── Regime Badges
    ├── Squeeze Radar (preview, link a Stock Intelligence)
    ├── Sector Heatmap
    └── Fear & Greed
```

## Flujo de una consulta

1. Usuario escribe pregunta o selecciona "Ask the market" sin texto (= briefing general).
2. Frontend recolecta snapshot de datos reales: regime, fear&greed, top movers, sector performance, VIX.
3. Edge function `committee-analysis` envía 1 prompt estructurado a Gemini con:
   - Contexto de datos reales
   - Instrucción de devolver JSON con 3 perspectivas (macro/momentum/quant) + bias + confidence + 1-2 frases cada uno
4. Frontend renderiza las 3 respuestas con animación typing escalonada (efecto debate sin ser 3 requests).
5. Consensus se calcula client-side promediando bias + confidence de los 3 agentes ponderado por señales reales.

## Detalles técnicos

- **Ruta:** nueva `/committee` dentro de `AppLayout` (protegida con `ProGate` configurado a tier `premium`).
- **Edge function:** `committee-analysis` (verify_jwt=true), modelo `google/gemini-2.5-flash`, structured output con Zod schema, límite 10 queries/día premium.
- **Componentes nuevos:**
  - `pages/Committee.tsx`
  - `components/committee/ConsensusPanel.tsx`
  - `components/committee/AgentCard.tsx`
  - `components/committee/DebateTranscript.tsx`
  - `components/committee/CommitteeInput.tsx`
  - `hooks/useCommitteeAnalysis.ts`
- **Reuso:** `MarketRegimeBadges`, `FearGreedPanel`, `CryptoRiskMeter`, `MiniChart`, `Sparkline`, ProGate, AppHeader.
- **Tabla nueva:** `committee_queries` (user_id, question, response_json, created_at) + RLS + GRANTs. Permite historial.
- **Estilo:** glassmorphism sobre el fondo blanco actual con acentos de color por agente (no tema oscuro completo — rompería tu sistema de diseño establecido). Si quieres dark mode solo en este módulo, lo marcamos como decisión aparte.
- **Mobile:** grid de agentes colapsa a scroll horizontal swipeable; debate transcript en columna; input sticky bottom.
- **Nav:** entrada nueva en `AppHeader` ("Committee") con badge "Premium".

## Lo que NO se incluye (por decisión consciente)

- Bull Agent / Bear Agent / Sentiment Agent → se pueden añadir después si la base funciona.
- Smart Money Tracker / Unusual Options Flow → requieren APIs pagas. Se etiqueta como "Coming Q3" en el footer del módulo.
- Hedge Fund Positioning → idem.
- Debate "en tiempo real continuo" → solo se dispara con queries del usuario (controla costos).

## Notas sobre tu sistema actual

Tu memoria marca el UI como **fintech premium blanco/gris/negro**. El brief original pide "dark institutional Bloomberg". Propuesta: mantener fondo claro pero los cards de agentes en glass oscuro con acentos de color → contraste premium sin romper el resto de la app. Si prefieres dark completo solo aquí, lo confirmamos antes de implementar.
