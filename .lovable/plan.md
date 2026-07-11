
# Plan: ScreenerPilot v2 — Serio, enfocado y mobile-first

## Diagnóstico honesto
Hoy hay demasiadas cosas: Top Picks, Committee (beta), Crypto Momentum, Squeeze Radar, Macro, Ratios, Commodities, Stock Intelligence, Home, Watchlist, Markets… El usuario se pierde, el landing promete "agentes" que ya no son el core, el logo no convence, y en móvil se sale de pantalla. Necesitamos **producto enfocado**, no un buffet.

## Principios
1. **Menos es más**: 4 secciones máximo en el nav.
2. **Mobile-first real**: todo probado en 375px antes de desktop.
3. **Home = valor inmediato**: al entrar ves el mercado hoy, tu watchlist, y una barra para buscar cualquier ticker.
4. **Landing honesto**: refleja exactamente lo que hay dentro. Sin "agentes", sin humo.

---

## Nueva estructura de navegación

```text
[Logo]   Home · Markets · Stock Intelligence · Watchlist        [Search] [User]
```

Solo **4 tabs**. Todo lo demás se archiva o se fusiona:

| Actual              | Destino v2                                          |
| ------------------- | --------------------------------------------------- |
| Home                | ✅ Rediseñar (ver abajo)                            |
| Top Picks           | ❌ Eliminar del nav (queda como widget en Home)     |
| Markets             | ✅ Unifica Markets + Macro + Ratios + Commodities   |
| Stock Intelligence  | ✅ Absorbe Squeeze Radar como tab interno           |
| Watchlist           | ✅ Mantener, mejorar                                |
| Committee (beta)    | 🗄️ Archivar ruta, quitar del nav (queda /committee) |
| Crypto Momentum     | 🗄️ Mover a tab dentro de Markets                    |

Bottom bar móvil: **Home · Markets · Search · Watchlist** (4 iconos, no 5).

---

## Home rediseñado (la pestaña más importante)

Layout mobile-first, una sola columna, scroll natural:

```text
┌─────────────────────────────────┐
│  Good morning, Diego            │  ← saludo + fecha
│  Markets are [green/red] today  │
├─────────────────────────────────┤
│  🔍  Search any ticker...       │  ← input grande, foco al abrir
├─────────────────────────────────┤
│  TODAY'S TAPE                   │
│  S&P  ·  Nasdaq  ·  VIX  ·  BTC │  ← 4 cards horizontal scroll
│  DXY  ·  10Y     ·  Gold ·  Oil │
├─────────────────────────────────┤
│  MOVERS TODAY                   │
│  🔥 Top Gainers  |  Top Losers  │  ← tabs, 5 filas c/u
├─────────────────────────────────┤
│  YOUR WATCHLIST (3)             │
│  AAPL  190.2  +1.2%             │  ← si vacío: CTA "Add tickers"
├─────────────────────────────────┤
│  MARKET PULSE                   │
│  Regime: Risk-on · VIX 14       │
└─────────────────────────────────┘
```

Fuera del Home: Top Picks card, briefing largo, live ticker tape animado (queda solo en landing).

---

## Logo unificado

Un solo `<Logo />` usado en header, landing, favicon, emails.

- **Símbolo**: monograma `SP` en un cuadrado con corner-radius, o una barra vertical + punto (estilo velocímetro). Elijo el que quede más limpio en 24px.
- **Color**: blanco puro sobre fondo negro, negro sobre blanco. Nada de gradientes.
- **Tipografía del wordmark**: peso 600, tracking apretado.
- Un solo componente, sin variantes duplicadas.

---

## Landing: recorte y honestidad

- **Fuera**: cualquier mención a "AI agents", "Committee", "6 agents debating".
- **Hero nuevo**: "The market terminal for independent investors." Sub: "Live prices, movers, macro regime, and deep ticker analysis. No fluff."
- **3 secciones**: (1) Live Pulse (ya existe, mantener), (2) 3 cards de módulos reales (Markets, Stock Intelligence, Watchlist), (3) Pricing CTA.
- **Fuera**: Terminal demo largo, tabla de scores, cualquier cosa que no exista adentro.
- Ticker tape: mejorar contraste (letras blancas puras, precios en mono, cambio en verde/rojo saturados).

---

## Mobile fixes concretos

- Header: solo logo + 4 tabs (o hamburguesa solo si <400px). Cero overflow.
- Bottom bar: 4 iconos, safe-area respetada.
- Tablas de Markets: card view en móvil (ya parcial, terminar).
- Stock Intelligence: input full-width, resultados en cards apiladas.
- Todo con `overflow-x-hidden` verificado.

---

## Fases de ejecución

**Fase 1 — Nav + Home + Logo (esta iteración)**
- Nuevo `<Logo />` minimalista blanco/negro.
- Header reducido a 4 tabs, mobile bottom bar a 4.
- Home rediseñado: saludo, search grande, today's tape, movers, watchlist, pulse.
- Rutas `/top-picks`, `/committee`, `/crypto-momentum`, `/ratios`, `/commodities` quedan accesibles por URL pero fuera del nav.

**Fase 2 — Markets unificado**
- Una sola página Markets con tabs internos: Overview · Stocks · Crypto · Macro · Ratios · Commodities.
- Ticker tape con contraste corregido.

**Fase 3 — Landing limpio**
- Reescribir copy sin "agentes".
- 3 secciones, un solo CTA.
- Screenshots reales del nuevo Home.

**Fase 4 — Stock Intelligence pulido**
- Squeeze Radar como tab interno.
- Mobile: cards apiladas, sin scroll horizontal.

---

## Qué NO hago
- No borro código de Committee/Top Picks/Crypto — solo los saco del nav. Podés revivirlos si querés.
- No toco Paddle, auth, emails, ni backend de datos.
- No agrego features nuevos hasta que la base v2 esté sólida.

---

## Aprobación
¿Arranco con **Fase 1** (nav + Home + Logo) ahora, o querés ajustar algo del plan primero (ej: mantener Committee en nav, otro orden de tabs, distinto símbolo de logo)?
