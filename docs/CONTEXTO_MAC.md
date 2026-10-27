# Contexto de continuidad — agente de la MacBook

Este documento permite continuar el trabajo sin el historial del chat de Windows. Es un registro del estado verificado al transferir el proyecto, no evidencia del estado actual de una cuenta externa. Leé también `AGENTS.md`, `README.md`, `VERIFICACION.md` y el código que vayas a modificar.

## Producto y decisiones del usuario

**Galileo — Encendé la estación** es una práctica formativa de JavaScript y DOM para Nahuel, docente de 7.º año de la E.E.S.T. N.º 5 «Galileo Galilei», General San Martín, Buenos Aires. Trabaja en pareja pedagógica con otro docente. Los estudiantes vienen de HTML, CSS y JavaScript vanilla; recién comenzaron con el DOM.

La experiencia está pensada para unas cinco parejas simultáneas, en computadoras de la escuela, durante unos 40 minutos. Las pistas se registran sin penalización. No hay ranking competitivo, notas individuales ni cuenta regresiva que bloquee la práctica. El flujo es objetivo → código → ejecución → controles HTML → efecto 3D → devolución → avance.

La fecha original de clase era el 26/10/2026 a las 18:00, hora de Argentina. Comprobá la fecha y hora actuales; no asumas que esa clase sigue pendiente ni propongas cronogramas vencidos.

El usuario pidió una implementación real y autonomía: inspeccionar, modificar, probar y documentar. No volver a pedir elecciones sobre stack, temática, modalidad o estética. El objetivo inmediato del traslado a Mac era continuar allí y desplegar en Vercel.

## Repositorio y arquitectura

- Repositorio privado: https://github.com/NahueDB/galileo-encende-la-estacion
- Rama de trabajo actual: `main`. Confirmá remotos, cambios locales y commits nuevos antes de integrar o subir cambios; no descartes trabajo hecho en la Mac.
- Commit inicial: `bd93e2c`. Último cambio funcional antes de este documento: `7393bf0`, identidad institucional y compatibilidad WebGL.
- Ubicación original de Windows: `C:\Users\Nahue\Desktop\Dev\Galileo\Encendé la estación`. En la Mac usá la ubicación real del clon; no reutilices esa ruta.
- Next.js 16.4.3 con App Router, React 19, TypeScript, CSS propio y Three.js 0.180.0. Versiones exactas en el lockfile.
- Node.js 24.x y pnpm 11.25.0. No migres gestores ni elimines el lockfile por un problema de instalación.
- No hay una base de datos adicional. Google Sheets conserva los registros; el navegador conserva recuperación y eventos pendientes.

Mapa útil:

| Archivos                                    | Función                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `components/Entry.tsx`, `Brand.tsx`         | Ingreso en pareja e identidad institucional.                                           |
| `components/GameView.tsx`, `Results.tsx`    | Editor progresivo, ejecución, pistas, pruebas y cierre.                                |
| `components/Workshop.tsx`                   | Escena y robot procedurales, animaciones, detección/pérdida/restauración de WebGL.     |
| `lib/levels.ts`, `types.ts`                 | Definiciones de niveles, tipos y versión de actividad.                                 |
| `lib/parser.ts`, `runtime.ts`, `frame.ts`   | Acorn, intérprete limitado sobre DOM real, pruebas de comportamiento e iframe aislado. |
| `lib/local.ts`, `useGame.ts`                | Recuperación local, eventos y reintentos de sincronización.                            |
| `lib/sheets.ts`, `auth.ts`, `validation.ts` | Integración de servidor, sesiones firmadas y validación.                               |
| `app/api/`, `components/Teacher.tsx`        | Endpoints protegidos y seguimiento docente.                                            |
| `tests/`, `scripts/`                        | Pruebas, soluciones de referencia e inicialización de la planilla.                     |

Rutas: `/`, `/jugar`, `/resultado` y `/docente`.

## Campaña y aislamiento que deben conservarse

1. Seleccionar `#estacion`, distinguiendo `null`, otro elemento existente y el correcto.
2. Cambiar un aviso con `textContent`; explicar HTML original frente al DOM abierto.
3. Registrar una función con `addEventListener`, sin ejecutarla antes del clic.
4. Activar y detener mediante dos funciones, comprobando alternancias.
5. Leer `value` dentro de la función y cambiar de nombre entre clics.
6. Integrar `trim()`, validación de vacío/espacios, registro y limpieza.

