# Modelo financiero exploratorio — sin validar
Fecha: 2026-10-12

Todas las cifras salvo precios citados de competidores en research son **[Estimaciones/Hipótesis]**. No hay datos internos de adquisición, retención, soporte, costos finales ni ingresos. Proyección mensual puntual ilustrativa, NO forecast a 12 meses.

**Supuestos transversales para comparar:** 3, 12 o 35 clientes activos pagando precio de lista hipotético, costo variable 20% de ventas, costos fijos incrementales US$70/mes. Excluye el valor del tiempo, salario, impuestos, publicidad, CAC, churn, comisiones específicas, devoluciones y setup. Estas omisiones pueden hacer negativa la utilidad real.

**Fórmula:** ingresos = clientes x precio; contribución mensual = ingresos x (1 - costo_variable_pct) - costo_fijo_incremental.

### VS-001 — Cotizador inteligente de contratistas

| Escenario [Estimaciones] | Clientes activos | Precio USD/mes | Ventas/mes USD | Contribución mensual USD* |
|---|---:|---:|---:|---:|
| Conservador | 3 | 89 | 267 | 144 |
| Base | 12 | 89 | 1068 | 784 |
| Optimista | 35 | 89 | 3115 | 2422 |

### VS-002 — CMMS ligero con WhatsApp

| Escenario [Estimaciones] | Clientes activos | Precio USD/mes | Ventas/mes USD | Contribución mensual USD* |
|---|---:|---:|---:|---:|
| Conservador | 3 | 99 | 297 | 168 |
| Base | 12 | 99 | 1188 | 880 |
| Optimista | 35 | 99 | 3465 | 2702 |

### VS-024 — Coordinador de aseo para alquiler temporal

| Escenario [Estimaciones] | Clientes activos | Precio USD/mes | Ventas/mes USD | Contribución mensual USD* |
|---|---:|---:|---:|---:|
| Conservador | 3 | 59 | 177 | 72 |
| Base | 12 | 59 | 708 | 496 |
| Optimista | 35 | 59 | 2065 | 1582 |

### VS-003 — Inspecciones de arriendo con fotografías

| Escenario [Estimaciones] | Clientes activos | Precio USD/mes | Ventas/mes USD | Contribución mensual USD* |
|---|---:|---:|---:|---:|
| Conservador | 3 | 69 | 207 | 96 |
| Base | 12 | 69 | 828 | 592 |
| Optimista | 35 | 69 | 2415 | 1862 |

### VS-026 — Control de presupuestos de obra chica

| Escenario [Estimaciones] | Clientes activos | Precio USD/mes | Ventas/mes USD | Contribución mensual USD* |
|---|---:|---:|---:|---:|
| Conservador | 3 | 99 | 297 | 168 |
| Base | 12 | 99 | 1188 | 880 |
| Optimista | 35 | 99 | 3465 | 2702 |


*Contribución **no es utilidad neta**. Para cualquier iniciativa de precio P: clientes mínimos estimados para cubrir solo estos US$70 = techo(70/(P x 0.8)). El umbral económico completo requiere incorporar soporte, tiempo y CAC.*

## Sensibilidad crítica
Con 12 clientes y precio P:
- Costo variable 20%: 9.6P - 70.
- Costo variable 40%: 7.2P - 70.
- Solo 6 clientes y variable 20%: 4.8P - 70.
- Si el CAC es US$150 y el margen mensual por cliente es 0.8P antes de fijo, payback teórico = 150/(0.8P) meses; **CAC no observado**.
- Un churn de 10% mensual requiere altas constantes para sostener MRR.

## No confundir
- Precios oficiales de competidores ≠ precio aceptado para nuestra solución.
- Costo estimado de MVP ≠ costo cerrado.
- 35 clientes en el escenario optimista ≠ expectativa respaldada por funnel.
- La viabilidad financiera NO está demostrada; actualizar tras 5–10 conversaciones y al menos dos pruebas de pago.
