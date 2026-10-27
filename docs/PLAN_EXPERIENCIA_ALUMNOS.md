
# Plan de implementación — El recorrido de Gali

Fecha: 26/10/2026. Estado: plan aprobado; entrega 1A implementada y entregas posteriores pendientes.

## Objetivo y orden

Convertir la campaña actual en un recorrido de seis estaciones: cada ejercicio recupera una parte visible del taller y Gali acompaña con intervenciones breves. Implementar primero el mapa, después la transformación del taller, la guía, los gestos y el vuelo, el intercambio de roles y la bienvenida. Dejar la secuencia de cierre y el sonido para las últimas etapas.

Este documento registra el trabajo por entregas. Los saludos, movimientos de cabeza, saltos, partículas y anillos que ya existen en Workshop son la base de la etapa visual; la guía contextual sigue pendiente.

## Base verificada en el repositorio

- `lib/levels.ts` define seis niveles, objetivos, pistas, HTML y zonas editables.
- `Game.completed` conserva logros; `Game.level` señala el ejercicio abierto. `Game.codes`, `hints` y `attempts` guardan el trabajo por nivel.
- `components/GameView.tsx` coordina el editor, el intérprete aislado, la devolución y el avance secuencial. Hoy no hay un mapa navegable.
- `components/Workshop.tsx` recibe `snapshot` y `mood`; no recibe todavía el progreso acumulado. Construye el taller y el robot dentro de una misma escena.
- `components/Results.tsx` muestra el resumen final. `lib/local.ts` y `lib/useGame.ts` conservan la partida y sincronizan eventos.
- `lib/consolidate.ts` calcula el nivel docente como el máximo observado. Al incorporar revisitas, esa cifra sigue significando nivel alcanzado; no representa necesariamente la estación abierta en ese momento.

## Reglas comunes a todas las etapas

1. Leer `AGENTS.md`, `docs/CONTEXTO_MAC.md` y este plan; revisar cambios locales antes de editar. Conservar el trabajo existente.
2. Mantener Next.js App Router, TypeScript, Three.js y pnpm con Node 24. Leer la documentación local de Next antes de modificar sus APIs.
3. Mantener los seis objetivos, el intérprete de capacidades, el iframe aislado y la validación de sus mensajes. Los efectos visuales nunca aprueban ejercicios.
4. Mantener la recuperación de partidas, la cola de eventos, la exportación y el acceso docente por URL.
5. Usar español argentino con voseo. Celebrar la experimentación sin ranking, penalización por pistas ni notas individuales.
6. Probar en modo demo o con servicios simulados. No insertar partidas ficticias en Sheets real. No imprimir secretos ni incluir nóminas en Git.
7. Conservar una alternativa funcional sin WebGL y respetar `prefers-reduced-motion`, incluso si cambia durante la sesión.
8. Cada entrega debe quedar utilizable por sí sola. Actualizar este documento con tareas completadas y evidencia; no marcar una etapa terminada solo por compilar.

## Diseño del recorrido

El mapa representa seis puestos de un único taller conectado por una línea de energía. Cada puesto conserva el nombre y número del ejercicio existente; puede sumar un nombre visual breve.

| Nivel | Puesto visual         | Aprendizaje existente         | Mejora permanente al aprobar                         | Respuesta de la vista previa                                            |
| ----- | --------------------- | ----------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 1     | Localizador           | Seleccionar con querySelector | Se revela el puesto y su conexión en el plano       | El indicador de selección responde a `snapshot.selected`             |
| 2     | Panel de mensajes     | Modificar textContent         | La pantalla queda instalada e iluminada              | El mensaje mostrado corresponde al texto real del DOM                   |
| 3     | Módulo de encendido  | Registrar un evento click     | Se incorpora el módulo de activación y su cableado | La cinta empieza únicamente cuando `snapshot.running` es verdadero   |
| 4     | Control de marcha     | Activar, detener y alternar   | Se completa la consola de dos controles              | La cinta se detiene y arranca según el DOM actual                      |
| 5     | Terminal de operador  | Leer value en cada clic       | Aparece la terminal de identificación               | La credencial refleja la entrada actual; no conserva un nombre ficticio |
| 6     | Puesto de validación | trim, validación y limpieza  | El taller queda recuperado y el mapa completo        | Los estados vacío, válido y limpio siguen el resultado real           |