El estudiante escribe un subconjunto de JavaScript vanilla que opera sobre HTML real, no sobre objetos Three.js ni React. El intérprete ejecuta el AST en un iframe con `allow-scripts` sin `allow-same-origin`, con CSP y validación de ventana, origen opaco, canal e ID de ejecución. No sustituir esto por `eval`, `new Function` en la aplicación principal ni ejecución en el servidor. Se limitan sintaxis, operaciones, profundidad de llamadas y listeners; un timeout del padre por sí solo no interrumpe cualquier bucle de un iframe.

Las pruebas automáticas usan un entorno separado; la vista previa comienza limpia y no hereda los clics ni valores de esas pruebas. Cada ejecución reconstruye el DOM. Los logros se conservan al experimentar y se distinguen de cambios posteriores fallidos o sin ejecutar. Se sugiere intercambio de roles después de los niveles 2 y 4.

## Últimos pedidos visuales y problema de WebGL en la Mac

El usuario pidió expresamente:

- Quitar el enlace de acceso docente del encabezado; accederá por URL. La autenticación y los endpoints deben seguir protegidos.
- Usar los logos y estética de https://galileo.edu.ar/sitio23/.
- Corregir un error reportado en la Mac en `components/Workshop.tsx (24:18) @ Workshop.useEffect`, alrededor de `THREE.WebGLRenderer`. No se recibió el mensaje completo ni se confirmó qué navegador de la Mac lo mostraba.

Ya implementado en `7393bf0`:

- Escudo oficial original en `public/brand/galileo-oficial.png`, sin redibujarlo ni recolorearlo; procedencia en `public/brand/README.md`.
- Escudo en encabezados y favicon/icono derivados de ese mismo archivo, conservando proporciones y transparencia.
- Fondo institucional `#001b30` y acentos tomados del escudo, manteniendo contraste y legibilidad del editor.
- Eliminado el enlace docente del ingreso.
- Creación explícita y comprobación de un contexto **WebGL 2 antes de construir Three.js**. Antes, el constructor podía escribir `console.error` y abrir el overlay de Next aun cuando la excepción estuviera atrapada.
- Atributos conservadores: sin MSAA, preferencia de GPU predeterminada, DPR máximo 1,5. No se fuerza la GPU de bajo consumo.
- Liberación explícita de recursos y contexto al desmontar, para evitar acumulación al navegar y con remontajes de React Strict Mode.
- Pausa al perder el contexto, restauración si el navegador la informa y botón **Reintentar vista 3D**. Los controles HTML y logros siguen disponibles si falla la GPU.

**Pendiente en la Mac física:** actualizar el clon, reiniciar el servidor y confirmar que se vea realmente el taller 3D. Las pruebas de WebKit realizadas en Windows no prueban la GPU de una MacBook. Si persiste, obtener navegador/versión y mensaje exacto, comprobar si `canvas.getContext('webgl2')` devuelve contexto o `null`, y diagnosticar aceleración gráfica/contextos disponibles. No afirmar que una vista alternativa equivale a haber reparado WebGL en ese equipo. Three.js de esta versión requiere WebGL 2; no improvisar un supuesto soporte WebGL 1.

## Credenciales y estado real de Sheets

Los valores privados están únicamente en `.env.local` de la PC original. Se excluyeron de Git y se revisaron los archivos antes de publicar. En la Mac podrían haberse transferido por un medio privado; comprobá solo su presencia y validez, sin imprimirlos. **No sobrescribas un `.env.local` existente con los placeholders.**

Variables necesarias:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `TEACHER_ACCESS_SECRET`
- `SESSION_SIGNING_SECRET`
- `ACTIVITY_CODE`

La cuenta de servicio fue compartida como editora de la planilla por el usuario. Se verificó realmente:

- Autenticación de Google y acceso a la planilla.
- Inicialización de `Estudiantes`, `Partidas` y `Eventos` con encabezados, sin sobrescribir filas.
- Configuración local completa. El secreto de firma se fortaleció porque inicialmente era demasiado corto; utilizar el valor actual transferido de manera privada si se quiere mantener la misma configuración.
- Login docente 200, consulta docente real a Sheets 200, cierre 200 y consulta sin sesión 401.
- Rechazo de códigos inexistentes con 400, sin crear partidas ni eventos ficticios.

