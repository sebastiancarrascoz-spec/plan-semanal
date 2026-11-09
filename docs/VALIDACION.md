# Validación de la entrega

## Calibración autoguiada 0.8.1: 9 de noviembre de 2026

88 pruebas y TypeScript estricto satisfactorios. Se permite una primera referencia de carga desde una prueba autoguiada realmente registrada, con control técnico declarado y ausencia de dolor; se identifica la procedencia sin fingir observación por la app. Los registros antiguos mantienen origen desconocido. Se conservan bloqueos por dolor, técnica pendiente y esfuerzo excesivo. La impresión se alinea con las dos fechas comparables de la progresión. Ver [investigación y alcance](CALIBRACION_AUTOGUIADA_V081.md). Esta corrección retira la exigencia universal de entrenador; no certifica aptitud médica ni ejecución técnica. La revisión visual del navegador sigue pendiente.

## Seguimiento 0.8: 9 de noviembre de 2026

86 pruebas, TypeScript estricto y compilación estática de producción satisfactorios. Se verifican progresión con dos fechas comparables, incertidumbre del RIR, bloqueo por dolor o recuperación, minutos reales separados de casillas, condiciones de bioimpedancia, revisión declarada vinculada a versión y resumen de 84 días sin inventar datos faltantes ni mezclar unidades o equipos. Las reglas y límites actuales están en [protocolo 0.8](PROTOCOLO_CIENTIFICO_V08.md); sustituyen el rechazo automático de una reserva mayor de tres de la versión 0.7. La revisión clínica profesional y la revisión visual de los nuevos flujos siguen pendientes. Las secciones anteriores describen verificaciones históricas y no acreditan el backend actual.

## Calibración 0.7: 9 de noviembre de 2026

Se retiran las cargas genéricas. Siete nuevas pruebas verifican la evaluación inicial y su conservación; la prueba de 0.6.1 se sustituye por una regresión contra kg inventados o registros sin contexto. Total: 68 pruebas satisfactorias y TypeScript estricto. Se comprueba que una evaluación satisfactoria conserva los kg y las repeticiones realizados y explicita el equipo; dolor, técnica pendiente o esfuerzo fuera de objetivo impiden declararla comprobada. Revisión visual del diálogo de impresión todavía pendiente.

## Corrección 0.6.1: 9 de noviembre de 2026

Sesenta y una pruebas y TypeScript estricto satisfactorios. La nueva regresión comprueba el punto de partida explícito, sus repeticiones, la distinción de carga de prueba frente a registro realizado y las limitaciones por equipo y edad. PDF personal v2: dos páginas renderizadas y revisadas visualmente, con cifras de prueba y casillas separadas para lo realizado. No se incluyen sus datos en el repositorio. La impresión interactiva del navegador sigue sin revisión visual.

## Entrenamiento 0.6: 8 de noviembre de 2026

Sesenta pruebas satisfactorias y TypeScript estricto. Se verifican las nuevas reglas A/B y se conserva el historial. La compilación estática completa pasa. El PDF privado de A/B se comprobó como dos páginas y ambas se renderizaron y revisaron visualmente sin cortes. No se incluyen sus datos en el repositorio. La paginación del botón de impresión del navegador queda pendiente de revisión visual en ese entorno; las reglas de impresión se revisaron en código.

## Publicación en Vercel: 8 de noviembre de 2026

Producción confirmada como READY en https://plan-semanal-snowy.vercel.app, proyecto `plan-semanal`, plan Hobby. Las 53 pruebas, TypeScript y la compilación pasan en GitHub Actions para el código `b8e80d6260bc38fbcf284820f28710e2ac946ef8`. Se corrigió el preset Vercel a Other para servir la exportación estática `out` sin buscar manifiestos de servidor Next.js.

Se comprobaron por HTTP sin autenticación la portada, el manifiesto, el service worker con precaché de recursos Next.js y los iconos de 192/512 px: todos responden 200. No equivale a una prueba de instalación real, sincronización ni revisión visual de todos los flujos. El acceso GitHub → Vercel no quedó autorizado y las publicaciones automáticas siguen pendientes; la CLI sí está autorizada. Se retiró la credencial de bypass creada automáticamente por la verificación CLI; la URL de producción es accesible sin ella. Supabase continúa desconectado. Las notas de versiones anteriores que siguen abajo describen el estado histórico de cada entrega.

7 de noviembre de 2026.

- Next.js 15.5.29: compilación estática de producción y comprobación de TypeScript estricto satisfactorias.
- Seis pruebas unitarias satisfactorias: totales diarios y distribución; filtro vegano y variedad; rechazo de plan inválido; suma de compras por unidad; intercambio y cena sin carbohidratos; semana comenzando en lunes.
- `npm audit --omit=dev`: cero vulnerabilidades. Se aplicó override PostCSS 8.5.23 o posterior compatible.
- Lighthouse sobre servidor local con compresión gzip, estado inicial con bienvenida: móvil 97 en rendimiento y 100 en accesibilidad; escritorio 100 y 100. El detalle está en `lighthouse-resumen.json`. Son mediciones locales de esa pantalla, no una certificación de todos los flujos ni del alojamiento público.
- Recursos PWA precargados y manifiesto con iconos PNG de 192/512 px. Revisión estática del precaché y UTF-8.