Separar dos fuentes de información: **progreso permanente** (`completed`) y **estado de la ejecución actual** (`snapshot`). Aprobar un nivel conserva su mejora; una ejecución posterior fallida no borra el logro. Tener un motor instalado no implica que esté encendido. Al cambiar de nivel, la vista previa comienza en su estado inicial, mientras las mejoras ganadas permanecen.

## Etapa 1 — Mapa de seis estaciones (primera prioridad)

**Resultado visible:** un plano del taller con seis puestos conectados, cada uno con nombre, objetivo breve y estado legible. En escritorio se muestra sobre el área de trabajo; en pantallas pequeñas se presenta como recorrido vertical plegable, con un resumen siempre visible.

**Entrega 1A: mapa y estados.**

- Crear `lib/campaign.ts` con metadatos visuales de los seis puestos, vinculados por ID a `levels`. Reutilizar títulos y conceptos educativos; no duplicar las soluciones ni los objetivos como fuentes distintas.
- Crear una función pura `getCampaignProgress(game)` para calcular puestos aprobados, el primer nivel pendiente y qué destinos están disponibles.
- Separar `isCurrent` del estado de avance: un puesto puede estar aprobado y ser el que se está revisando.
- Crear `components/CampaignMap.tsx` con botones HTML y un trazado SVG decorativo. Evitar seis escenas WebGL para representar los puestos.
- Estados: aprobado, disponible y bloqueado. El puesto abierto lleva una marca adicional «Estás acá». Usar iconos y texto además del color; `aria-current="step"` identifica el actual.
- Al principio solo está disponible el nivel 1. Aprobarlo habilita el 2. Los niveles posteriores muestran qué requisito falta.
- Integrar el mapa en `GameView`; sustituir o adaptar las barras actuales de progreso para que no haya dos indicadores contradictorios.

**Refinamiento de 1A — presentación y flujo (26/10/2026).**

- El mapa informativo se presenta compacto por defecto, con seis iconos SVG propios, nombres breves y estados textuales. Las conexiones se iluminan según los logros existentes. En escritorio ocupa 117,5 px; la versión anterior medía 262,3 px en el nivel 4 a 1366 × 768.
- «Ver mapa completo / Contraer mapa» es el único botón del mapa, con `aria-expanded` y `aria-controls`. Las estaciones son elementos de una lista, no aparentan acciones de navegación. Al expandir, se consultan los objetivos y conceptos de `levels` y una indicación contextual única. La elección se conserva por partida en `sessionStorage`, incluso al recargar o cambiar de tamaño; si el almacenamiento falla, la consulta funciona en memoria.
- Se compactaron encabezados y espacios. HTML queda plegado inicialmente desde el nivel 2, sin impedir su consulta. El editor mantiene sus tamaños de letra. En escritorio, el taller, los controles y la devolución acompañan el desplazamiento únicamente si el panel completo entra en la ventana: se mide con `ResizeObserver`, con ancho mínimo de 1100 px y alto mínimo de 700 px. Al expandir contenido o reducir la ventana se recalcula; no se agrega un desplazamiento interno al panel.
- La ejecución tiene una barra superior en escritorio y queda después del código en móvil. Los enlaces a Devolución, Consultar pistas y Volver al código actúan solo a pedido. Ejecutar conserva el foco usando `aria-disabled` y la guarda existente contra ejecuciones simultáneas; no desplaza automáticamente la página. La devolución permanece debajo de los controles, con comprobaciones aprobadas desplegables y fallas abiertas. La altura reservada de la vista previa evita saltos al reemplazar el aviso por los controles.
- Se ajustó el encuadre del taller al ancho disponible, con un panel 3D de 210 px en escritorio. Se conservan las animaciones, la respuesta real del DOM y los límites gráficos. En móvil el orden es objetivo, editor, ejecución, taller/controles/devolución y ayuda. La alternativa sin WebGL mantiene su botón accesible.

