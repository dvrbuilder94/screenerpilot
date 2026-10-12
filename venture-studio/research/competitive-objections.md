# Competencia, objeciones y posibles falsos positivos
Fecha de consulta: 2026-10-12. Hallazgos posteriores al primer ranking; **no reinterpreta scores como validación**.

## VS-001 — Cotizador para contratistas
**[Datos verificados]**
- Jobber incluye presupuestos profesionales en Core y declara precio desde US$29/mes en facturación anual (configuración de 1 usuario): https://www.getjobber.com/pricing/
- Jobber tiene plantillas gratuitas PDF/Excel y un flujo básico gratuito de presupuestos: https://www.getjobber.com/free-tools/estimate-template/contractor/
- Fixner ya ofrece presupuestos, márgenes y flujos de instalación para empresas instaladoras, lo que limita la diferenciación de un simple "cotizador": https://fixner.com/software-field-service/empresas-instaladoras

**[Inferencia]** US$89/mes no se justifica solo por cotizar mejor visualmente. Hay que validar un flujo que Jobber/Fixner no cubra (listas de precios locales, presupuestos multiproveedor, aprobación de compras o integración tributaria específica). **Nivel de confianza: bajo**.
**[Hipótesis a probar]** contratistas de 3–15 trabajadores con presupuestos de alto valor ahorrarán horas reales con importación de ítems y revisión humana.
**Prueba que refuta**: 5/5 tienen flujo digital satisfactorio, 0/5 reconoce costo relevante, 0/5 pide piloto.

## VS-002 — CMMS ligero
**[Datos verificados]**
- UpKeep tiene Essential US$24/usuario/mes: https://upkeep.com/pricing/
- MaintainX tiene Essential US$20/usuario/mes anual: https://www.getmaintainx.com/pricing
- Fracttal ofrece CMMS en español, planes por usuario y contratos estándar de 12 meses: https://www.fracttal.com/es/preguntas-frecuentes

**[Inferencia]** mantener un CMMS genérico es competir contra ofertas maduras. Buscar una tarea muy específica o canal de técnicos externos, no recrear módulo completo. **Confianza baja**.

## VS-024 — Coordinación de aseo vacacional
**[Datos verificados]**
- Turno permite operación de una propiedad sin suscripción en ciertos casos; para varias propiedades con personal externo ofrece US$10/propiedad/mes o US$8 anual: https://help.turno.com/en/articles/2142069-what-are-the-fees-for-using-turno-as-a-host
- Breezeway ofrece tareas, checklists, inspecciones, limpiezas y planes desde US$19/mes para gestores pequeños, sujeto a su segmentación comercial: https://www.breezeway.io/breezeway-pricing
- Lodgify ya integra coordinación y calendario para alquileres cortos: https://www.lodgify.com/pricing/

**[Inferencia]** propuesta de US$59/mes es vulnerable para operadores de pocas unidades; requeriría ventaja local operativa (red comprobada, soporte, WhatsApp, disponibilidad en Chile), no solo checklist. **Revisar puntaje después de entrevistas**.

## VS-003 — Inspecciones de arriendo
**[Datos verificados]**
- Buildium comercializa operaciones inmobiliarias desde US$62/mes: https://www.buildium.com/pricing/
- HappyCo ofrece inspecciones, captura móvil, plantillas y sincronización a PMS; precios personalizados: https://happy.co/pricing

**[Inferencia]** la diferenciación podría centrarse en arrendadores pequeños de Chile y actas específicas. Requiere verificar marco de consentimiento y formatos aceptados para disputas. **Confianza baja**.

## VS-026 — Control de presupuesto de obra
**[Datos verificados]**
- ICONSTRUYE ya ofrece control de presupuesto, notificaciones y compras en mercado hispanohablante: https://www.iconstruye.com/gestion-de-compras/control-de-presupuesto/
- Buildertrend ya oferta gestión de presupuesto/proyectos a constructoras: https://buildertrend.com/pricing/

**[Inferencia]** trabajar para obras chicas o subcontratistas solo tiene sentido si la complejidad y costo de la competencia son barreras percibidas por compradores reales. **Confianza baja**.

## Conclusión de falsación
Las fuentes confirman **oferta**, no vacío de mercado. Una idea con score alto puede ser mala si compite frontalmente sin distribución propia. Las cinco deben pasar entrevistas y comparación funcional antes de construir una app pagada. La selección del primer experimento (VS-001) permanece provisional, pero la barra de diferenciación sube considerablemente tras este chequeo.