## Límites de verificación

El host de automatización del navegador no estuvo disponible. Computer Use tampoco pudo confirmar la URL de la ventana de Windows y detuvo sus acciones. No se completó la revisión manual de flujos, instalación real ni reapertura offline en un dispositivo.

Supabase y Vercel no están conectados. No se han comprobado las políticas en una instancia real, correo de acceso, dos cuentas, vinculación, revocación, borrado remoto ni sincronización. El despliegue alternativo Sites se considera comprobado únicamente cuando la herramienta devuelve estado satisfactorio y URL.

## Actualización 0.2

Dieciocho pruebas unitarias y TypeScript estricto satisfactorios. Se verifican filtros combinados, modo pescetariano, bloqueo de restricciones estrictas sin revisión, exclusión de preferencias, diferencia entre sin lactosa y sin leche, importación de composición corporal, fechas y unidades, deduplicación por equipo/fecha/hora y cálculo del carrito y conservación del estado de la versión anterior. Todos los fixtures del repositorio son ficticios.

El archivo personal externo se validó como un examen, 16 métricas y 5 segmentos. No se incluye en el repositorio ni en el despliegue.

Lighthouse local de la bienvenida en la actualización: 99 en rendimiento móvil y 100 en accesibilidad. La revisión manual de los nuevos flujos y la instalación real siguen pendientes por la limitación de acceso al navegador. La migración SQL del permiso de composición corporal requiere prueba en una instancia real.

## Actualización 0.3: compras

Veinticinco pruebas unitarias satisfactorias y comprobación de TypeScript estricto. Incluye casos de 360 g de avena → 1 bolsa de 500 g; 28 cucharaditas de aceite → 1 botella de 500 ml; 27 tazas de lentejas cocidas → 2 bolsas de 1 kg con rendimiento orientativo explícito; conteo de 30 días reales; existencias independientes por reposición de frescos; redondeo y bloqueo de formatos desconocidos. Los ejemplos son verificaciones del cálculo, no una compra recomendada.

La revisión visual interactiva de esta pantalla sigue pendiente por la limitación del navegador. Las métricas Lighthouse anteriores se refieren a la bienvenida de su versión correspondiente.

## Actualización 0.4: Cocina

Treinta y seis pruebas satisfactorias y compilación de producción con TypeScript estricto. Se comprobaron opciones con filtros y porciones, prioridad de ingredientes disponibles, consumo por vencimiento, exclusión de lotes vencidos/futuros, stock no negativo, marcar/desmarcar, preparación por tandas, consumo de platos sin doble descuento, intercambios que desvinculan preparaciones, proyección mensual sin reutilizar existencias y conservación de datos anteriores.

La revisión visual interactiva de las nuevas pantallas sigue pendiente por la limitación del navegador. No se atribuyen las métricas Lighthouse anteriores a estas pantallas. Supabase no tiene conexión confirmada, por lo que no se declara activado el acceso remoto del nutricionista.

## Corrección 0.4.1: almuerzos y cenas

Cuarenta y tres pruebas satisfactorias, incluidas regresiones específicas del caso informado: ninguna opción principal usa bebida de soya ni yogur como proteína completa, aun con abundante stock; tres opciones con proteínas distintas cuando existen; intercambios y minuta semanal coherentes; bebidas personalizadas en ml; catálogo sin proteína sólida; preparaciones antiguas incompatibles y reparación de menús pendientes sin modificar comidas registradas.

La regla es culinaria y de uso de la app; no valida clínicamente el catálogo de intercambios. Las equivalencias semilla siguen pendientes de revisión por nutricionista.

## Actualización 0.5: familias de recetas

Cuarenta y nueve pruebas satisfactorias. Las seis nuevas verifican variedad de familias en perfiles vegano y omnívoro, filtro por guisos y porciones, títulos y rotación de platos semanales, diferencias entre métodos de preparación, compras coherentes con la minuta y regeneración con variación. Se mantienen las regresiones de bebidas como proteína principal, stock e historial. La revisión visual interactiva de estas pantallas sigue pendiente.

## Corrección 0.5.1: continuidad entre semanas

8 de noviembre de 2026. La rotación automática utiliza la fecha de cada semana; las compras mensuales y la proyección de despensa generan esas mismas semanas. Se conservan las elecciones guardadas y las comidas registradas.

Las 53 pruebas y TypeScript estricto pasan. Se incorporaron cuatro pruebas: regresión del almuerzo y cena entre domingo y lunes en perfiles vegano y omnívoro; elegir, registrar y desmarcar una receta con restauración de existencias; consumir una preparación sin descontar nuevamente sus ingredientes; y coincidencia entre compras y proyección durante 30 días que cruzan semanas.

La verificación cubre la lógica mediante pruebas automatizadas. El navegador de automatización continúa inaccesible: no se completó una revisión visual ni manual de estos flujos. Las limitaciones de Supabase y de instalación PWA indicadas arriba siguen vigentes.