**Evidencia del refinamiento:** TypeScript, 11 pruebas de lógica/API, 23 pruebas de Chromium y build aprobados con Node 24.22.1 y pnpm 11.25.0. Recorrido de nivel 4 con dos pistas, ambas funciones, Activar/Detener, foco y ausencia de saltos; niveles 1 y 6; 1366 × 768, 1440 × 900 y móvil 390 × 844. El zoom 200 % se emuló con 683 × 384 píxeles CSS y densidad 2, equivalente a una ventana física de 1366 × 768; no se operó el control de zoom de Zen. Se verificaron desbordes del documento y de los controles HTML, expansión persistente del mapa, movimiento reducido y fallback sin GPU. La campaña demo completa también pasó por la IP local vigente `10.116.158.217:3000`, sin escribir en Sheets. La compilación y la batería con simulaciones se ejecutaron en una copia aislada sin credenciales.

**Capturas comparables:** `tests/artifacts/refinamiento-antes-{1366,1440,390}-nivel-4*.png` y `refinamiento-despues-*`, con medidas JSON. En el mismo punto de edición de la segunda función a 1366 × 768, el taller pasó de quedar fuera de la ventana (parte inferior en −37 px) a verse completo entre 68 y 278 px, con controles y devolución visibles. El desplazamiento de ese escenario bajó de 869 a 574 px. También se guardaron niveles 1/6, controles, zoom y fallback. Se revisaron las capturas y se mantuvieron excluidas de Git. El rendimiento en computadoras de la escuela y el caso nativo de Zen siguen pendientes.

**Entrega 1B: navegación y recuperación.**

- Centralizar la navegación en `goToStation(id)` y reutilizarla desde el mapa y el botón Continuar. Permitir el primer nivel pendiente y la revisión de los aprobados; bloquear saltos a niveles futuros.
- Guardar las zonas editadas antes de salir; conservar pistas, intentos y logros al volver. Cambiar de estación no equivale a reiniciar su código.
- Deshabilitar cambios de estación mientras una comprobación está en curso. Cancelar temporizadores y descartar respuestas de una ejecución anterior al desmontar o cambiar de nivel. Limpiar `busy`, `pendingRun`, resultado y vista previa de forma coherente.
- Registrar un evento `enter` solo cuando cambia el destino. Reabrir una estación aprobada no agrega otro `complete`; volver a finalizar no duplica `finish`.
- Al revisar un nivel anterior, ofrecer «Retomar misión» hacia el primer pendiente. Después de los seis logros, permitir revisar y volver al resumen.
- Conservar la semántica del panel docente: rotular el máximo como nivel alcanzado si el texto actual sugiere nivel abierto.
- Adaptar fixtures de pruebas que hoy cambian `game.level` artificialmente: sembrar progreso coherente o probar el componente de forma aislada, sin debilitar el bloqueo real del mapa.

**Archivos:** crear `lib/campaign.ts`, `components/CampaignMap.tsx`; modificar `GameView.tsx`, `app/globals.css` y, si corresponde, el rótulo en `Teacher.tsx`. Revisar `local.ts` y `useGame.ts` solo si el flujo lo necesita.

**Aceptación:** una partida nueva muestra seis puestos y solo permite empezar el 1; aprobar habilita exactamente el siguiente; teclado y lector de pantalla identifican el destino; recargar recupera el mapa y el código; una ejecución fallida posterior conserva el logro; revisar y retomar no duplica eventos; no hay desbordes a 390 px ni a 1366 × 768.

**Pruebas:** funciones de desbloqueo con progreso vacío, parcial, completo y datos duplicados; navegación, recarga, revisión y bloqueo durante ejecución en navegador. Pruebas existentes de campaña y cola de envíos.

