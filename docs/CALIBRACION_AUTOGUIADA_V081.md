# Calibración autoguiada 0.8.1

9 de noviembre de 2026. Protocolo `2026.11.09-0.8.1`.

## Qué cambia y por qué

La versión anterior exigía un entrenador para la primera calibración. Esa condición general era una decisión de producto demasiado restrictiva; no estaba demostrada como requisito universal por las fuentes. La app ahora permite comprobar el control del movimiento siguiendo sus indicaciones y las del equipo, registrar la prueba realizada y usarla como referencia. La revisión profesional del plan es opcional para usar este registro, y nunca se crea por defecto.

El formulario distingue «autorregistro», «revisión profesional declarada» y técnica que no se puede confirmar. La app no observa la ejecución. Los registros antiguos conservan origen desconocido; no se convierten en revisados por un profesional. Una comprobación propia no anula restricciones médicas ni sustituye una evaluación cuando los síntomas o antecedentes la requieren. Si no se entiende el ajuste o movimiento, se pide una demostración antes de probar.

## Investigación consultada

- [ACSM 2026, posición sobre entrenamiento de fuerza](https://pubmed.ncbi.nlm.nih.gov/41843416/): sintetiza revisiones de intervenciones en adultos sanos. Fundamenta entrenamiento progresivo e individualización; no establece que la presencia permanente de entrenador sea condición universal ni valida esta app.
- [Fisher et al., 2022, supervisión frente a entrenamiento autónomo](https://journal.iusca.org/index.php/Journal/article/view/101/185): metaanálisis exploratorio que sugiere una ventaja pequeña en rendimiento, sobre todo fuerza, y poca diferencia en composición corporal. Su heterogeneidad impide concluir que supervisar sea inútil o que ambos enfoques tengan idéntica seguridad. Decisión del producto: permitir el registro autoguiado, sin prometer equivalencia clínica.
- [Steele et al., predicción de repeticiones](https://pubmed.ncbi.nlm.nih.gov/29204323/): la percepción de repeticiones restantes tiene error. El RIR orienta el registro, no certifica capacidad ni técnica.
- [ACSM, evaluación previa al ejercicio](https://doi.org/10.1249/FIT.0000000000000202): considera actividad habitual, síntomas, enfermedad conocida e intensidad prevista. Evita derivaciones universales innecesarias y mantiene evaluación en situaciones indicadas. La app no diagnostica diabetes por resistencia a la insulina ni decide aptitud médica desde el InBody.

El conocimiento publicado puede convertirse en instrucciones reproducibles. La personalización de kg necesita además observaciones de rendimiento: la masa muscular corporal total no identifica la fuerza de un ejercicio, el ajuste de una máquina ni su relación mecánica. No se ha hallado en estas fuentes una fórmula que convierta válidamente ese dato del InBody en una carga individual para cada equipo. Esa ausencia de un método aplicable no se resuelve inventando una cifra.

## Reglas conservadas

Prueba submáxima, carga ligera controlable, margen de repeticiones, interrupción si aparece dolor o pérdida de control. Sin técnica confirmable no se emite referencia numérica. La propuesta de incremento sigue exigiendo dos fechas comparables con todas las series, esfuerzo y recuperación registrados; no se aplica automáticamente. La impresión ahora describe estas mismas condiciones y permite observaciones propias.

La duración de descanso y el máximo de dos ensayos de calibración son decisiones explícitas de la plantilla, no umbrales clínicos universales. Si aparece dolor de pecho, desmayo o falta de aire intensa se detiene la sesión y se busca atención. La investigación no permite asegurar que un programa concreto sea adecuado para cualquier condición clínica.

## Verificación

Se añadieron regresiones para permitir el autorregistro sin revisión profesional, mantener bloqueos por dolor y técnica pendiente, distinguir procedencia de la revisión y rechazar etiquetas inventadas. No se simula una revisión clínica. La comprobación visual del navegador sigue pendiente.
