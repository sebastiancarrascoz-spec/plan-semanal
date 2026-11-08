# Compras en formatos comerciales

## Período y origen

La vista mensual representa 30 días consecutivos desde `shoppingStart`; no es un mes calendario ni la semana seleccionada en Semana. La alternativa semanal representa siete días. Los extremos se incluyen una vez. Un calendario diario obtiene los menús guardados compatibles y proyecta los días restantes desde el plan actual; la pantalla informa ambos conteos. Es una previsión que puede cambiar al modificar el menú.

Se separan compra principal del período y reposición de frescos. El modo mensual ofrece cinco tramos de reposición: 7 + 7 + 7 + 7 + 2 días. Los frescos de cada tramo se agregan desde sus días reales, no como promedio del mes. La cadencia es editable y no reemplaza las condiciones de conservación del producto.

## Cantidad comprable

`consumoEstimado = cantidadDelMenú × factorDeCompra`.

`necesidad = max(0, consumoEstimado − envasesDisponibles × contenidoDelEnvase)`.

`envasesPorComprar = ceil(necesidad / contenidoDelEnvase)`.

La fila principal muestra el nombre de compra y esos envases; las tazas, gramos cocidos y cucharaditas del menú solo aparecen en el detalle. La exportación usa el mismo texto en envases. Los productos marcados como comprados o excluidos se omiten de la lista pendiente.

Los tamaños iniciales (bolsas de 500 g/1 kg, botella de 500 ml, caja de 1 L, etc.) son **plantillas editables**, sin SKU, precio, stock o disponibilidad acreditados. No se presentan como una oferta de supermercado. Si el usuario cambia el tamaño, se recalcula la cantidad de envases. Los precios son opcionales y manuales.

Las existencias se ingresan en envases completos o fracciones. Se conservan por período para la compra principal y por fecha para cada reposición. El sobrante es proyectado: no se contabiliza automáticamente como stock real futuro, porque no se ha comprobado la compra ni el consumo. El usuario debe revisar su despensa.

## Rendimientos y alcance

- Avena, pan, nueces, tofu, pollo, pescado, yogur y bebida de soya mantienen la unidad de peso/volumen del catálogo semilla. Se asume que la cantidad declarada corresponde al producto comprado; si el profesional la expresa cocida o escurrida, ajustar el factor.
- Aceite: cucharadita métrica de 5 ml como equivalencia de planificación. Referencia NHS: https://www.royalfree.nhs.uk/patients-and-visitors/patient-information-leaflets/kidney-patients-how-manage-your-fluid . Una cuchara doméstica puede diferir.
- Lentejas: estimación de 1 libra seca (453,59237 g) por unas 7 tazas cocidas. Fuente primaria USDA: https://fns-prod.azureedge.us/sites/default/files/resource-files/LentilsDry.pdf . Es un rendimiento aproximado, dependiente de la cocción.
- Porotos: estimación de 1 libra seca por unas 6 tazas cocidas. Fuente de extensión universitaria: https://food.unl.edu/article/how-cook-dry-beans-scratch/ . El tipo de poroto y la preparación pueden variar.
- Arroz integral y quínoa: supuesto inicial editable de 3 g cocidos por 1 g seco. **Convención orientativa de planificación, sin validación contra la preparación del usuario**. La pantalla lo identifica como estimación y permite reemplazarlo.
- Palta: supuesto inicial de 100 g de pulpa por unidad. Tomate: 180 g por taza picada; brócoli: 90 g por taza picada; hojas: 30 g por taza. **Supuestos iniciales de planificación**, sensibles al tamaño, corte y estado crudo/cocido; están descritos dentro del ajuste de cada producto y requieren revisión contra las porciones reales del plan.

No se modifican porciones, calorías ni objetivos nutricionales al cambiar un formato de compra. Un alimento personalizado con unidad no reconocida queda pendiente de configurar; no se exporta como si tuviera una conversión conocida. No se aplican los rendimientos de un alimento semilla a otro que fue renombrado.

## Datos y compatibilidad

`purchaseBaskets` almacena el nuevo modelo. `carts` y `bought` de versiones previas se preservan para el respaldo y no se convierten a envases de manera implícita. La migración conserva mediciones, exámenes, registros de alimentación y composición corporal.

La vista anterior de porciones semanales y el editor de cantidades cocidas se retiraron del flujo de Compras. El código de cálculo legado permanece aislado para compatibilidad y pruebas de la versión anterior.