En la última consulta desde Windows, la nómina y las pestañas de resultados estaban vacías. **Eso puede haber cambiado:** verificar el estado actual antes de proponer cargar o modificar datos. No se completó una partida de estudiantes reales ni se comprobó su finalización real en el panel docente. No insertar códigos o resultados ficticios en las pestañas de producción como si fueran estudiantes reales.

Las escrituras usan `RAW`; los códigos de la nómina deben cargarse como texto para preservar ceros. Las parejas deben tener códigos distintos, estar activas y compartir curso. La nómina no se descarga al navegador. Partidas es un registro inicial; el panel calcula progreso a partir de Eventos. Los reenvíos pueden generar filas duplicadas: se consolidan por ID estable, no se promete unicidad por «buscar y agregar». La cola local solo confirma tras respuesta satisfactoria; recuperación local no implica sincronización entre computadoras.

## Arranque y pruebas en macOS

Primero revisá `git status`, versiones de herramientas y configuración privada. Si el clon ya existe, actualizalo preservando los cambios locales. Luego:

```bash
pnpm install --frozen-lockfile
# Solo si NO existe todavía; después completar en un editor privado:
test -f .env.local || cp .env.example .env.local
pnpm dev
```

El juego se abre en `http://localhost:3000` cuando el servidor lo informa. No asumas que el servidor de Windows existe o es accesible desde la Mac.

```bash
pnpm typecheck
pnpm test
pnpm build
```

Para pruebas de navegador en la Mac, con el servidor corriendo en otra terminal:

```bash
pnpm exec playwright install webkit
TEST_BROWSER=webkit pnpm test:e2e
# Alternativa:
pnpm exec playwright install chromium
TEST_BROWSER=chromium pnpm test:e2e
```

`TEST_BASE_URL` permite apuntar a otro puerto. Sin `TEST_BROWSER`, la configuración usa Microsoft Edge (`msedge`), que puede no estar instalado en la Mac.

Último pase funcional desde Windows:

- TypeScript y build de producción correctos.
- Diez pruebas de lógica/API aprobadas.
- Once pruebas de navegador Edge aprobadas: campaña completa, recuperación, pistas, reinicio, exportación, cinco partidas simultáneas, fallas de red, identidad y escenarios WebGL.
- Tres pruebas adicionales en WebKit aprobadas: identidad, WebGL no disponible y excepción al crear contexto. No equivalen a un recorrido 3D completo en Safari nativo de la Mac.
- Una prueba docente con secretos ficticios se omitió en ese pase porque el servidor local usaba configuración real; ese escenario había pasado en la verificación inicial aislada de producción.

`tests/teacher.spec.ts` requiere un **servidor de prueba aislado** con los secretos ficticios que especifica el test y `TEST_TEACHER_AUTH=1` en el proceso de pruebas. No reemplazar secretos reales ni mezclar ese fixture con producción para hacer pasar la prueba. Los tests de API simulan Sheets y no escriben datos ficticios en Google.

## Vercel y próximos pasos

### Plan de experiencia de alumnos — 26/10/2026

El usuario priorizó explícitamente el mapa de seis estaciones como primer desarrollo y la transformación progresiva del taller. Aprobó guía contextual, gestos de Gali e intercambio de roles; pidió dejar el cierre y los sonidos para el final. El plan detallado, con entregas, archivos, compatibilidad, pruebas y prompts para Codex, está en [PLAN_EXPERIENCIA_ALUMNOS.md](PLAN_EXPERIENCIA_ALUMNOS.md). Las entregas **1A — Mapa y estados**, su refinamiento, **1B — Navegación y recuperación** y **2A — Módulos y progreso del taller** ya se implementaron. El siguiente paso es **2B — Transformaciones y respuesta visual**, en otra tarea.

### Entrega 1A — mapa y estados