**Pedido para Codex:** «Implementá la entrega 1A del plan docs/PLAN_EXPERIENCIA_ALUMNOS.md. Después verificá sus criterios de aceptación y registrá los resultados. No avances a 1B en esta tarea». Repetir con 1B cuando 1A esté terminada.

## Etapa 2 — Taller que se transforma con los logros

**Dependencia:** etapa 1. **Resultado visible:** el taller empieza incompleto y recupera un módulo por estación aprobada.

**Entrega 2A: estructura y progreso.**

- Crear `lib/workshop-progress.ts` con una función pura que transforme IDs aprobados en mejoras visibles, según la tabla anterior.
- Agrupar las piezas existentes de Three.js en módulos con referencias estables: panel, encendido, consola, terminal y validación. Crear grupos una vez y actualizar visibilidad/materiales; no reconstruir el renderer por cada cambio de progreso.
- Extender las props de Workshop con el progreso y un modo explícito: `preview` para el ingreso, `campaign` durante la práctica y `summary` en resultados. La demostración visual del ingreso no simula logros de una partida.
- Pasar `game.completed` desde GameView y Results. Las partidas anteriores derivan el mundo de sus logros existentes; no necesitan empezar de nuevo.

**Entrega 2B: transformación y señalización.**

- Animar la incorporación de un módulo durante 0,8–1,5 segundos solo al obtener un nuevo logro. En recargas o revisitas, mostrar directamente el estado ganado.
- Actualizar también el puesto del mapa con una breve señal de energía. Mostrar un mensaje concreto, por ejemplo «Panel recuperado».
- Mantener la respuesta del DOM en primer plano: cinta detenida hasta el clic real, texto actual y credencial actual. Las animaciones no escriben en el DOM del ejercicio.
- En la alternativa sin WebGL, representar las mismas seis mejoras con una lista visual de módulos y sus estados.

**Archivos:** Workshop, GameView, Results, CampaignMap; nuevo `lib/workshop-progress.ts`. Extraer construcción de la escena a `lib/scene/` si facilita separar módulos, sin reescribir el intérprete.

**Aceptación:** cada aprobación agrega exactamente una mejora; las seis configuraciones son distinguibles; recargar conserva el mundo sin repetir festejos; fallar una nueva prueba no elimina módulos; completar el nivel 3 no arranca automáticamente la cinta de la vista previa; funciona sin WebGL.

**Pruebas:** derivación de progreso y capturas de los seis estados; recorrido completo; activar/detener después de aprobar; recarga y WebGL ausente. Conservar objetivo de 30 fps y DPR máximo 1,5; medir en un equipo de referencia y reportar sus condiciones, sin inferir rendimiento en todas las PCs.

**Pedido para Codex:** «Implementá la entrega 2A [o 2B] del plan, respetando la separación entre mejoras permanentes y respuesta del DOM. Verificá las partidas existentes y actualizá el registro de avance».

## Etapa 3 — Burbujas y guía contextual

**Dependencia:** etapas 1 y 2. **Resultado visible:** Gali comenta acciones importantes con mensajes breves vinculados al ejercicio.

- Crear `lib/gali-dialogue.ts` con mensajes y reglas deterministas; crear `components/GaliDialogue.tsx` para la burbuja accesible.
- Contextos iniciales: entrada a una estación, ejecución en curso, error, pista solicitada, objetivo aprobado y regreso a un nivel ya completado.
- Reutilizar `RunResult.error` y el detalle de la primera comprobación fallida para orientar al alumno. No deducir un error específico solo por contar intentos o buscar palabras en su código. Si falta evidencia específica, usar una invitación general a revisar.
- No cambiar en esta etapa el formato de resultados enviado a Sheets. Si luego hacen falta diagnósticos más precisos, planificar IDs estables para las comprobaciones como una entrega independiente y compatible.
- Separar consejo contextual de pista: mostrar una explicación del resultado no consume pistas. Solo la acción explícita «Ver pista» incrementa el registro existente.
- Prioridad de mensajes: error relevante o acción pendiente, logro, pista solicitada y presentación. Un nuevo resultado reemplaza los mensajes viejos de esa ejecución; limpiar la cola al cambiar de estación.
- Máximo una burbuja visible, dos frases breves y sin repetirse por cada render. No abrir mensajes por inactividad ni mientras se escribe.
- Permitir cerrar y volver a consultar la última ayuda con «Hablar con Gali». No robar el foco. Usar anuncios `aria-live="polite"` para cambios significativos y evitar lectura duplicada con el panel de devolución.
- Agregar una preferencia «Menos intervenciones» que conserve las ayudas solicitadas. El panel de comprobaciones sigue disponible.

