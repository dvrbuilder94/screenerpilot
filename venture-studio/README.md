# Venture Studio — emergentOS

**Inicio:** 2026-10-12 | **Estado:** exploración inicial / no hay negocios validados.

## Objetivo
Encontrar mercados donde ya se compran soluciones, formular hipótesis de entrada vertical, validar disposición real a pagar y construir únicamente MVPs con probabilidad razonable de generar caja. B2B, B2C, juegos y operaciones industriales son elegibles.

## Navegación
- [Mandato del agente](PROMPT_MAESTRO.md)
- [30 oportunidades y evidencia estructurada](data/opportunities.json)
- [Primer barrido de investigación](research/2026-10-12-market-scan.md)
- [Cinco hipótesis finalistas](research/shortlist.md)
- [Modelo económico de tres escenarios](research/financial-model.md)
- [Experimento comercial de 14 días](playbooks/14-day-validation.md)
- [Reglas de scoring](SCORING.md)
- [Programa local de ranking](scripts/rank.py)

## Estado verificable
- Primera ronda: **30 hipótesis / 21 categorías / fuentes oficiales sobre ofertas ya existentes**.
- **Cero entrevistas, cero pilotos, cero clientes e ingresos atribuibles a estas ideas.**
- Clasificación de todas las oportunidades: IDEA. El orden es preliminar y NO es validación comercial.
- Puntaje heurístico 0–100 menos penalización explícita de incertidumbre.
- Costos y plazo de MVP: supuestos ilustrativos, no cotizaciones ni promesas.

## Flujo de trabajo
IDEA → INVESTIGADA → VALIDACIÓN → MVP → LANZADA → MONETIZANDO → ESCALANDO / DESCARTADA.

1. Capturar URLs oficiales, fecha de consulta y qué evidencia aportan.
2. Confirmar el dolor mediante entrevistas y artefactos reales de trabajo.
3. Probar oferta y precio antes de programar.
4. Desarrollar funcionalidad mínima cuando exista una señal comercial.
5. Medir conversión, CAC, margen de contribución, churn y horas de soporte.
6. Revisar falsos positivos, registrar decisiones y recircular componentes.

## Límites y seguridad
Esta carpeta no altera **$EGENT**, el agente onchain, el launchpad, la app React ni el deployment.
No insertar claves, tokens, credenciales, PII ni datos de clientes en commits.
No desplegar ni efectuar pagos, firmas onchain, contactos a terceros o cambios productivos automáticamente.
Cualquier futura automatización debe ser idempotente, versionada, limitada en costos y preservar fuentes.

## GitHub first
Datos en JSON versionado, documentos en Markdown, seguimiento con issues/PR y código de validación reproducible. Una ejecución diaria NO está habilitada: hará falta configurar credenciales, límites y un job de ejecución con autorización específica.
