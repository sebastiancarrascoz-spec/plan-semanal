# GitHub y alojamiento administrado

## Decisión y estado real

8 de noviembre de 2026. Sebastián eligió GitHub y alojamiento administrado, sin VPS, y proporcionó el repositorio `sebastiancarrascoz-spec/plan-semanal`. Se verificó que estaba vacío y público antes de cargar el código. Se propone Vercel, compatible con el proyecto Next.js existente. La sesión local de GitHub CLI no tiene autenticación válida; se usa la integración conectada de GitHub.

La configuración está preparada, pero GitHub Actions y el despliegue en Vercel no se consideran ejecutados hasta observar resultados en esos servicios. La demo anterior en Sites conserva su URL y sus datos locales.

## Configuración inicial

1. Repositorio seleccionado: [plan-semanal](https://github.com/sebastiancarrascoz-spec/plan-semanal), separado de Inergy y del empleador. Su visibilidad pública permite leer el código; no contiene registros personales ni claves.
2. Cargar el código con la integración de GitHub. No compartir contraseñas ni tokens por el chat.
3. Conectar Vercel e importar ese repositorio. Autorizar únicamente el repositorio necesario. La aplicación se compila con Next.js y Node.js 24, pero se sirve como exportación estática: usar el preset **Other** y salida `out`. `vercel.json` fija `framework: null` y define instalación y compilación. El preset Next.js con salida personalizada `out` intentaba buscar `routes-manifest.json` en esa carpeta y fallaba; la exportación no necesita un servidor Next.js.
4. Seleccionar `main` como rama de producción. Comprobar el primer resultado de GitHub Actions y el primer despliegue Vercel, incluida la instalación PWA, antes de considerar terminada la migración.

GitHub guarda el código; Vercel publica la web. Ninguno de estos pasos activa por sí solo la base de datos ni el acceso del nutricionista. El adaptador Supabase continúa opcional y desconectado.

## Actualizaciones

Cada pull request ejecuta instalación reproducible, pruebas, TypeScript y compilación en GitHub Actions. Al integrar en `main`, Vercel vuelve a ejecutar las pruebas antes de compilar y publicar. Un fallo de pruebas o compilación impide completar ese nuevo despliegue. Las ramas pueden tener vistas previas según la configuración de Vercel. No se necesita una sesión interactiva en un servidor para cada actualización.

El flujo de CI solo tiene permiso de lectura del código y no usa secretos de despliegue. Las acciones oficiales se fijan a los commits resueltos desde sus etiquetas v6 el día de preparación. Los permisos de rama y las reglas de revisión se configuran en GitHub; no se declaran activados por este archivo.

## Datos y cambio de dominio

Los datos actuales viven en el navegador, asociados al dominio de Sites. **No aparecerán automáticamente en el dominio nuevo de Vercel.** Antes de cambiar, usar Ajustes → Exportar datos y conservar ese respaldo. La app actual exporta el estado completo, pero todavía no ofrece restaurarlo desde un archivo en Ajustes; la importación de InBody es un flujo diferente. Antes de trasladar datos personales al nuevo dominio hay que implementar y verificar la restauración del respaldo completo. Hasta entonces, conservar el dominio anterior para los registros existentes. Los respaldos, informes personales y archivos `.env.local` no deben subirse al repositorio.

Para sincronización futura, configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel y volver a desplegar; probar antes las políticas RLS y los flujos entre dos cuentas. No usar una clave `service_role` en el frontend ni en variables `NEXT_PUBLIC_*`.

## Costos y límites

El plan Hobby de Vercel se limita a uso personal no comercial. Antes de ofrecer la app como servicio comercial o a una clínica, revisar el plan aplicable. No se contrató ningún plan de pago.

## Fuentes

- [Vercel y GitHub](https://vercel.com/docs/git/vercel-for-github).
- [Configuración de compilación](https://vercel.com/docs/builds/configure-a-build).
- [Versiones de Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
- [Alcance de Hobby](https://vercel.com/docs/plans/hobby).
- [GitHub Actions para Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs).