**Archivos:** nuevos `lib/gali-dialogue.ts`, `components/GaliDialogue.tsx` y, si hace falta, `lib/useGali.ts`; integrar en GameView. Empezar con la burbuja junto al taller, antes de implementar vuelo.

**Aceptación:** el mensaje corresponde al nivel y resultado actuales; una pista se registra una sola vez; no se anuncian éxitos por respuestas antiguas; cerrar la burbuja permite seguir escribiendo; el contenido no tapa código ni controles a zoom 200 %.

**Pruebas:** prioridad/deduplicación de mensajes; error, pista, éxito y cambio rápido de estación; teclado y foco. Reutilizar los errores pedagógicos de `tests/resilience.spec.ts`.

**Pedido para Codex:** «Implementá la etapa 3 del plan con mensajes basados en los resultados existentes. Conservá el registro de pistas y probá que las burbujas no interrumpan el editor».

## Etapa 4 — Personalidad, vuelo y posiciones de Gali

**Dependencia:** etapa 3. **Resultado visible:** Gali puede despegar del taller, ir hacia un punto relevante y volver a un margen seguro.

**Entrega 4A: personaje y gestos.**

- Extraer el modelo procedural existente a `lib/scene/gali.ts`, con referencias a cabeza, brazos, cuerpo y propulsores. Reutilizar su aspecto y los gestos ya implementados.
- Definir estados visuales: reposo, saludo, atención, explicación, revisión, celebración, despegue y aterrizaje. Estado visual y texto se coordinan por un único controlador.
- «Revisión» inclina la cabeza; «explicación» señala; «celebración» hace una vuelta o salto breve. Los gestos no dependen de cada tecla ni indican vergüenza por equivocarse.

**Entrega 4B: vuelo por la página.**

- Crear `components/GaliCompanion.tsx`, una capa fija con un canvas pequeño y transparente que se mueve con transformaciones CSS. Evitar un canvas WebGL de pantalla completa.
- Cuando el acompañante está disponible, ocultar el modelo de Gali dentro de Workshop; mantener un solo personaje visible. Reutilizar la fábrica del modelo, no un mismo Object3D entre dos escenas.
- Limitarse a dos renderers activos: taller y acompañante. Si el segundo contexto falla, conservar Gali en el taller y las burbujas HTML.
- Definir anclas con refs para mapa, editor, botón Ejecutar y taller; calcular destinos con `getBoundingClientRect`. Recalcular con cambios de tamaño, desplazamiento y zoom, sin posiciones absolutas basadas en una única resolución.
- La capa gráfica usa `pointer-events: none`; solo botones de la burbuja aceptan interacción. No colocar destinos encima del editor, campos, teclado virtual o botones.
- Movimientos de 0,8–1,2 segundos, con aceleración suave. Cancelar un viaje al cambiar de estación o desmontar; estacionar al comenzar a escribir. Una acción nueva no debe generar una cola de vuelos atrasados.
- Ofrecer «Animaciones reducidas» y respetar la preferencia del sistema: Gali pasa directamente al lugar seguro, sin vuelo, giro ni propulsores animados.
- En móvil, usar un lugar fijo compacto o un avatar HTML cuando el espacio sea insuficiente. Liberar recursos, pausar en pestaña oculta y verificar pérdida de contexto.

