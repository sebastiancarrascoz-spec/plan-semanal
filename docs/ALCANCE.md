# Supuestos y preguntas abiertas

## Decisiones

- No se recibió el HTML de referencia; se implementaron las cuatro pestañas descritas.
- Personas adultas, un plan activo, un usuario por navegador/cuenta y unidades declaradas, sin cálculo calórico.
- Los ejemplos del catálogo son editables, no están validados como intercambios clínicos equivalentes.
- Planes omnívoros, pescetarianos, vegetarianos y veganos, con filtros por ingredientes y modo estricto sujeto a etiqueta revisada. Las equivalencias y etiquetas aún requieren revisión profesional.
- Siete hábitos diarios en el anillo: cinco comidas y dos caminatas. Agua y sueño no puntúan. Incluso un turno con cero porciones es un ítem; se debe revisar esa convención con el profesional.
- La rutina es una plantilla general; tres series de 8–12 repeticiones y plancha 20–40 segundos. No sustituye una evaluación física. Las fases son orientación, sin progresión automática por fecha inicial.
- Exportación PDF mediante el diálogo de impresión del navegador, no generación de un archivo desde servidor.
- La entrega usa Sites para demo pública. Vercel y Supabase no están conectados.

## Pendientes explícitos

1. Conectar y probar Supabase real: dos cuentas aisladas, canje, revocación, lectura autorizada, borrado y conflictos entre dispositivos.
2. Envío push programado con app cerrada; actualmente hay un recordatorio configurable solo con app abierta y un receptor de push. No están programados automáticamente lunes, comidas ni exámenes.
3. Panel nutricional con agregados semanales por paciente y edición delegada del plan. La ruta preparada ofrece cumplimiento por semana, mediciones, exámenes y composición corporal autorizada, sin escritura del nutricionista.
4. Ampliar las plantillas culinarias de Cocina con recetas revisadas, más alimentos por horario y un catálogo validado por nutricionista. Las opciones actuales conservan los grupos y porciones, pero sus equivalencias siguen siendo ilustrativas.
5. Gráficos de exámenes, comparación estructurada antes/después, racha semanal y resumen de 12 semanas. Hay gráficos de cintura y peso, e historial de exámenes.
6. Restaurar respaldos JSON, historial completo de planes, resolver conflictos cloud y registro auditable por evento.
7. Revisión clínica de avisos extremos y educación, revisión legal y del cifrado del alojamiento; no declarar cumplimiento legal automático.
8. OCR, precios en vivo, carritos por API, restaurantes, modo familia y grupos privados: fuera de esta versión. El carrito interno acepta precios manuales.

## Preguntas para la siguiente versión

- ¿Qué catálogo y tamaños de porción aprobará el nutricionista?
- ¿El profesional podrá editar, o solo el paciente copiará sus ajustes?
- ¿Cómo se tratarán alergias, enfermedad renal, embarazo y medicamentos que puedan causar hipoglucemia?
- ¿Qué organización será responsable de los datos, con qué país de alojamiento y retención?
- ¿Qué tiempo de sueño, agua y frecuencia de entrenamiento serán personalizados?

## Criterios

Comida en un toque desde Semana: implementado. Generador y compras: funciones síncronas, sin servicio externo. Guardado local y precaché: implementados; requieren primera carga conectada. Cola compactada cloud: implementada, pendiente de prueba con backend. Nutricionista gratuito: código y vista preparados, pendiente de backend. Las mediciones Lighthouse son locales sobre la bienvenida; ver el informe de validación.
