# Protocolo y seguimiento 0.8.0

Fecha: 9 de noviembre de 2026. Protocolo: `2026.11.09-0.8.0`. Estado: implementación funcional; revisión clínica independiente pendiente. Las pruebas de software verifican reglas y cálculos, no resultados de salud.

## 1. Reglas trazables

En Entrenar, «Por qué estas recomendaciones» muestra reglas P01–P07, sus fuentes, población y decisiones de producto. Una recomendación general para adultos no constituye una prescripción individual. El peso y la masa muscular no permiten deducir los kg de una máquina. Las fases de entrenamiento son plantillas editables; no obligan a progresar por calendario.

Fuentes utilizadas:

- [ACSM, posición sobre entrenamiento de fuerza, 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/): adultos sanos; fundamento general de individualización y entrenamiento. No valida este algoritmo ni permite convertir InBody a cargas.
- [OMS, actividad física](https://www.who.int/initiatives/behealthy/physical-activity): referencia poblacional de actividad aeróbica y fortalecimiento. Los 150 minutos equivalentes semanales son una referencia editable, no una exigencia inicial para cada usuario.
- [Estudio sobre estimación de repeticiones restantes](https://pubmed.ncbi.nlm.nih.gov/29204323/): la estimación tiene incertidumbre. La app no trata el RIR como una medición exacta.
- [Estudio de variación de bioimpedancia InBody 770](https://pmc.ncbi.nlm.nih.gov/articles/PMC11649400/): justifica cautela al comparar mediciones; no establece un umbral universal aplicable a otros equipos, incluido el 270.
- [Preparación para una medición, InBody](https://inbodyusa.com/general/inbody-test/): instrucciones del fabricante, identificadas como tales, para registrar condiciones comparables. No es una validación independiente del equipo.

## 2. Progresión según sesiones y recuperación

La primera evaluación guarda equipo, ajuste, kg, repeticiones, reserva estimada, dolor y revisión técnica. Un inicio suave con reserva mayor de tres puede conservarse sin forzar un esfuerzo más alto. No se inventan kg cuando falta una evaluación.

La propuesta de incremento exige dos fechas distintas, todas las series previstas al tope del rango, misma carga y equipo, reserva suficiente, ausencia de dolor, técnica revisada y recuperación buena. Los registros antiguos sin contexto se conservan, pero no autorizan aumentos. El incremento debe ser un salto real declarado por la persona; se propone para revisión y nunca se aplica solo. Estas condiciones son decisiones conservadoras del producto, no un algoritmo clínicamente validado. Dolor, problemas técnicos o mala recuperación bloquean la propuesta aunque se hayan completado las repeticiones.

## 3. Actividad realizada

Se registran fecha, minutos, intensidad y contexto. Los minutos suaves se muestran separados; los vigorosos aportan el doble al equivalente moderado. Marcar una caminata en Semana no inventa duración ni intensidad. Las pausas de sedentarismo tienen su propio registro; no se convierten en minutos de ejercicio. Las metas se pueden reducir para comenzar gradualmente.

## 4. Calidad de las comparaciones InBody

Cada examen admite franja horaria, ejercicio reciente, hidratación habitual y relación habitual con comidas. «No registrado» conserva la incertidumbre. Se comparan equipos por separado. El aviso diferencia contexto incompleto, condiciones distintas y condiciones declaradas similares. Incluso una comparación similar conserva variabilidad; no demuestra por sí sola pérdida de grasa ni ganancia muscular. No se recomienda manipular la hidratación o las comidas para modificar el resultado.

## 5. Revisión profesional declarada

Se registran nombre, rol, fecha, ámbito, resultado y observaciones solo cuando la revisión ocurrió. La app conserva quién declara el registro; no autentica credenciales, firma ni contacto con el profesional. Alimentación se asocia al rol nutricionista; entrenamiento a profesionales del ámbito correspondiente según el formulario. Esto es una regla de alcance del producto, no una declaración legal sobre competencias.

La revisión se vincula a una instantánea del plan o del perfil y evaluaciones de entrenamiento, y a esta versión del protocolo. Un cambio relevante la deja como antecedente histórico y vuelve a mostrar revisión pendiente. No se ha realizado ninguna revisión profesional por construir esta funcionalidad. Tampoco activa el acceso remoto: Supabase sigue sin conexión confirmada.

## 6. Resumen de 12 semanas

En Progreso se elige fecha de cierre para un periodo de 84 días y se imprime el resumen. Incluye cobertura de registros, cumplimiento con denominador explícito, actividad real, días con series, sueño y pausas registrados, cintura y peso, exámenes por unidad, composición corporal por equipo, rendimiento por ejercicio/equipo/unidad y revisiones declaradas.

Los días sin plan ni registros no se cuentan automáticamente como incumplimiento. Una casilla de fuerza no demuestra una sesión con series. Las series del mismo día no se presentan como mejora entre sesiones; se utiliza la última serie de cada fecha. No se comparan kg, segundos y repeticiones como si fueran lo mismo. Los cambios son descriptivos, sin atribuir causalidad al programa ni diagnosticar.

## Validación y pendientes

86 pruebas automatizadas y TypeScript estricto satisfactorios. Incluyen reglas de progresión, fechas, datos faltantes, conservación del historial, unidades, equipos, revisiones e invalidez por cambio de protocolo. Todos los ejemplos de prueba son ficticios. La compilación y publicación se documentan en la memoria operativa después de comprobarlas.

Pendientes reales: revisión del catálogo de equivalencias por nutricionista; revisión del protocolo de fuerza y adaptación individual por profesional competente; comprobación visual e impresión en navegador; instalación y reapertura sin conexión en dispositivo; conexión de backend y prueba de seguimiento remoto con dos cuentas. No se atribuyen las métricas Lighthouse históricas a las nuevas pantallas.
