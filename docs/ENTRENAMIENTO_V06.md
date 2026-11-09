# Entrenamiento A/B e impresión

## Vigente: versión 0.7, evaluación inicial

Las cifras genéricas de 5 y 10 kg de 0.6.1 quedan retiradas. Tampoco se considera recomendación un registro antiguo que no identifica equipo, esfuerzo, dolor y revisión técnica. Los PDF personales anteriores con cifras genéricas quedan como versiones históricas, no como la carga vigente de la persona.

`trainingAssessments` guarda evaluaciones por rutina, variante y equipo: fecha, kg efectivamente realizados, repeticiones, reserva estimada de 0 a 5 o más, dolor y técnica revisada por el entrenador. La primera sesión es submáxima; no calcula ni requiere 1RM. El entrenador elige una carga ligera y revisa ajustes. El protocolo de la plantilla propone probar 8 repeticiones, no llegar al fallo, descansar 90–120 segundos y limitar a dos ensayos por ejercicio. Se pueden distribuir las evaluaciones entre A y B en días separados.

Una evaluación de 8–12 repeticiones, reserva 2–3, sin dolor y técnica revisada permite reutilizar esos mismos kg y repeticiones como punto inicial, solo en el mismo equipo y ajuste. Si aparece dolor, falta revisión técnica, el rango no se cumple o la reserva está fuera del objetivo, se solicita revisión o nueva prueba sin inventar una carga numérica. El resultado más reciente sustituye al anterior; un dolor posterior impide seguir mostrando la carga antigua como comprobada. Las fechas futuras son rechazadas. La calibración se muestra hasta hoy, independientemente del día de registro seleccionado en la cabecera.

Se conserva todo el historial y el respaldo completo incluye las evaluaciones. El perfil inicial no agrega evaluaciones ficticias. La vista remota del nutricionista no añade estos campos a su permiso actual.

El InBody importado se muestra con fecha, dispositivo, peso, masa muscular esquelética y grasa, tanto en Entrenar como en la impresión. Sirve para seguimiento conjunto de composición y rendimiento; no se transforma en una estimación de fuerza. Los informes adjuntos al chat requieren importación o registro explícitos en Progreso para existir en ese navegador.

