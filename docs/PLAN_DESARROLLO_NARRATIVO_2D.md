# Plan de desarrollo narrativo 2D

Rama: `experiencia-narrativa-2d`. Especificación: [PRESENTACION_NARRATIVA_2D.md](PRESENTACION_NARRATIVA_2D.md). Estado inicial: planificación preparada; entregas de implementación pendientes.

## Reglas de ejecución

Leer AGENTS.md y el contexto antes de trabajar. Preservar cambios locales, aislamiento del código, recuperación, registros y seguimiento docente. Usar Node 24 y pnpm existentes. Consultar las guías locales de Next antes de cambiar sus APIs. Probar con datos ficticios en entorno separado de producción. Documentar al terminar cada entrega lo implementado, las verificaciones y sus límites. No publicar automáticamente.

El código del estudiante sigue siendo JavaScript vanilla. La escena representa el estado real del DOM; los logros representan progreso persistente. La finalización de una animación nunca debe ser condición única de guardado. Seis capítulos, 120 minutos totales, 100 de práctica; Gali volador; ayudas sin penalización; intercambio de roles después de 2 y 4.

## Entregas secuenciales

### 1. Base verificable

Revisar rama, cambios, herramientas y dependencias. Ejecutar typecheck y pruebas de lógica/API existentes. Identificar conexiones entre GameView, Workshop, frame, runtime, local, tipos, validación y registros. Registrar fallos previos. Criterio: informe de base con resultados y pendientes reales.

### 2. Guion del capítulo 4

Definir diagnóstico físico, pieza, equipo receptor, consigna, código inicial, solución y comprobaciones. Escribir secuencia de cámara y Gali, más ayudas. Definir respuesta ante error, ejecución nueva, salida, recarga y revisita. Criterio: cada acción visual tiene disparador y vínculo pedagógico definidos.

### 3. Dirección visual y recursos de referencia

Crear referencia coherente de Gali volador, poses y taller; capas, cinta, repuesto y receptor independientes. Documentar paleta, proporciones, escalas y procedencia de recursos. Usar la habilidad imagegen si se crean ilustraciones raster. No producir toda la campaña todavía. Criterio: composición revisada en el tamaño real de la interfaz.

### 4. Escena 2D básica

Crear componente separado de la lógica pedagógica, con capas, Gali y encuadres. Evaluar HTML/CSS/SVG o recursos raster según la referencia; no agregar librerías sin necesidad demostrada. Resolver carga fallida y disposición en 1366×768. Mantener cámara estable al editar, foco y preferencia de movimiento reducido existente, sin nuevos controles. Criterio: escena integrada y utilizable.

### 5. Respuesta al código real

Conectar cinta al snapshot de la ejecución actual. Arranque detenido, alternancias activar/detener, rechazo de respuestas obsoletas. Mantener iframe de pruebas separado de vista previa. Un logro anterior no hace funcionar código incorrecto. Criterio: pruebas conductuales con solución correcta e incorrecta.

### 6. Capítulo 4 completo

Tras comprobaciones correctas, Gali recoge repuesto, vuela al equipo apagado, instala y cierra carcasa; cámara acompaña y revela sector reparado. Resolver interrupción, recarga, desmontaje y revisita sin perder progreso o duplicar logros. Sin precisión temporal. Usar ayudas actuales hasta entrega 7 si es necesario. Criterio: capítulo jugable de principio a fin y evidencia visual. Probar en equipo escolar si está disponible; registrar como pendiente si no lo está. Ajustar antes de generalizar.

### 7. Herramientas y compatibilidad

Implementar Revisá el plano / Consultá el manual / Mirá un ejemplo con acceso independiente, identificadores estables y registro por apertura real. Revisar tipos, validadores, almacenamiento, exportación, Sheets y consolidación docente juntos. Actualmente hint es numérico y el guardado exige VERSION exacta: diseñar migración o conservación explícita antes de cambiar contratos. No borrar ni reinterpretar partidas anteriores silenciosamente. Criterio: compatibilidad y ausencia de eventos duplicados verificadas con fixtures separados.

### 8. Contenido de seis capítulos

