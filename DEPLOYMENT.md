# ScreenerPilot - Deployment Guide

## 🚀 Sistema de Colección Automática de Datos

El proyecto incluye una edge function `market-collector` que precalcula indicadores técnicos y almacena snapshots de mercado para optimizar el rendimiento y reducir costos de API.

### Configuración del Cron Job

Para ejecutar el collector automáticamente cada 5 minutos, sigue estos pasos:

#### 1. Habilitar Extensiones en Supabase

En el SQL Editor de tu proyecto Supabase, ejecuta:

```sql
-- Habilitar pg_cron para tareas programadas
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net para hacer requests HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### 2. Crear el Cron Job

Ejecuta el siguiente SQL (reemplaza los valores con tu información):

```sql
SELECT cron.schedule(
  'market-collector-job',           -- Nombre del job
  '*/5 * * * *',                     -- Cada 5 minutos
  $$
  SELECT
    net.http_post(
        url:='https://qceatovcjqhiqdpgfdzm.supabase.co/functions/v1/market-collector',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWF0b3ZjanFoaXFkcGdmZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDc2NzksImV4cCI6MjA3NjgyMzY3OX0.nKsccKw12HClQewUPIpO2TiKQA4_Pd-l12YYcPIQUc4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

#### 3. Verificar Jobs Activos

Para ver los cron jobs configurados:

```sql
SELECT * FROM cron.job;
```

#### 4. Ver Logs de Ejecución

Para monitorear la ejecución:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'market-collector-job')
ORDER BY start_time DESC 
LIMIT 10;
```

#### 5. Eliminar o Pausar el Job

Si necesitas detener el collector:

```sql
-- Eliminar completamente
SELECT cron.unschedule('market-collector-job');

-- O cambiar la frecuencia
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'market-collector-job'),
  schedule := '*/10 * * * *'  -- Cada 10 minutos
);
```

### Configuraciones de Frecuencia Recomendadas

```
'*/5 * * * *'    # Cada 5 minutos (recomendado para crypto)
'*/10 * * * *'   # Cada 10 minutos
'*/15 * * * *'   # Cada 15 minutos
'0 * * * *'      # Cada hora
'0 */4 * * *'    # Cada 4 horas
```

---

## 🔐 Seguridad de Edge Functions

Todas las edge functions tienen `verify_jwt = true` excepto el collector:

- ✅ `fetch-news`: Requiere autenticación
- ✅ `fetch-stock-data`: Requiere autenticación  
- ✅ `trading-ai-chat`: Requiere autenticación
- 🔓 `market-collector`: Público (solo para cron job)

### Rate Limiting Implementado

Cada función tiene límites por hora según el tier del usuario:

| Endpoint           | Free | Pro  | Premium |
|--------------------|------|------|---------|
| trading-ai-chat    | 10   | 100  | 500     |
| fetch-news         | 20   | 200  | 1000    |
| fetch-stock-data   | 30   | 300  | 1500    |

---

## 💰 Sistema de Monetización

### Planes Disponibles

**Free Plan**
- 10 mensajes IA/hora
- Datos básicos de mercado
- Límites de API reducidos

**Pro Plan ($29/mes)**
- ✨ Chat IA ilimitado
- ✨ Snapshots precalculados en tiempo real
- ✨ Límites de API 10x más altos
- ✨ Soporte prioritario

**Premium Plan ($99/mes)**
- Todo lo de Pro
- Límites de API 50x más altos
- Soporte dedicado
- Acceso API
- White-label options

### Integración con Stripe (Próximamente)

Para conectar Stripe:
1. Ir a Settings -> Integrations en Lovable
2. Habilitar Stripe
3. Configurar productos y precios
4. El código ya está preparado en `/pricing`

---

## 📊 Arquitectura de Datos

### Tablas Creadas

**api_usage**
- Tracking de rate limiting por usuario y endpoint
- Window de 1 hora con auto-reset

**asset_candles**
- Velas precalculadas desde Binance
- Últimas 50 velas por símbolo/interval
- Solo lectura pública

**asset_snapshots**
- Indicadores precalculados (EMA, RSI, MACD, Supertrend)
- Señales de trading con confidence scores
- Actualizado cada 5 minutos por el collector
- Solo lectura pública

### Consumo de Snapshots en Frontend

```typescript
import { useAssetSnapshot } from '@/hooks/useAssetSnapshots';

// En cualquier componente
const { data: snapshot } = useAssetSnapshot('BTCUSDT', 'crypto', '1h');

// El snapshot ya incluye:
// - Todos los indicadores calculados
// - Señales de trading
// - Confidence scores
// - Última actualización
```

---

## 🧪 Testing

### Probar el Collector Manualmente

```bash
curl -X POST https://qceatovcjqhiqdpgfdzm.supabase.co/functions/v1/market-collector \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Verificar Snapshots

```sql
SELECT symbol, interval, signal_type, confidence, calculated_at 
FROM asset_snapshots 
WHERE asset_type = 'crypto'
ORDER BY confidence DESC 
LIMIT 10;
```

---

## 📝 Notas Importantes

1. **Costos**: El collector consume ~20 tickers × 5 intervalos = 100 API calls cada 5 minutos. Esto es mucho más eficiente que recalcular en cada render del frontend.

2. **Escalabilidad**: Para agregar más tickers, edita el array `CRYPTO_UNIVERSE` en `market-collector/index.ts`.

3. **Free Tier**: Los usuarios Free no pueden acceder a snapshots en tiempo real por defecto. Considera implementar cache adicional o límites más estrictos.

4. **Monitoreo**: Revisa los logs de las edge functions regularmente en el dashboard de Lovable Cloud.

---

## 🚨 Troubleshooting

### El collector no se ejecuta
```sql
-- Verificar que el extension está habilitado
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- Ver errores en los logs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

### Rate limits muy estrictos
- Ajusta los valores en cada edge function
- Considera aumentar los límites para Pro/Premium
- Implementa caching adicional en el frontend

### Snapshots desactualizados
- Verifica que el cron job está corriendo
- Revisa los logs del collector
- Considera reducir la frecuencia si hay problemas de costo

---

¿Necesitas ayuda? Revisa la documentación oficial o contacta soporte anónimo.