- El mapa de `GameView` usa los seis niveles existentes y deriva estados de `game.completed`; la marca de estación actual se calcula por separado desde `game.level`. Se conserva el progreso de partidas anteriores, se ignoran IDs ajenos al contar y se deduplican logros.
- En 1A el mapa era informativo. Desde 1B las estaciones son botones navegables: aprobados y primer pendiente disponibles; futuros bloqueados. La expansión de detalles se conserva. En móvil mantiene un recorrido compacto en dos filas y permite expandir sus detalles.
- Verificado localmente con Node 24: TypeScript, 11 pruebas de lógica/API, 14 pruebas Chromium (campaña, estados del mapa, recuperación, cola simulada y WebGL) y build. La prueba de pantalla de zoom usa el ancho CSS equivalente a 200 %, no el control de zoom nativo del navegador. Capturas revisadas a 1366 y 390 px y guardadas en `tests/artifacts/`.
- Pruebas de navegador en copia y servidor aislados sin `.env.local`; no se enviaron partidas ficticias a Sheets. Sigue pendiente verificar el mapa en Zen y el rendimiento en las computadoras físicas de la escuela.

### Refinamiento visual y de usabilidad de 1A — 26/10/2026

- Recorrido compacto por defecto: 117,5 px de alto en escritorio, seis iconos SVG, nombres breves, estados y «Estás acá» independientes, conexiones iluminadas por los logros reales. Los objetivos y conceptos se consultan con un único control expandible. La preferencia se conserva por partida durante la sesión, sin modificar Game ni sus eventos.
- Editor a la izquierda y taller/controles/devolución a la derecha. El panel derecho usa sticky solo cuando entra completo en la ventana; se desactiva al crecer o cuando falta ancho/alto. Barra de ejecución superior en escritorio, después del código en móvil, con enlaces a devolución y pistas. La ejecución conserva el foco y no desplaza automáticamente la página. El HTML sigue disponible plegado desde el nivel 2; las pistas y el código se conservan.
- Ajuste de encuadre y reducción del panel 3D a 210 px en escritorio. Móvil mantiene el orden objetivo → editor → ejecución → vista previa/devolución → ayuda. Comprobaciones aprobadas desplegables; errores abiertos. No se implementaron navegación, módulos progresivos ni otras etapas.
- TypeScript, 11 pruebas de lógica/API, 23 pruebas Chromium y build aprobados. Se reprodujo nivel 4 con pistas, ambas funciones, Activar/Detener, y se revisaron niveles 1/6, 1366 × 768, 1440 × 900 y 390 px. Zoom 200 % emulado mediante ancho CSS a la mitad y densidad 2; no se operó el zoom nativo de Zen. Capturas antes/después revisadas en `tests/artifacts/`, con medidas: el taller antes quedaba fuera de pantalla al editar la segunda función del nivel 4 a 1366 × 768 y ahora queda completamente visible.
- Pruebas con simulaciones y build en copia aislada sin `.env.local`. La campaña demo por `http://10.116.158.217:3000` pasó con envíos bloqueados. No se escribieron resultados ficticios en Sheets. El servidor del repositorio quedó iniciado en `http://localhost:3000` al cerrar la tarea; la IP y la disponibilidad del proceso deben verificarse en otra sesión.
- Sigue pendiente comprobar el rendimiento en las computadoras físicas de la escuela y el caso nativo de Zen. Más detalle y registro en `PLAN_EXPERIENCIA_ALUMNOS.md`.

### Animaciones del taller — 26/10/2026

- Se ampliaron las animaciones de `Workshop.tsx`: acercamiento inicial de cámara, saludo periódico, cabeza articulada, salto de celebración con partículas instanciadas durante 2,8 segundos, anillos de energía y luces de la estación activa. Los efectos siguen el estado real del DOM. Se conservan 30 fps objetivo, DPR máximo 1,5 y recursos procedurales sin postprocesado.
- Se agregaron transiciones de ingreso, botones, pistas, progreso y logros. Se respeta `prefers-reduced-motion`, incluso al cambiarlo durante la sesión; el taller conserva una pose estática y los efectos CSS se desactivan. Se omite el renderizado mientras la pestaña está oculta.
- Verificado en Chromium por la IP local: los cuatro escenarios de campaña (incluido recorrido completo), los cuatro de identidad/WebGL y una nueva prueba que compara capturas del canvas para comprobar movimiento normal y congelación al activar movimiento reducido. TypeScript sin errores. No equivale a medir el rendimiento de las computadoras físicas de la escuela.

### Acceso por red local — 26/10/2026