Para cada uno: diagnóstico con evidencias, objetivo, código inicial, solución, casos de prueba, errores frecuentes, tres ayudas, consecuencia visual, reflexión y extensión optativa. Mantener selección → texto → eventos → controles → value → trim/validación/limpieza. Respetar 12/14/16/20/16/22 minutos como referencias, sin temporizador. Criterio: ejercicios y soluciones coherentes con el intérprete y los contenidos enseñados.

### 9. Resto de escenas

Implementar capítulos 1–2, luego 3, 5 y 6. Reutilizar Gali y recursos. Progreso visible persistente y controles que reflejen el DOM actual. Selección representa inspección, no modificación del elemento. Reparaciones internas con equipos apagados. Criterio: seis capítulos completos y continuidad narrativa.

### 10. Ingreso, recorrido y roles

Actualizar ingreso, mapa y navegación conservando demo, pareja y recuperación. Recordatorios no bloqueantes después de capítulos 2 y 4. Acceso docente por URL. Revisar teclado, foco, contraste y pantallas pequeñas. Criterio: recorrido completo sin pérdida de información.

### 11. Transmisión y bitácora

Persistir último alias válido confirmado desde interacción real, nunca desde pruebas automáticas; conservarlo tras Limpiar. Valor alternativo Equipo Galileo. Crear recorrido final, transmisión y confirmación. Bitácora con capítulos, conceptos, comprobaciones y herramientas. Partidas incompletas muestran avance real. Criterio: personalización, recarga y finalización sin dependencia del final de la animación.

### 12. Verificación integral y preparación de clase

Recorrer campaña correcta/incorrecta, recarga, revisitas, ayudas, recuperación y fallas de red. Cinco partidas independientes, sin multijugador sincronizado. Verificar datos, ausencia de duplicados, teclado y 1366×768. Ejecutar typecheck, tests pertinentes, navegador y build; adaptar pruebas ligadas al renderer previo sin debilitar criterios pedagógicos. Medir carga y rendimiento en equipos escolares, ensayar duración y actualizar guía docente. Criterio: informe con evidencia y límites. Publicación posterior cuando corresponda, sin reemplazar despliegues ni contratar recursos sin autorización.

## Encargo reutilizable

Trabajá en Galileo, rama experiencia-narrativa-2d. Leé AGENTS.md, el contexto, la presentación narrativa y este plan. Revisá y preservá el estado actual. Implementá la entrega indicada hasta cumplir sus criterios, resolviendo decisiones rutinarias dentro del alcance aprobado. Probá fuera de los registros reales, actualizá el seguimiento e informá cambios, verificaciones y pendientes. No publiques automáticamente.

## Seguimiento

- Preparación: rama y especificación existentes; plan guardado.
- Entrega inicial, 27/10/2026: piloto funcional del capítulo 4 implementado. Se agruparon 1–6 para priorizar rapidez según pedido del usuario. La dirección visual se concretó directamente en SVG/CSS, sin nueva biblioteca ni recursos externos. Queda pendiente evaluación en el equipo físico escolar.
- Guion implementado: servidor apagado con ventilador de repuesto → código de Activar/Detener → comprobaciones → Gali recoge la pieza → vuelo y acercamiento de cámara → instalación → reparación persistente. El movimiento de la cinta depende solo del DOM de la vista previa. Recarga/revisita muestran el repuesto instalado sin repetir la secuencia.
- Ayudas del capítulo 4: tres accesos independientes con los mismos contenidos e IDs 1/2/3 existentes. El plano incluye además el HTML. Se registra la primera consulta a cada ayuda, conservando el significado histórico y sin cambiar VERSION ni el esquema de eventos. La ampliación a todos los capítulos y la bitácora detallada de herramientas siguen pendientes (entrega 7).
- Acceso rápido desde el ingreso: «Probá la nueva escena · Capítulo 4». Crea una DEMO local, claramente identificada, con los tres primeros capítulos preparados; no envía datos. Se conserva el flujo de recuperación antes de reemplazar una partida.
- Entregas 8–11: pendientes. La entrada, los capítulos restantes y el resumen aún usan la presentación anterior. No confundir este piloto con la campaña narrativa completa.
- Verificación inicial: TypeScript y 16 pruebas de lógica/API aprobadas; pruebas de campaña, navegación, resiliencia, progreso y piloto ejecutadas en copia aislada sin credenciales. Evidencia visual en tests/artifacts/narrativa-*.png (no versionada). Resultado final de comprobaciones en el contexto de continuidad.