Fuente adicional: [AHA, declaración científica sobre entrenamiento de resistencia](https://pmc.ncbi.nlm.nih.gov/articles/PMC11209834/). Respalda la distinción entre carga, fuerza y prescripción individual; el protocolo de registro, el margen objetivo y los estados de la app son convenciones operativas y no equivalen a validación clínica individual.

Verificación: 68 pruebas, incluidas evaluación válida, bloqueo por dolor/técnica, esfuerzo excesivo o insuficiente, fechas/unidades, prioridad temporal y conservación del estado. La impresión del navegador sigue pendiente de revisión visual.

## Histórico 0.6.1: cifras retiradas en 0.7

Se muestra una primera meta concreta de series × repeticiones y una columna con carga de prueba o último registro. Para adultos de 18–64 años que comienzan en gimnasio, sin molestias conocidas, la plantilla ofrece ensayos conservadores en máquinas con selector: pecho 5 kg, remo 10 kg, jalón 10 kg, hombros 5 kg y femoral 5 kg. Prensa: 10 kg únicamente si es horizontal con selector; otras prensas requieren calibración con el entrenador. Los ejercicios con peso corporal indican 0 kg externos. Son convenciones de prueba de la plantilla, no cargas derivadas del InBody, estimaciones de fuerza ni cifras clínicas validadas por las fuentes.

Las cifras de máquinas distintas no son equivalentes. Si el equipo no permite la carga indicada, no se exige elegir una mayor. La primera prueba busca 8 reps (6 por lado en tronco) conservando 2–3 posibles. Si no se logra con técnica, reducir; si quedan más de cinco adicionales con facilidad, descansar y probar un solo incremento pequeño. Máximo dos ensayos, con apoyo del entrenador. El registro real anterior tiene prioridad. No se rellena automáticamente el campo de kg con una carga no realizada.

Se añade una prueba de regresión de carga inicial, repeticiones, prioridad del registro, ausencia de fórmula por peso corporal, alcance de prensa y exclusión de cifras genéricas para mayores de 65 años. Total: 61 pruebas. El PDF personal v2 incorpora estas cifras y se revisa fuera del repositorio.

## Modelo y personalización

`trainingProfile` es un campo opcional del estado local: edad, peso de referencia, altura, experiencia, equipamiento, situación de molestias, notas y semana 1–12. Se conserva en el respaldo completo y se mantiene al migrar el estado. El perfil inicial no contiene datos de salud personales. Se ofrece el último peso registrado hasta hoy para facilitar el llenado; se puede corregir antes de guardarlo. La altura parte del perfil general, que debe revisarse.

La experiencia y la semana definen el volumen: al comenzar o retomar, una serie en semanas 1–2 y dos desde la semana 3; con experiencia regular, dos hasta la semana 4 y tres después. Esto es una decisión conservadora de la plantilla, no un calendario de progresión obligatorio. Dos días A/B separados por al menos 48 horas. La persona avanza manualmente la semana del ciclo, según tolerancia y revisión de su entrenador.

El equipamiento cambia la selección. En gimnasio se priorizan máquinas ajustables y ejercicios sin carga externa. En casa con pesas, la plantilla requiere mancuernas y banda. Sin equipamiento se muestra explícitamente que falta un tirón de espalda con resistencia; la movilidad en pared no lo reemplaza. No se presume capacidad por el peso, el IMC ni el aspecto de un examen. Edad, altura y peso identifican el contexto; no generan una carga en kg ni una prescripción clínica. Desde 65 años se ofrece más tiempo de recuperación y un recordatorio de equilibrio con apoyo.

Las molestias o restricciones sin revisar impiden generar automáticamente una rutina específica; las notas se conservan para la consulta. La app no declara adaptar una lesión. Ante molestias conocidas, el usuario necesita la revisión de un profesional. Los avisos generales de seguridad se muestran en pantalla y en la impresión.

## Registro e impresión

Pantalla e impresión utilizan el mismo generador. Ambas rutinas se incluyen al imprimir, aunque en pantalla solo esté seleccionada una. Diseño A4 con salto entre A y B, instrucciones breves, rangos de repeticiones (por lado cuando corresponde), descansos, espacios para anotar series y observaciones. El navegador permite elegir impresora o Guardar como PDF. Los encabezados y pies automáticos del navegador pueden cambiar la paginación.

Se imprime el perfil guardado y el último registro del ejercicio exacto, en la misma rutina y con fecha no posterior al día seleccionado. No se mezclan cargas de máquinas o variantes con nombres distintos. Se conservan los registros anteriores, incluidos los ejercicios que ya no se muestran en la nueva plantilla. Los ejercicios sin carga externa no reciben sugerencias de subir kg. La sugerencia de progresión requiere completar el número de series de la fase, al mismo peso y al tope del rango; además pide comprobar técnica, ausencia de dolor y margen de repeticiones. No aumenta carga automáticamente.

La vista remota del nutricionista no incorpora un nuevo permiso de entrenamiento en esta entrega. Supabase sigue sin instancia configurada.

## Fuentes y límites

- [CDC: What Counts as Physical Activity for Adults](https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html): fuerza al menos dos días, grupos musculares, rangos y series generales.
- [NIDDK: Staying Active at Any Size](https://www.niddk.nih.gov/health-information/weight-management/staying-active-at-any-size): adaptación a capacidades, progresión gradual y revisión profesional según antecedentes.

La selección concreta de ejercicios, la duración estimada, el margen de 2–3 repeticiones, los descansos y las fases son convenciones de esta plantilla; las fuentes no validan una rutina individual. Antes de usarla como indicación clínica necesita revisión profesional.

## Verificación

Siete pruebas nuevas verifican volumen por experiencia/semana, ausencia de cargas calculadas desde peso, bloqueo por molestias pendientes, límites de edad/unidades/semana, equipamiento, progresión por series reales, cargas por fecha/rutina/variante y conservación del historial. Total: 60 pruebas satisfactorias y TypeScript estricto.

Un PDF personal de dos páginas se genera y revisa fuera del repositorio público. Esa revisión no acredita por sí sola la paginación del diálogo de impresión del navegador, que requiere revisión visual en el dispositivo utilizado.