- Se reprodujo el fallo al abrir por la IP de la Mac mediante HTTP: `crypto.randomUUID` no está disponible en ese contexto. Se incorporó `lib/id.ts`, que usa `crypto.getRandomValues` para generar UUID v4 cuando falta esa función, tanto en las partidas/eventos como en las ejecuciones y nonces del iframe. Se conserva el aislamiento del intérprete.
- `allowedDevOrigins` toma las direcciones IPv4 locales al iniciar Next para permitir sus recursos de desarrollo desde la red. Al cambiar de red, reiniciar el servidor para recalcularlas.
- Se verificó la campaña completa de seis niveles con Chromium accediendo por `http://10.116.158.217:3000`, en modo demo, sin escribir resultados ficticios en Sheets. Esto verifica el acceso por IP desde esta Mac; sigue pendiente confirmar la conexión desde la computadora del compañero. La IP puede cambiar.

### Revisión local en la Mac — 26/10/2026

- El usuario usa Bun y Zen en esta Mac. Se conservó `bun.lock` sin versionar; el proyecto sigue declarando pnpm 11.25.0 y su lockfile existente.
- `main` local coincide con la referencia remota `f83b569` al consultar GitHub.
- Existe `.env.local`; no se sobrescribió ni se imprimieron valores. No se volvió a verificar Sheets ni Vercel en esta revisión.
- La terminal inicia con Node 22.14.0 y sin pnpm en PATH. El entorno de herramientas dispone de Node 24.22.1 y pnpm 11.25.0; se usó ese Node para verificar TypeScript y las diez pruebas de lógica/API, todas aprobadas.
- Hay un proceso escuchando en el puerto 3000, pero esto por sí solo no acredita que responda correctamente ni que use Node 24.
- No se pudo controlar Zen: la herramienta de interacción nativa falló al iniciar. Sigue pendiente comprobar visualmente el taller 3D en ese navegador; no se verificó la GPU física.
- Los cambios previos de `next-env.d.ts` corresponden a rutas generadas de desarrollo y se conservaron. Se excluyó `.pnpm-store/` de Git para evitar agregar la caché local de instalación.

El repositorio está preparado con `vercel.json`, Node 24.x, pnpm y build estándar. Desde Windows no había cuenta de Vercel autenticada y **no se verificó una URL pública**. La Mac podría tener otra sesión o un despliegue nuevo: inspeccionar el estado actual antes de crear recursos.

1. Confirmar que la escena 3D funciona en la Mac o diagnosticar el fallo exacto restante.
2. Revisar si ya existe un proyecto Vercel para este repositorio. Con la autorización del usuario para desplegar, usar un proyecto nuevo si hace falta, sin reemplazar otros ni contratar recursos pagos.
3. Cargar las seis variables privadas en el entorno de Vercel correspondiente. GitHub no transmite `.env.local` ni configura secretos automáticamente.
4. Desplegar, verificar la URL HTTPS real y las rutas protegidas. No dar una URL predicha o solo supuesta como verificada.
5. Con la nómina cargada/autorizada por el docente, hacer una prueba real y comprobar los resultados y la finalización en `/docente`. No simular autoría o actividad de estudiantes.
6. Registrar qué se verificó y qué sigue pendiente, especialmente el rendimiento en los equipos físicos de la escuela.

No añadir bases de datos, OAuth de estudiantes, rankings, chat, multijugador sincronizado, corrección por IA, modelos pagos ni paneles administrativos fuera del alcance. Conservar el foco: cinco parejas completan una práctica de DOM y dejan un registro formativo útil.

### Entrega 1B completada en Windows — 27/10/2026

- Navegación centralizada desde mapa/Continuar/Retomar hacia aprobados y primer pendiente. `Game.level` es estación abierta; el máximo del panel docente se rotula Nivel alcanzado.
- Revisión y recarga conservan código, pistas, intentos, logros y cola. El destino se normaliza al recuperar partidas antiguas si está bloqueado o no existe. No se modificaron VERSION, clave local ni formato de eventos.
- Comprobaciones bloquean navegación/reinicio. IDs activos, descarte de respuestas obsoletas y cancelación de temporizadores al salir. Revisitas y resumen no duplican complete/finish.
- TypeScript, 13 pruebas de lógica/API, 29 Chromium completos y build de producción aprobados. Nueve escenarios de campaña/navegación por IP local 192.168.0.108:3101 también pasaron; no se comprobó desde otro equipo. Una comprobación demo de navegación pasó en el servidor principal localhost:3000.
- Compilación y batería completa en copia temporal sin credenciales, con servidor separado en 3101 y secretos exclusivamente ficticios para la prueba docente. Ese servidor de prueba se cerró al terminar; el principal se mantuvo. No se modificó Sheets ni se escribieron registros ficticios.
- Capturas entrega-1b-* guardadas y revisadas en tests/artifacts (ignoradas por Git), escritorio/móvil/ancho equivalente a zoom. No se controló el zoom nativo de Zen ni la GPU física de la Mac.
- Había un cambio local en bun.lock (36 líneas agregadas y 36 eliminadas) al retomar: se conservó. No hubo commit, push ni deploy. Los cambios de 1B están locales; revisar git status antes de continuar y no descartar trabajo ajeno.
- Próxima tarea según el plan: 2A, estructura modular y progreso permanente del taller. No se implementó esa etapa en 1B.

