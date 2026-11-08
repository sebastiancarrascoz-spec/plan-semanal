# Recetas y minuta culinaria

La actualización amplía las plantillas a guiso de legumbres, salteado, plato al horno, ensalada tibia y sándwich. Cada familia limita los alimentos que puede utilizar y añade instrucciones propias. Las bebidas continúan excluidas como proteína principal de almuerzo/cena. No se agregaron alimentos con equivalencias nutricionales nuevas.

## Opciones

En Cocina se pueden explorar todas las preparaciones o filtrar por familia. La selección busca diversidad de proteína, método y combinación de cereal. Cambiar solo la verdura no crea una opción adicional. Las cantidades conservan la distribución por grupo del plan, incluidos turnos con menos carbohidratos.

Los ingredientes disponibles y los platos preparados mantienen prioridad; cada tarjeta informa cuántos ingredientes están registrados en cantidad suficiente. Las instrucciones utilizan solo los ingredientes asignados y agua para cocinar cuando corresponde. El aceite y la grasa no se añaden fuera de las porciones del turno.

Los tiempos de montaje excluyen cocciones previas. Las indicaciones de horno se acompañan de la temperatura interna del alimento cuando aplica, según las fuentes de seguridad ya documentadas. La fecha de consumo de los platos preparados sigue siendo ingresada por el usuario y no se calcula automáticamente.

## Minuta y compras

`composeWeeklyMenu` parte de la distribución del plan y asigna un plato con título a cada almuerzo y cena para los que existen plantillas compatibles. Rota entre candidatos dentro de la semana para evitar platos principales idénticos en días consecutivos y busca alternar almuerzo/cena del día cuando hay alternativas. Cuando el catálogo es limitado, no inventa opciones adicionales.

La variación de regeneración permite cambiar la asignación sin alterar las porciones. Las comidas registradas conservan su snapshot; las elecciones personales con título no se reemplazan durante la migración. Las sugerencias automáticas pendientes sin plato identificado se actualizan al nuevo modelo.

La proyección de despensa y Compras usan la misma minuta culinaria para los días sin menú guardado. La lista de ejemplo en `data/minuta.json` se genera con esta función. Los ingredientes y unidades siguen el catálogo; sus equivalencias de ejemplo requieren revisión profesional.

## Límites

Estas son plantillas culinarias, no un catálogo clínicamente validado ni una recomendación de porciones personalizada. Los alimentos definidos por el usuario que no encajan en las familias pueden requerir plantillas adicionales. No se han incorporado calorías, recetas externas con ingredientes ocultos ni equivalencias nuevas. No se modifica el informe personal InBody ni se publica su información.

El seguimiento remoto del nutricionista continúa pendiente de conexión y validación con cuentas reales.
