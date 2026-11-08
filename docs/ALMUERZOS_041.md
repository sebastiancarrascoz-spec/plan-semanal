# Corrección: proteína del plato principal

El caso informado por el usuario era un almuerzo con pan integral, 600 ml de bebida de soya, aceite y verduras. El catálogo semilla define 200 ml por porción y el plan de ejemplo asigna tres porciones de proteína a ese turno. El algoritmo multiplicaba las porciones sin considerar el uso culinario del alimento. Dos opciones con el mismo pan y bebida se diferenciaban solo por la verdura.

## Reglas corregidas

- `foodForMeal` combina compatibilidad dietaria con contexto de comida. En almuerzo y cena, las proteínas se eligen entre alimentos de plato: legumbres, tofu, pollo o pescado según perfil y catálogo. Las bebidas y el yogur del ejemplo se reservan para desayuno/colación.
- Se reconocen bebidas por metadatos, nombre y unidades de volumen. No depende solo del identificador de la bebida de soya. El aceite no se ve afectado: pertenece a otro grupo.
- Si faltan proteínas de plato compatibles, el generador informa la brecha; no rellena las porciones con bebidas. Cocina muestra las opciones que sí puede construir.
- La misma regla se usa en la minuta semanal, los intercambios, las recetas, las proyecciones de compra y la elegibilidad de platos preparados.
- En las opciones principales se prioriza variar la proteína y, después, la combinación de proteína y cereal. Cambiar solo la verdura no crea una opción nueva. Si no hay tres combinaciones distintas, se muestra un número menor.
- Los menús guardados se reparan solo para fechas actuales/futuras y comidas no marcadas. Las comidas ya registradas mantienen su snapshot. Las preparaciones anteriores incompatibles se conservan como datos, pero dejan de ofrecerse como opción principal.

## Alcance nutricional

Esta corrección mejora el uso culinario de los alimentos y responde a la preferencia expresada por el usuario. No determina que una bebida de soya sea inadecuada para una persona ni prescribe cantidades nuevas. El rol de un alimento en la app no certifica su equivalencia proteica.

Las equivalencias iniciales son datos de ejemplo aportados en el encargo; requieren revisión del nutricionista antes de usarlas como plan personal. Las porciones por grupo no se reducen, aumentan ni convierten a calorías como parte de esta corrección.

Las Guías Alimentarias para Chile incluyen legumbres en guisos y ensaladas como opciones generales. Esa fuente no valida las cantidades del catálogo de esta app: https://www.minsal.cl/guias-alimentarias-para-chile/ .

## Verificación

Se agregaron siete regresiones y se mantuvieron las 36 pruebas anteriores: 43 pruebas satisfactorias. Incluyen el caso con mucho stock de bebida de soya, dieta vegana/vegetariana/omnívora, ausencia de proteína sólida, platos preparados antiguos y preservación de historial.