**Aceptación:** Gali despega, llega y vuelve sin duplicarse; no bloquea clics ni tapa el ejercicio; las burbujas siguen ancladas al personaje; scroll y cambio de tamaño no lo dejan fuera de pantalla; reducir movimiento detiene la animación en curso; la pérdida de GPU conserva toda la práctica.

**Pruebas:** recorrido en escritorio y móvil, scroll/resize, foco y clics a través de la capa; navegación repetida sin acumulación de contextos; movimiento reducido y recuperación WebGL. Comparar rendimiento con la etapa 2 en el mismo dispositivo.

**Pedido para Codex:** «Implementá la entrega 4A [o 4B] del plan, reutilizando el modelo existente de Gali. Verificá especialmente que no se duplique el personaje y que la capa permita usar el editor».

## Etapa 5 — Intercambio de roles entre compañeros

**Dependencia:** etapas 3 y 4. **Resultado visible:** al avanzar después de los niveles 2 y 4, Gali presenta dos tarjetas que intercambian posiciones.

- Crear `components/RoleSwap.tsx` con «Quien escribe» y «Quien revisa». No asignar esos roles a un código de estudiante sin que la pareja los haya elegido.
- Interceptar el primer avance de 2→3 y 4→5, tanto desde Continuar como desde el mapa. Una revisita no debe forzar otro intercambio.
- Mostrar «¡Cambio de puesto! Ahora escribe quien venía revisando», con botones «Listo, seguimos» y «Continuar sin animación». El segundo acorta la presentación y conserva el recordatorio.
- Marcar el intercambio como presentado al continuar. Si se recarga antes de continuar, conservar el mismo punto de avance; no perder código ni eventos.
- Incorporar un campo opcional `experience` a Game para presentación local: versión del formato, IDs de intercambios vistos, bienvenida vista y cierre visto. Normalizar valores faltantes al leer partidas antiguas. No cambiar `VERSION`, la clave `galileo:game:1` ni el contrato de los eventos por agregar estas preferencias.
- Estos indicadores no se envían como logros académicos. Si el guardado local falla, permitir continuar y mantener el aviso existente.

**Aceptación:** aparece una vez por intercambio y por partida, cualquiera sea el acceso a la siguiente estación; recordar una presentación no depende del reloj; teclado y movimiento reducido permiten continuar; partidas previas se recuperan.

**Pruebas:** ambas transiciones, revisitas, recarga antes/después de confirmar y navegación mediante el mapa. Validación de compatibilidad con Game sin `experience`.

**Pedido para Codex:** «Implementá la etapa 5 del plan. Unificá la transición desde mapa y Continuar y agregá persistencia compatible para presentaciones vistas».

## Etapa 6 — Bienvenida breve de videojuego

**Dependencia:** etapas 3–5. **Resultado visible:** introducción de hasta 10 segundos con vuelo, burbujas y orientación hacia el mapa.

- Crear `components/WelcomeSequence.tsx` con una secuencia cancelable: llegada de Gali → misión del taller → mapa de seis estaciones → primer ejercicio.
- En el ingreso, usar solo un saludo corto no bloqueante que señale el formulario. Reservar la secuencia completa para después de comenzar una partida, donde ya existe un ID para recordar si fue vista.
- Mostrar «Saltar intro» desde el primer instante. Permitir repetirla desde una ayuda discreta. Al saltar, cancelar viajes, temporizadores y burbujas; estacionar a Gali y enfocar un destino lógico.
- Marcar la bienvenida vista al terminar o saltar. Una partida en curso anterior a esta función recibe una orientación breve opcional, no una introducción que la trate como nueva.
- Con movimiento reducido, reemplazar el recorrido por una tarjeta breve con el mismo contenido y acceso directo a la misión.

**Aceptación:** el alumno puede comenzar inmediatamente; recargar no repite la intro; saltar durante cualquier paso deja la interfaz operable; el mapa explica el objetivo y cómo retomar la misión.