### Entrega 2A completada en Windows — 27/10/2026

- Al retomar, el usuario ya había creado el commit local fef24fd para 1B; main estaba un commit por delante de origin/main y no tenía cambios sin commit. Se preservó ese estado y no se publicó.
- `lib/workshop-progress.ts` calcula las mejoras permanentes desde completed, ignorando duplicados e IDs desconocidos. Workshop recibe mode explícito: preview (ilustración, sin atribuir logros), campaign (logros + respuesta DOM) o summary (logros guardados, estación detenida).
- La escena contiene seis grupos creados una vez: puesto/conexión/cinta, panel, encendido, controles, terminal y validación. La visibilidad se actualiza con refs, sin recrear renderer al ganar módulos. Terminal adelantada a la izquierda para distinguir el quinto logro. Ingreso muestra el conjunto; campaña comienza con plataforma y Gali, y recupera piezas al aprobar.
- Aprobar 3 no arranca la cinta. Running se obtiene solo del snapshot de campaña; el resumen no usa game.finished para simular funcionamiento ni una selección o persona registrada. La recarga y las revisitas conservan las mejoras; un fallo nuevo no quita módulos. VERSION, esquema de Game, almacenamiento y eventos no cambiaron.
- Las animaciones anteriores se conservaron; 2B todavía debe incorporar las transiciones de construcción, la señal del mapa y la lista detallada de módulos en el fallback. Por ahora sin GPU se informa el contador guardado y la práctica continúa.
- Node 24: TypeScript, 16 pruebas de lógica/API, 34 Chromium completos y build aprobados. Después del ajuste de la terminal se repitieron las 14 pruebas afectadas y el build, aprobados. Evidencia de los estados 0–6 y fallback en tests/artifacts/entrega-2a-* (no versionada).
- Referencia: Chromium 156.0.8078.4 headless en Windows x64, producción, SwiftShader, ventana 1366×768, densidad 2 y DPR efectivo 1,5; 30 fps tanto con cero como con seis módulos, p95 de intervalo 34,3 ms en muestras de 2,4 s. No equivale a medir la GPU física de Zen/Mac ni PCs de la escuela. Informe JSON en tests/artifacts/entrega-2a-rendimiento.json.
- Build y pruebas en copia temporal sin credenciales, con servidor independiente; no se modificó Sheets ni se escribieron resultados ficticios. No hubo commit, push ni deploy de 2A. Siguiente entrega: 2B, únicamente cuando se continúe con esa tarea.

### Etapas 2B, 3 y 4 completadas en Windows — 27/10/2026

**Estado vigente para retomar:** el usuario amplió explícitamente la tarea a 2B + etapa 3 + 4A/4B completas. La próxima etapa del plan es 5 (intercambio de roles), que no se implementó en esta tarea. Revisar `git status` antes de continuar: estos cambios están locales, sin commit/push/deploy. Al comenzar, main estaba limpio sobre `4d49108` («Entrega 2A: estructura y progreso.»), alineado con la referencia origin/main local.

