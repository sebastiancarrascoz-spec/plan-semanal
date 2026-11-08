# Cocina: opciones, despensa y preparación

## Qué puede hacer esta versión

Una quinta sección, Cocina, reúne Qué comer, Despensa y Preparar semana. Ofrece hasta tres combinaciones diferentes por comida, calculadas con las porciones de cada grupo y los filtros del plan. Se informa si el catálogo permite menos de tres; no se agregan alimentos excluidos para completar la pantalla.

Las recetas son plantillas simples de montaje (bowl, tostadas, avena y colación), con ingredientes y cantidades derivados del plan. El tiempo indicado excluye la cocción previa de cereales o legumbres. Son ideas culinarias sobre un catálogo ilustrativo; la app no acredita las equivalencias nutricionales. Los alimentos personalizados sin encaje en las plantillas requieren ampliar el recetario.

Las opciones priorizan ingredientes registrados que alcanzan para la comida, disponibilidad parcial y vencimientos próximos. Los platos ya preparados compatibles tienen prioridad. Elegir una opción actualiza la minuta; se marca como realizada cuando la persona efectivamente come. Las comidas marcadas conservan su snapshot al regenerar el resto de la semana.

## Despensa

Cada lote guarda alimento, nombre y unidad del catálogo, cantidad física, conversión a la unidad del plan, ubicación, fecha disponible y vencimiento opcional. Se pueden registrar envases comprados o porciones de un alimento ya preparado. El alta de envases utiliza los formatos editados de la compra mensual activa, si existen. La conversión queda guardada como snapshot del lote; no cambia retroactivamente al editar un rendimiento.

No se inventan existencias. La despensa inicial está vacía. Los lotes vencidos o todavía no disponibles se excluyen de los cálculos; las fechas sin completar se identifican como tales. La ausencia de vencimiento no acredita seguridad alimentaria. La persona debe revisar la etiqueta y el estado real del producto.

Al marcar una comida se descuenta la cantidad registrada, comenzando por el vencimiento más próximo. La falta de ingredientes en la despensa digital no impide registrar un hábito: se guarda la cantidad no cubierta, sin cantidades negativas. Esto permite comer fuera o no tener todo el inventario registrado. Al desmarcar se restauran los movimientos de los lotes que aún existen; no se recrean lotes eliminados. Las comidas históricas previas a esta versión no generan descuentos retroactivos.

## Platos preparados

La persona registra un nombre, número de porciones completas, fecha, ubicación y fecha de consumo, sin plazo automático. Registrar la preparación descuenta los ingredientes disponibles multiplicados por sus porciones. Se pueden registrar preparaciones hechas con ingredientes no inventariados; esos faltantes no crean stock negativo.

Una porción preparada solo se ofrece si coincide con los grupos y cantidades del turno, los alimentos actuales y sus filtros, y las fechas. Consumirla reduce una porción del lote preparado; no vuelve a descontar sus ingredientes. Un intercambio de alimentos elimina la referencia a la preparación original. Quitar un plato preparado no devuelve ingredientes que ya se cocinaron.

## Compras sin doble descuento

La proyección mensual recorre los días en orden y consume una copia virtual del inventario. Así, una misma bolsa no se descuenta en todas las semanas. Se respetan fechas disponibles y vencimientos. Las comidas ya registradas no se vuelven a proyectar. Los platos preparados se descuentan cuando se eligieron explícitamente en la minuta.

Las necesidades restantes se convierten a formatos comerciales con el modelo 0.3. Las existencias adicionales de los ajustes de compra son solo envases **fuera de la despensa registrada**; la pantalla lo aclara. La simulación no modifica las existencias reales. Los sobrantes y la proyección son estimaciones sujetas al registro de la persona.

## Seguridad de cocina y fuentes

Las fechas de consumo son ingresadas por el usuario. La app no calcula automáticamente cuánto dura cada preparación ni convierte una fecha en garantía de inocuidad. Los textos indican enfriar y guardar las sobras pronto y respetar las instrucciones del producto.

Fuentes primarias consultadas para las instrucciones generales:

- FoodSafety.gov: temperaturas mínimas de cocción y recalentado. Pollo y sobras: 74 °C; pescado: 63 °C, comprobados con termómetro. https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures
- MPI (Nueva Zelanda): conservación de sobras, enfriado y atención al arroz. https://www.mpi.govt.nz/food-safety-home/preparing-and-storing-food-safely-at-home/safe-food-preparation-cooking-and-storage-at-home

## Privacidad y cuentas

Los lotes, preparaciones y movimientos se conservan en el estado local y en la cola compactada de sincronización si se activa Supabase. La vista del nutricionista sigue usando una lista explícita de datos autorizados; esta versión no amplía su acceso a la despensa. Se ofreció la conexión de Supabase, pero no se considera conectada sin confirmación. La lectura remota con dos cuentas sigue pendiente de activación y prueba.