**Pruebas:** primera partida, partida recuperada, salto en cada paso, repetición manual y navegación al salir durante la presentación.

**Pedido para Codex:** «Implementá la etapa 6 del plan con una bienvenida cancelable y recuperable. Probá que Saltar intro limpie todas las animaciones pendientes».

## Etapa 7 — Cierre que muestra lo construido (última fase visual)

**Dependencia:** etapas 1–6. **Resultado visible:** después de finalizar los seis niveles, una secuencia breve recorre los módulos recuperados y termina en el resumen.

- Integrar `components/CompletionSequence.tsx` en Results. Activarla solo cuando los seis IDs válidos están aprobados y `game.finished` es verdadero.
- Presentar durante 6–8 segundos el taller completo y una frase de Gali que conecte sus partes con los conceptos practicados. Usar el modo `summary` para diferenciar la presentación final de la ejecución del código.
- Mantener «Ver resumen» y descarga accesibles desde el comienzo. Recordar el cierre visto; permitir «Volver a ver el cierre» sin generar otro evento `finish`.
- Si hay eventos pendientes, mostrar la situación de guardado real durante y después de la secuencia. Completar la práctica localmente no implica que Sheets haya confirmado todos los envíos.
- Con movimiento reducido, mostrar una composición estática del taller y la lista de aprendizajes.

**Aceptación:** solo aparece con misión finalizada; no duplica eventos; el resumen y la exportación siguen disponibles sin conexión o GPU; la presentación no oculta envíos pendientes.

**Pedido para Codex:** «Implementá la etapa 7 del plan sobre Results y el modo summary del taller. Conservá visible el estado de sincronización y evitá repetir el evento de finalización».

## Etapa 8 — Sonidos suaves y opcionales (última prioridad)

**Dependencia:** flujo visual estable de etapas 1–7. **Resultado audible:** efectos breves para viaje, activación, logro e intercambio de roles.

- Crear `lib/audio.ts` y `components/SoundToggle.tsx`. Empezar silenciado; iniciar audio únicamente después de que el usuario active «Sonido» mediante una interacción.
- Usar sonidos procedurales suaves con Web Audio o recursos con licencia documentada; no cargar servicios externos.
- Una sola instancia de AudioContext, límite de sonidos simultáneos y volumen moderado. Cancelar efectos pendientes al silenciar; suspender audio cuando la página esté oculta.
- Recordar la preferencia por navegador, con manejo de almacenamiento no disponible. Una preferencia guardada no evita la necesidad de un gesto de usuario si el navegador lo requiere.
- Asociar cada sonido a una transición concreta; no reproducir otra vez por render, recarga o sincronización. Toda señal audible tiene equivalente visual o textual.
- Si AudioContext no está disponible o está bloqueado, continuar sin sonido. Sin música de fondo en esta primera entrega.

**Aceptación:** no hay sonido automático al abrir; el control permite activar y silenciar inmediatamente; no se acumulan efectos; el modo silencioso conserva toda la información; probar también desde otra PC por HTTP local.

**Pedido para Codex:** «Implementá la etapa 8 del plan con audio opcional, activado por el usuario y sin dependencias externas. Verificá silencio inmediato, recuperación y navegación».

## Verificación y forma de trabajar con Codex

Hacer una entrega por tarea de Codex. Para las etapas divididas, completar A antes de B. La primera versión utilizable del nuevo recorrido es el conjunto 1A, 1B, 2A y 2B; luego sumar a Gali de forma incremental.

En cada entrega:

