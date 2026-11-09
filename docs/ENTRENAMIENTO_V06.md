# Entrenamiento A/B e impresión

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
