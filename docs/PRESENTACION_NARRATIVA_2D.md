# Galileo — Encendé la estación

## Dirección de la rama narrativa

Fecha: 27/10/2026. Rama: `experiencia-narrativa-2d`.

Estado: definición de experiencia; todavía no implementada. La rama parte del proyecto existente. Este documento reemplaza, para esta variante, la duración de 40 minutos y la obligación de usar Three.js como presentación principal. Conserva el núcleo de ejecución aislada, el código JavaScript vanilla del estudiante, seis capítulos, registros, recuperación y seguimiento docente. No presupone que la nueva escena ya funcione ni que se haya medido su rendimiento.

## Concepto

Una aventura técnica cinematográfica en 2D por capas. Una pareja de técnicos recupera la estación Galileo, incomunicada después de una falla. Gali, un robot volador de mantenimiento, inspecciona equipos, transporta componentes y realiza las reparaciones físicas que la pareja decide y habilita mediante interfaces programadas con JavaScript y DOM. El objetivo final es enviar la primera señal desde la estación restaurada.

Nombre institucional conservado: Galileo — Encendé la estación. Título de campaña propuesto: La primera señal. No hay emergencia con cuenta regresiva, ranking ni penalización por pedir ayuda.

## Presentación visual

- Ilustración técnica de ciencia ficción cercana: metal mate, carcasas, conectores, placas y pantallas legibles. Evitar estética infantil y exceso de decoración luminosa.
- Base azul institucional y acentos celestes; ámbar para atención y verde para funcionamiento, acompañados siempre por texto o símbolos. Conservar el escudo oficial sin alterarlo.
- Fondos separados en primer plano, zona de acción y fondo; piezas y robot independientes. Profundidad mediante escala, superposición, sombras y desplazamiento relativo de capas.
- La cámara se acerca a una avería, sigue una pieza o revela el sector recuperado. Se mantiene estable mientras se lee, escribe o prueba código. Nunca desplaza el editor ni roba su foco.
- No generar todos los fotogramas completos de la pantalla. Crear poses y secuencias cortas coherentes para Gali, componentes reutilizables y fondos por capas. El recurso concreto de animación se decidirá en el prototipo.
- No incorporar por ahora controles nuevos para repetir escenas o reducir movimiento. Conservar el respeto existente por la preferencia de movimiento reducido del sistema.
- El audio queda fuera de la primera entrega; toda información debe comprenderse visualmente.

## Gali

Robot flotante compacto, visor expresivo, pequeños propulsores y brazos retráctiles. Sin ruedas ni ciclos de caminata. Flota con movimientos suaves y controlados; se estabiliza al trabajar.

Estados visuales: espera atenta, inspección, duda, señalamiento, traslado, sujeción/encaje y celebración breve. Expresa dudas sobre el sistema, nunca ridiculiza al estudiante. Durante la edición permanece tranquilo. Los gestos comunican acciones; los mensajes importantes también se muestran como texto.

## Pantalla y ciclo de interacción

Ingreso con estación parcialmente apagada, Gali en primer plano y acciones Comenzá la misión / Continuá la partida. Conservar ingreso por parejas y modo demo.

En escritorio: encabezado compacto de capítulo y objetivo; editor y HTML a la izquierda, escena y controles HTML reales a la derecha. La escena gana protagonismo sin ocultar código, resultados o acciones en una pantalla de escuela. Ayudas y comprobaciones se expanden cuando se necesitan. En pantallas estrechas, disposición vertical legible.

Ciclo: observar avería → formular diagnóstico → completar código → ejecutar → operar controles → observar y verificar → reparación narrativa → siguiente capítulo.

Seleccionar un elemento no lo modifica: el resaltado del capítulo inicial representa la herramienta de inspección. Las animaciones de respuesta reflejan el DOM observado; las de logro reflejan comprobaciones aprobadas. Un logro previo no debe simular que un código nuevo incorrecto funciona. La animación es presentación: no debe ser la única responsable de guardar el logro o habilitar continuidad.

## Componentes físicos

Integrar pequeñas decisiones técnicas con evidencias: inspeccionar el estado de un enlace, distinguir un conector incompatible o reconocer una falla de refrigeración. La programación sigue siendo la actividad central. No usar arrastre preciso, reflejos ni conocimientos de electrónica no introducidos como barreras de avance.

Las reparaciones internas se representan con el equipo apagado y sin alimentación. Evitar mostrar recambio de RAM o placas con el equipo encendido. La intervención de Gali es una simulación narrativa, no una afirmación de que el DOM controla hardware real.

## Seis capítulos y distribución de los 100 minutos de práctica

Los tiempos son referencias para docentes, no límites en pantalla. Incluyen lectura, diagnóstico, código, pruebas, ayudas, transiciones e intercambio de roles.

