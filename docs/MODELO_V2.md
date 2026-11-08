# Modelo por alimentación y seguimiento

## Alimentación

El tipo de alimentación (omnívoro, pescetariano, vegetariano o vegano) es independiente de las restricciones y preferencias. El objetivo no prescribe porciones nuevas: las cantidades proceden del plan profesional.

`Plan` añade `restrictions`, `restrictionMode`, `excludedFoodIds` y `preferredFoodIds`. Los alimentos declaran `contains`, `mayContain`, `reviewedFor` y `evidence`. El modo por ingredientes filtra la descripción genérica, sin acreditar ausencia de trazas. El modo estricto exige revisión del producto para cada restricción, referencia de etiqueta y declaración de ingredientes y trazas. Falla si falta información; no sustituye la evaluación del profesional. El catálogo semilla no acredita productos aptos para alergias o celiaquía.

El mismo predicado gobierna generador e intercambios. Las opciones muestran cantidad calculada y causa de compatibilidad o exclusión. Se conserva el grupo y número de porciones. Los menús almacenados de versiones anteriores muestran una advertencia si ya no cumplen los filtros actuales.

## Carrito

El carrito por semana deriva de la lista, permite excluir artículos, editar cantidad/unidad de compra y descontar existencias. Los envases y precios se ingresan manualmente. `ceil(necesidad/contenido)` calcula envases; los importes son estimaciones del usuario, no cotizaciones en vivo.

Las cantidades cocidas, tazas y cucharaditas requieren revisión explícita antes de preparar la lista. Cambiar unidad no provoca una conversión automática. La persona puede copiar una lista que contiene solo artículos y cantidades y abrir los canales oficiales del comercio.

Se verificó el 7 de noviembre de 2026 que Jumbo publica un canal de compra por WhatsApp que recibe listas y prepara carritos para revisar en su web/app. El enlace de Mi Semana abre la página oficial; **no crea ni confirma un carro por API ni envía mensajes**. Lider y Tottus se ofrecen como enlaces a sus tiendas. No se han establecido convenios, credenciales ni integraciones de carrito con comercios.

Fuentes oficiales:

- https://www.jumbo.cl/oferta/compra-whatsapp
- https://www.cencosud.com/centro-de-medios/supermercados/cencosud-potencia-la-experiencia-de-jumbo-mediante-whatsapp
- https://www.lider.cl/landing/static/servicio-al-cliente/quieres-comprar.html

## Composición corporal

`BodyScan` conserva fecha, hora opcional, equipo/método, origen y métricas con unidades explícitas. Admite peso, masa muscular esquelética, masa y porcentaje de grasa, nivel visceral, relación cintura-cadera, agua, masa libre de grasa, IMC, metabolismo basal estimado, IME, ángulo de fase, proteínas, minerales, puntuación y altura del informe. El análisis segmental conserva masa magra/grasa y porcentajes de referencia del equipo por zona.

La relación cintura-cadera nunca se usa como cintura en centímetros; el nivel visceral nunca se convierte a porcentaje ni área. El gráfico agrupa por equipo exacto para evitar combinar escalas de distintos métodos. Muestra diferencias numéricas sin calificarlas como éxito o fracaso. Los valores automáticos de peso objetivo e ingesta sugerida se pueden conservar como transcripción en un detalle cerrado; no generan metas ni prescripciones.

La importación JSON requiere revisión previa y consentimiento de guardado; no se admite en modo demo temporal. La clave fecha/hora/equipo evita duplicar importaciones. No se incorpora OCR ni almacenamiento de la fotografía. Los datos del informe personal aportado por Sebastián están fuera del repositorio y del paquete público.

Fuentes del fabricante sobre interpretación y condiciones:

- https://qr.inbody.com/ri/570/adult/en-US
- https://inbodyusa.zendesk.com/hc/en-us/articles/32676821703956-Since-results-depend-on-hydration-does-dehydration-overhydration-give-inaccurate-InBody-results

## Nutricionista

La vista preparada incluye cumplimiento semanal, mediciones y exámenes. La composición corporal solo se devuelve si el paciente creó un vínculo con `share_body=true`; el control se aplica dentro de la función SQL, además de la interfaz. El valor predeterminado es falso. El vínculo se revoca eliminándolo; varios vínculos vigentes al mismo profesional suman permisos hasta revocar los que comparten composición.

En un proyecto nuevo se ejecuta `schema.sql`. En uno con el esquema inicial se aplica `supabase/migrations/002_body_scopes.sql`. La base conectada aún está pendiente: no se ha comprobado esta ruta en dos cuentas reales.
