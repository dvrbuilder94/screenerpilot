# Sprint comercial 14 días — VS-001: Cotizador inteligente de contratistas

**Estado:** propuesta de ejecución, NO entrevistas realizadas. Ningún tercero ha sido contactado.

## Cliente y primer problema
ICP inicial [Hipótesis]: Contratistas de climatización y electricidad. Cobro propuesto [Estimación]: US$89/mes, o equivalente local testeado. Promesa a validar: reducir tiempo hasta una cotización consistente usando plantillas, catálogo y revisión humana. No emitir ofertas automáticamente sin revisión.

## Plan
| Día | Actividad | Evidencia a guardar |
|---|---|---|
| 1 | Listar 25 empresas del nicho desde fuentes públicas; elegir 10 accesibles | lead list sin datos personales privados |
| 2 | Revisar 3 competidores más, diferenciación local y condiciones | URLs, funcionalidades, fechas |
| 3 | Escribir guion de entrevistas sin preguntas dirigidas | documento guion |
| 4–5 | Entrevistar 5 responsables del presupuesto/cotización | dolores, frecuencia, horas, spend, frases anonimizadas |
| 6 | Calcular ahorro potencial con 2 presupuestos de ejemplo reales anonimizados | baseline, fórmula, supuestos |
| 7 | Crear demo manual (hoja de cálculo/plantilla, no código) | ejemplos antes-después |
| 8–9 | Mostrar demo a 5 compradores; preguntar precio y condiciones | objeciones, compromisos |
| 10 | Presentar oferta explícita a quienes expresaron dolor | intenciones pagadas, no likes |
| 11 | Decidir: continuar, pivotar o descartar | memo con evidencia |
| 12 | Si pasó filtro, especificar MVP mínimo y esquema seguro de datos | PRD |
| 13 | Crear prompt Lovable, integración opcional GPT solo para asistencia | backlog técnico |
| 14 | Revisión financiera, experimento de cobro y siguiente sprint | score actualizado |

## Umbrales [Hipótesis operativas, NO benchmarks de mercado]
Continuar si 3/5 reportan dolor frecuente y cuantificable, 2/5 muestran cotizaciones/flujo real anonimizados, y al menos 1 acepta piloto pagado, depósito reembolsable o propuesta firmada con precio. Si 0/5 manifiestan urgencia, cancelar esta variante. Si les gusta pero no pagan, replantear ICP y precio, no programar.

## Prompt preliminar para Lovable (SOLO tras señal comercial)
"Construye una app responsive para cotizaciones de instaladores. Auth por organización y roles owner/editor/viewer; catálogo de ítems y mano de obra; propuestas con borrador/revisión/aprobación, versiones, impuestos configurables y exportación PDF; auditoría de cambios; nunca envíes una propuesta sin aprobación explícita; base en Supabase con RLS real y pruebas multi-tenant. Una función server-side opcional de IA transforma notas en borradores con cita de ítems usados; nunca inventa precios, cantidades ni impuestos. No guardar claves en cliente; importación CSV; analytics: tiempo cotización, tasa de aceptación, ingreso cobrado. Construir fase por fase, empezando por auth + catálogo + cotización manual; exigir pruebas para avanzar. No integrar pagos productivos ni enviar correos reales en la primera fase."

## Riesgos
Datos tributarios locales, precios variables, estimaciones erróneas de IA, errores contractuales y seguridad multi-tenant. Confirmar normativas y términos vigentes antes de vender.