| Capítulo | Minutos | Contenido DOM | Problema y reparación |
| --- | ---: | --- | --- |
| 1. Localizá la falla | 12 | querySelector, referencia, null | Identificar el módulo correcto entre varios. Gali inspecciona su conexión y recupera el enlace con autorización de la pareja. Seleccionar solamente identifica; la reparación es una acción narrativa posterior. |
| 2. Recuperá el panel | 14 | textContent; HTML original y DOM | El panel mantiene un aviso antiguo. La pareja actualiza el mensaje y compara archivo original y página. Gali devuelve el panel a su soporte y su texto permanece visible. |
| 3. Conectá el encendido | 16 | funciones, click, addEventListener sin invocación | Módulo de control reparado, botón aún desconectado. Gali instala el módulo con el equipo apagado; el código asocia la orden. Antes del clic debe permanecer en espera. |
| 4. Recuperá el transporte | 20 | funciones activar/detener, alternancias | La cinta debe transportar una pieza de refrigeración. La pareja programa y prueba ambos controles. Tras comprobarlos, Gali lleva la pieza al equipo apagado y la encaja. No hay reto de precisión temporal. |
| 5. Identificá al equipo | 16 | value dentro de la función; lectura actual | La terminal conserva un nombre anterior. La pareja debe registrar, cambiar y volver a registrar un alias. Gali coloca la credencial de mantenimiento con el valor actual. |
| 6. Prepará la primera señal | 22 | trim, condicional, textContent, limpieza e integración | El sistema acepta entradas vacías o no libera la sesión. Se prueban vacío, espacios, alias válido, cambio y limpieza. El módulo de comunicaciones queda habilitado tras las comprobaciones. |

Introducción: 10 minutos. Práctica: 100 minutos. Cierre: 10 minutos. Total: 120 minutos.

Cada capítulo combina diagnóstico, programación y verificación. Aumentar el tiempo de trabajo mediante explicación y pruebas significativas, no mediante más espera o animaciones largas. Los casos de hardware son propuestas de guion que deben ajustarse a los contenidos técnicos efectivamente trabajados.

Roles: quien programa y quien diagnostica/prueba. Intercambiarlos después de los capítulos 2 y 4. Ambos participan en las decisiones; mostrar un recordatorio breve sin bloquear la actividad. Extensiones optativas: explicar una falla, proponer otro caso de prueba o comparar dos soluciones, sin ranking.

## Ayudas como herramientas del taller

Tres accesos siempre reconocibles: Revisá el plano (HTML y elemento relevante), Consultá el manual (concepto y explicación), Mirá un ejemplo (ejemplo acotado al problema). No exigir abrirlos en un orden ni aplicar penalizaciones.

El plano se puede abrir desde el inicio. Distinguir consulta de referencia HTML de ayuda solicitada: registrar ambas con significado explícito si se muestran en la bitácora. No interpretar una consulta como falta de comprensión.

En la implementación, conservar las pistas históricas y definir identificadores estables para tipo de herramienta, capítulo y ayuda. Si se amplían ejercicios o eventos, versionar la actividad y no reinterpretar silenciosamente partidas previas. Registrar uso efectivo al abrir una ayuda, no por renderizar el botón. Evitar duplicados causados por remontajes.

## Cierre

Después de aprobar los seis capítulos, una secuencia breve recorre el panel, los controles, la terminal y el módulo de comunicaciones recuperados. Gali conecta el último módulo; la antena transmite y llega una confirmación visual. Mostrar el alias elegido como identificación narrativa, separado de los códigos de ingreso.

El capítulo final exige limpiar el formulario, por lo que no se debe depender de su valor final para personalizar el cierre: guardar explícitamente el último alias válido confirmado en la actividad real, nunca el usado por las pruebas automáticas. Si no existe, mostrar Equipo Galileo. Esto requiere diseño de persistencia y versionado antes de implementarse.

Bitácora final: capítulos recuperados, conceptos trabajados, pruebas realizadas y herramientas consultadas, sin calificación ni ranking. Cierre docente: qué cambió en el DOM, por qué se pasa una función sin paréntesis y por qué value se lee dentro del evento. Una partida incompleta conserva su avance y no recibe un final de misión cumplida ficticio.

## Primera entrega: capítulo 4 completo

Un escenario de taller con cinta, pieza, equipo receptor y Gali volador. Programación real de Activar/Detener; respuesta visual al DOM; verificación de alternancias; animación de traslado/encaje; movimiento breve de cámara; ayudas del taller; persistencia del logro.

Guion: plano general → acercamiento a avería → cámara estable durante programación → cinta responde a botones → logro comprobado → Gali toma la pieza y vuela hasta el equipo receptor apagado → encaje y cierre de carcasa → plano más abierto del sector reparado.

Criterios: código incorrecto no produce respuesta correcta; cinta detenida antes del clic; Activar/Detener funcionan varias veces; logros no se pierden al experimentar; pistas no penalizan; recarga conserva progreso; editor y controles utilizables en 1366×768; escena comprensible sin sonido; rendimiento medido en equipo escolar antes de generalizar. No se afirma que 2D sea automáticamente más liviano.

## Alcance técnico y estado

Conservar Next.js, TypeScript, intérprete y aislamiento, registros, modo demo y acceso docente por URL. La variante 2D puede reemplazar la escena principal sin reescribir esos sistemas. Mantener la versión 3D recuperable en la historia del proyecto; no retirar dependencias hasta evaluar su uso.

No incorporar en esta etapa multijugador sincronizado, nuevos servicios, cambios en producción ni publicación. Las cinco parejas avanzan a su ritmo. Primero validar el capítulo completo; luego extender la dirección visual y narrativa a los otros cinco capítulos y finalmente al cierre.

Entregado en esta sesión: rama local y especificación. Pendiente: arte, prototipo funcional, ampliación de ejercicios, migraciones que resulten necesarias y comprobación en computadoras de la escuela.
