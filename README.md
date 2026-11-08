# Mi Semana

App personal en español de Chile para seguir un plan por porciones. Es una demo funcional con persistencia local y adaptador Supabase opcional. No diagnostica ni prescribe tratamientos.

## GitHub y alojamiento administrado

Configuración preparada para GitHub Actions y Vercel, con Node.js 24, pruebas antes de publicar y exportación estática PWA. Repositorio seleccionado: [plan-semanal](https://github.com/sebastiancarrascoz-spec/plan-semanal). La conexión y el primer despliegue Vercel requieren confirmación en ese servicio. Ver [pasos y estado real](docs/GITHUB_VERCEL.md). Antes de cambiar de dominio, exportar el respaldo desde Ajustes: los datos locales no se trasladan solos.

## Versión 0.5: preparaciones reconocibles

Cocina ofrece guisos de legumbres, salteados, platos al horno, ensaladas tibias y sándwiches, con pasos propios. Puedes filtrar por preparación. Las opciones principales priorizan variedad de método y proteína antes de cambiar solo verduras.

La minuta semanal automática usa estas preparaciones con título y conserva las porciones del plan. Compras y la proyección de despensa utilizan la misma minuta para los días sin plan guardado. Las selecciones personales y comidas registradas se conservan. Ver [modelo de recetas](docs/RECETAS_V05.md).

## Corrección 0.4.1

Almuerzo y cena seleccionan proteínas de plato. Las bebidas y el yogur quedan disponibles para desayuno/colación y no se usan como todo el plato proteico principal. La misma regla se aplica a recetas, menús, intercambios y preparaciones. Se reparan las sugerencias futuras pendientes; los registros realizados se conservan. Las opciones cambian proteína o cereal antes de variar solo verduras. Ver [alcance de la corrección](docs/ALMUERZOS_041.md).

## Versión 0.4: Cocina

La sección **Cocina** incorpora hasta tres opciones por comida, despensa y congelador, y preparación de varias porciones. Las opciones respetan el plan y los filtros; muestran lo registrado, lo que falta y pasos breves. La despensa descuenta ingredientes al marcar comidas, permite revertir movimientos y alimenta la proyección mensual de compras sin reutilizar stock entre semanas.

Los platos preparados conservan sus porciones, fecha y conservación. Solo se ofrecen cuando coinciden con la comida y siguen dentro de la fecha registrada. Consumir una porción preparada no vuelve a descontar ingredientes. La cocina empieza vacía; no contiene existencias ni platos ficticios. Ver [modelo y límites de Cocina](docs/COCINA_V04.md).

La conexión de Supabase fue ofrecida y aún no se ha confirmado. El seguimiento remoto del nutricionista sigue pendiente; las tres mejoras de cocina funcionan con almacenamiento local.

## Versión 0.3: compras mensuales

Compras abre por defecto una ventana de **30 días desde una fecha propia**, independiente de la semana de registro. La lista principal muestra bolsas, botellas, cajas, bandejas o unidades. Los frescos se calculan para cada reposición de hasta siete días, con un último tramo de dos días.

Las cantidades del menú quedan dentro del detalle del cálculo. Los formatos se redondean hacia arriba después de descontar existencias en envases. Hay formatos iniciales editables, rendimientos de cocción orientativos y referencias donde corresponden. Para alimentos personalizados sin conversión se exige definir la presentación. Ver [modelo de compras](docs/COMPRAS_V03.md).

Los datos previos se conservan. Las compras de este modelo usan un nuevo registro por período y por fecha de reposición; no reinterpretan automáticamente las cantidades manuales del antiguo carrito.

## Versión 0.2

- Perfil omnívoro, pescetariano, vegetariano o vegano; restricciones y preferencias independientes.
- Opciones de intercambio con cantidades y explicación de compatibilidad.
- Carrito semanal con existencias, cantidades de compra, envases y precios manuales. Lista para copiar al canal oficial de Jumbo; no hay API de carritos conectada.
- Registro e importación JSON de composición corporal: peso, músculo, grasa, análisis segmental y otros resultados de InBody. Gráficos agrupados por equipo.
- Vista previa del seguimiento nutricional. La composición corporal requiere un permiso separado en el vínculo del paciente.

Consulta [el modelo de la versión 0.2](docs/MODELO_V2.md). Los informes personales están fuera del repositorio y del despliegue. La foto no se almacena ni se publica. Para importar un archivo personal usa Progreso → Importar registro, revisa y guarda después de autorizar el guardado.

Si ya ejecutaste el esquema inicial, aplica `supabase/migrations/002_body_scopes.sql` para actualizar los permisos. La base de datos de la demo sigue sin conectar.

## Ejecutar

Node 22 o 24 y npm.

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:3000. Para producción y service worker:

```sh
npm test
npm run typecheck
npm run build
node scripts/serve.mjs
```

Abrir http://127.0.0.1:3017. `out/` es la salida estática. Los iconos se generan antes del build y el precaché se genera después. Se requiere HTTPS para instalar desde una URL pública; en iPhone usar Compartir → Agregar a inicio, y en Android el menú de instalación del navegador.

## Datos de ejemplo

`lib/engine.ts`: plan 6 carbohidratos, 10 proteínas, 2 grasas, 4 cucharaditas de aceite, 2 frutas y 6 verduras. Distribuciones solicitadas por el usuario. **No es una recomendación nutricional**. JSON en `data/plan.json`, `data/minuta.json` y `data/compras.json`.

```sh
node --experimental-strip-types scripts/seed.ts
```

## Conectar cuentas y nutricionista

1. Crear un proyecto propio de Supabase. Ejecutar `supabase/schema.sql` una vez en su editor SQL.
2. Activar acceso por enlace de correo y autorizar la URL del despliegue en Auth → URL Configuration. Configurar envío de correo de producción.
3. Copiar `.env.example` a `.env.local`; introducir URL del proyecto y clave pública anon/publishable. Nunca usar `service_role` en el frontend.
4. Compilar y desplegar de nuevo. En Ajustes → Nutricionista y cuenta, iniciar sesión y sincronizar.
5. El paciente crea un código y lo entrega por un canal de su elección. El profesional inicia sesión en su propia cuenta gratuita y canjea el código. El paciente puede revocar el acceso.

La demo publicada no tiene estas variables: no crea cuentas ni comparte información. El SQL y las rutas cloud no se han validado contra una instancia real. No usar con pacientes hasta completar pruebas de RLS, vinculación, sincronización, borrado y revisión de privacidad.

## Vercel

Importar este repositorio en una cuenta Vercel, seleccionar Next.js, build `npm run build`, salida `out`, agregar las dos variables públicas si se usará Supabase y desplegar. El entorno de esta entrega no tiene una cuenta Vercel conectada; la demo usa Sites como alojamiento alternativo. No se ha realizado despliegue en Vercel.

## Archivos

- `lib/engine.ts`: tipos, equivalentes, generador e intercambios.
- `lib/state.ts`: contrato del estado local.
- `lib/cloud.ts`: cliente Supabase opcional.
- `app/page.tsx`: flujos principales y registro.
- `app/globals.css`: tokens, responsive, impresión, modo oscuro y movimiento reducido.
- `public/sw.js`: precaché y receptor de push; falta proveedor de envío.
- `supabase/schema.sql`: esquema, RLS y RPC.
- `docs/ARQUITECTURA.md`: relaciones, privacidad y límites de sincronización.
- `docs/ALCANCE.md`: supuestos, pendientes y criterios de aceptación.

## Seguridad del producto

No se ofrecen metas calóricas ni tasas de pérdida de peso; por tanto no se puede fijar una meta de menos de 1.500 kcal ni más de 1 kg/semana. El plan por porciones no permite inferir su valor energético con este catálogo: requiere revisión del profesional. Los avisos de resultados inusuales son orientativos y no un sistema de diagnóstico o urgencias.

Fuentes educativas dentro de la app: NIDDK (resistencia a la insulina), CDC (actividad física) y NHLBI (triglicéridos). Los datos de ejemplo no se atribuyen a esas fuentes.