- 2B incorpora módulos nuevos en 1,2 s y señala el mapa una sola vez. Cue temporal, no persistido ni contado como logro. Cancelación por navegación, pestaña oculta, movimiento reducido o recuperación gráfica. Recargar/revisitar no repite incorporación. Fallback detallado con seis módulos y estados reales.
- `lib/gali-dialogue.ts` + `lib/useGali.ts`: mensajes deterministas por estación/ejecución, errores de RunResult y primera comprobación fallida, aprobación, pistas explícitas y revisitas. Deduplicación y descarte de IDs/estaciones antiguos. No analiza borradores con heurísticas ni inventa diagnósticos por cantidad de intentos. `components/GaliDialogue.tsx`: una burbuja, cierre/reapertura, anuncios educados sin duplicar la devolución. Editar cierra la intervención sin mover el foco.
- Preferencias independientes de Game: `galileo:less-interventions:1` y `galileo:reduced-motion:1`. Menos intervenciones conserva ayudas solicitadas; Animaciones reducidas se suma al sistema, nunca lo anula. `useMotionPreferences` comparte la elección en memoria entre componentes si el almacenamiento falla.
- `lib/scene/gali.ts` extrae el robot existente a una fábrica con recursos propios, cabeza/brazos/cuerpo/propulsores y ocho gestos. Workshop y acompañante crean instancias distintas. `components/GaliCompanion.tsx` usa canvas transparente pequeño (100×128 CSS, DPR≤1,5) y hasta dos renderers incluyendo Workshop.
- Vuelo de 900 ms hacia anclas medidas de mapa/editor/Ejecutar/taller y regreso al margen del taller; sin cola de viajes. Solo cuando existe margen derecho libre ≥264 px y alto ≥700 px (comprobado en 1920×1080). En 1366/1440, móvil o zoom no hay margen suficiente: Gali queda en Workshop y la ayuda HTML ocupa su lugar en la devolución. No reducir el editor para forzar vuelo.
- El segundo contexto activo oculta Gali en Workshop; pérdida/fallo libera el acompañante, restaura el personaje del taller y permite reintentar sin afectar la práctica. Scroll/resize/ResizeObserver recalculan límites; la capa gráfica deja pasar clics. Nuevas acciones, edición, navegación, pestaña oculta y desmontaje cancelan viajes; reducir movimiento los detiene y no reproduce el viaje viejo al desactivar la preferencia.
- Se compactó la devolución y se integró el mensaje del módulo a la burbuja para conservar el panel completo en 1366×768 y evitar texto repetido. El código, controles y objetivos mantienen su espacio y comportamiento.
- No cambiaron VERSION, esquema Game, clave de partida, eventos, iframe, intérprete, seis objetivos ni API/Sheets. Roles (5), bienvenida (6), cierre (7) y sonido (8) siguen pendientes/diferidos según el plan.

**Verificación:** Node 24.22.1, pnpm 11.25.0, TypeScript, build de producción y 20 pruebas de lógica/API aprobados. Batería completa de 42 escenarios Chromium aprobada y una prueba adicional de preferencias con almacenamiento bloqueado aprobada (43 escenarios verificados en total). Incluye campaña de seis niveles, errores pedagógicos, docente con secretos ficticios, navegación/recarga, pistas, foco, progreso/DOM independientes, vuelo, scroll/resize, segundo contexto fallido/perdido y reintento. Capturas revisadas en 1366×768, 1440×900, móvil 390×844, ancho 683×384 equivalente al espacio CSS de zoom 200 %, y vuelo 1920×1080. No se operó el zoom nativo de Zen.

**Rendimiento comparable:** Chromium 156.0.8078.4 headless Windows x64 con SwiftShader, producción, densidad 2/DPR efectivo 1,5, muestras estables de 2,4 s sin otras pruebas simultáneas. En 1366×768: 30 fps con cero/seis módulos, p95 34,2 ms y 25/70 llamadas de dibujo por cuadro, frente a 30 fps y p95 34,3 ms en 2A. En 1920×768: ambos renderers a 30 fps; p95 34–34,7 ms; taller 2/47 + acompañante 23 llamadas por cuadro. Es una medición de escena estable después del vuelo, no una garantía de GPU física. Informe ignorado `tests/artifacts/etapa-4-rendimiento.json`; script reproducible `scripts/measure-gali.cjs`. Falta verificar Zen/GPU de la Mac y equipos de la escuela.

Build y navegador en copia temporal sin `.env.local`, Google sin configurar y servidor independiente en 3101. Se mantuvo el servidor principal en 3000. No se escribieron datos ficticios en Sheets ni se modificaron secretos. Las capturas/métricas permanecen excluidas de Git. No hubo commit, push ni deploy.

### Refinamiento de Gali: diseño perlado y vuelo por la página — 27/10/2026

