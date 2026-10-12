# Criterio de ranking y calidad de investigación
Los siete ejes se califican de 0 (muy desfavorable) a 5 (muy favorable). Ponderaciones:
demanda 20, adquisición 20, monetización 20, MVP 15, margen 10, automatización 10, riesgo 5.
Puntaje bruto = Σ (eje/5 × peso).
Puntaje mostrado = puntaje bruto – deducción por incertidumbre (0..25 puntos), suelo 0.
Ejes **no** son datos medidos; son juicio inicial. Mayor valor en riesgo = menor riesgo. Registrar por qué cada eje mejora/empeora.
No etiquetar como validado por haber encontrado un competidor. Para INVESTIGADA: 2+ fuentes oficiales y diferenciación concreta. Para VALIDACIÓN: evidencia de entrevistas/oferta. Para MVP: decisión go/no-go y diseño técnico. Para MONETIZANDO: ingreso real comprobado.
Rerank: `python3 venture-studio/scripts/rank.py` (ejecutar desde raíz del repo).