1. Revisar el estado real de archivos y pruebas, y señalar diferencias respecto de este plan.
2. Implementar únicamente la entrega pedida, preservando cambios ajenos.
3. Ejecutar `pnpm typecheck` y pruebas de lógica pertinentes. Ejecutar las pruebas de navegador afectadas, con Node 24 y Chromium configurado mediante `TEST_BROWSER=chromium`.
4. Inspeccionar visualmente escritorio 1366 × 768 y móvil 390 px; verificar teclado, foco, zoom 200 %, movimiento reducido y alternativa sin GPU según el cambio.
5. Para entregas que afectan ejecución o persistencia, probar recarga, resultados incorrectos después de un logro, vuelta a niveles anteriores, cola con red fallida y acceso por la IP local actual. Descubrir la IP y no reutilizar una dirección antigua sin verificarla.
6. Al cerrar cada etapa funcional, ejecutar `pnpm build` en un entorno que no interrumpa una clase o servidor en uso. Ejecutar la batería completa en los hitos 1B, 2B, 4B y antes de la entrega final. Los tests con secretos ficticios requieren un servidor aislado, según CONTEXTO_MAC.
7. Informar qué se implementó, cómo abrirlo, qué se verificó y qué falta comprobar en un equipo físico. Guardar capturas en `tests/artifacts/`, respetando `.gitignore`.
8. Actualizar el registro siguiente y CONTEXTO_MAC. No desplegar, subir cambios ni modificar Sheets como parte automática de estas etapas.

### Prompt reutilizable

> Trabajá en /Users/macintosh/Desktop/Galileo/galileo-encende-la-estacion. Leé AGENTS.md, docs/CONTEXTO_MAC.md y docs/PLAN_EXPERIENCIA_ALUMNOS.md. Implementá únicamente la entrega [ID]. Revisá primero el estado actual y conservá los cambios existentes. Seguí sus decisiones, dependencias, criterios de aceptación y verificaciones. Probá en demo o con servicios simulados; no escribas resultados ficticios en Sheets. Al terminar, actualizá el registro de avance y contame qué cambió, cómo verlo y qué pruebas pasaron. No continúes a la siguiente entrega en esta tarea.

## Registro de avance

| Entrega                                   | Estado       | Evidencia / observaciones                                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A — Mapa y estados                      | Implementada | Estados derivados de los logros, estación actual independiente y mapa informativo adaptable. TypeScript, 11 pruebas de lógica/API, 14 pruebas Chromium y build aprobados en Mac; demo y servidor aislado sin credenciales. Capturas de escritorio, móvil y ancho equivalente a zoom 200 % en `tests/artifacts/`. |
| Refinamiento de 1A | Implementado | Mapa compacto de 117,5 px, iconos, expansión persistente, panel adaptable al alto disponible y flujo de edición/observación. TypeScript, 11 pruebas de lógica/API, 23 pruebas Chromium, build y campaña demo por IP local aprobados. Ver evidencia arriba. |
| 1B — Navegación y recuperación         | Pendiente    | El mapa es informativo; Continuar mantiene el avance secuencial. Revisitas, navegación desde el mapa y sus pruebas corresponden a 1B.                                                                                                                                                                                |
| 2A — Módulos y progreso del taller      | Pendiente    | Requiere etapa 1                                                                                                                                                                                                                                                                                                      |
| 2B — Transformaciones y respuesta visual | Pendiente    | Requiere 2A                                                                                                                                                                                                                                                                                                           |
| 3 — Guía contextual                     | Pendiente    | Requiere etapas 1–2                                                                                                                                                                                                                                                                                                  |
| 4A — Modelo y gestos                     | Pendiente    | Requiere etapa 3                                                                                                                                                                                                                                                                                                      |
| 4B — Vuelo y anclas                      | Pendiente    | Requiere 4A                                                                                                                                                                                                                                                                                                           |
| 5 — Intercambio de roles                 | Pendiente    | Requiere etapas 3–4                                                                                                                                                                                                                                                                                                  |
| 6 — Bienvenida                           | Pendiente    | Requiere etapas 3–5                                                                                                                                                                                                                                                                                                  |
| 7 — Cierre                               | Diferido     | Después del flujo principal                                                                                                                                                                                                                                                                                          |
| 8 — Sonido                               | Diferido     | Última prioridad                                                                                                                                                                                                                                                                                                     |