El usuario pidió más vuelo e interacción y un personaje más bonito, inspirado en EVA de WALL·E. Este refinamiento **reemplaza la restricción anterior del margen lateral de 264 px**; las notas de arriba describen la primera entrega de 4B.

- Nuevo modelo procedural en `lib/scene/gali.ts`: carcasa perlada continua, cuerpo ovoide suspendido, cabeza ovalada con visor oscuro y ojos celestes con reflejos/parpadeo, brazos como aletas suaves, distintivo verde y propulsión azul. Sin pies ni articulaciones mecánicas visibles. Conserva ocho gestos, giro breve al celebrar, recursos propios y alternativa estática.
- `lib/gali-flight.ts` calcula aterrizajes a partir de rectángulos reales y descarta posiciones sobre texto, campos, código, enlaces, botones, summaries e iframes. Interpola trayectos curvos en dos ejes con Web Animations; no hay canvas de pantalla completa. Los viajes duran 1,1 s.
- El acompañante funciona desde 1100×600 CSS si encuentra un lugar seguro, con tamaño 72×112 (canvas 72×94 + rótulo) y 104×144 en ventanas desde 1500 px (canvas 104×126). En móvil/zoom/ventana baja vuelve al personaje del taller y la ayuda HTML. Máximo dos renderers; DPR≤1,5, objetivo 30 fps.
- Destinos: mapa, objetivo, HTML, código, Ejecutar, taller y pistas. «Recorrer la estación» los visita en orden, «Detener recorrido» cancela y «Ir a…» permite elegir. Solo las visitas solicitadas desplazan la página para mostrar un destino fuera de vista; las intervenciones automáticas no hacen scroll. El recorrido abre el HTML de referencia si hace falta y no consume pistas ni registra eventos académicos.
- Abrir el mapa y consultar el HTML generan una visita contextual (salvo Menos intervenciones); pedir una pista lleva a la ayuda existente. Foco en un textarea o edición cancelan el vuelo y cierran la intervención. Nueva acción, scroll manual, resize, pestaña oculta, navegación y desmontaje cancelan animación/temporizadores y limpian la marca de sección. Movimiento reducido coloca al personaje directamente, sin giro/propulsión ni reanudar un vuelo cancelado.
- El avatar vuela separado de la burbuja: toda la ayuda y sus botones permanecen en la devolución. Así puede recorrer el centro de la página y dejar libres editor y controles. Se reserva un pequeño lugar a la derecha de las pistas en escritorio. El menú de destinos se expande dentro del flujo en móvil/zoom, y el dropdown de escritorio puede salir del borde redondeado de la devolución sin recortarse.
- `Game`, VERSION, validación, iframe, logros y Sheets siguen sin cambios. Las visitas son ayuda de interfaz; solo «Ver pista» consume/registra pista. No se avanzó a la etapa 5.

**Verificación local:** build y TypeScript aprobados, 21 pruebas de lógica/API y batería completa de 44 escenarios Chromium aprobados. Incluye siete aterrizajes en 1366×768 sin cubrir código/campos/controles, desplazamiento en ambos ejes, recorrido guiado completo en 1440×900, cancelación, foco, movimiento reducido, segundo contexto perdido/reintento y campaña completa. Tras ajustar el menú se repitió el escenario afectado de móvil/zoom (1366/390/683 CSS), aprobado, y se recompiló. Capturas `tests/artifacts/gali-eva-*` revisadas, ignoradas por Git.

**Rendimiento:** mismo Chromium 156 headless/Windows x64/SwiftShader, producción, densidad 2/DPR efectivo 1,5, muestras estables de 2,4 s sin otras pruebas simultáneas: 30 fps en ambos renderers, p95 34–34,5 ms, tanto en 1366×768 como 1920×768 y con cero/seis módulos. El modelo usa 11 llamadas de dibujo por cuadro (antes 23). Taller sin Gali: 2/47 llamadas. Informe `tests/artifacts/gali-eva-rendimiento.json`, script `scripts/measure-gali.cjs`. La GPU física de la Mac/Zen y las PCs de escuela siguen sin verificarse.

Todo se probó en una copia aislada sin `.env.local` y sin Google configurado. Servidor principal 3000 conservado. No hubo escrituras ficticias en Sheets, cambios de secretos, commit, push ni deploy. Se preservaron los cambios locales de la entrega anterior.
