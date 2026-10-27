# Galileo — Encendé la estación

Práctica formativa de JavaScript y DOM para 7.º año de la E.E.S.T. N.º 5 «Galileo Galilei». Se trabaja en pareja, con seis niveles y un taller 3D procedural. No genera notas individuales, no descuenta por pistas y no tiene ranking ni cuenta regresiva.

Para continuar el desarrollo con otro agente, leé [el contexto de la MacBook](docs/CONTEXTO_MAC.md). También está enlazado desde AGENTS.md.

## Abrir en la MacBook

Con Git, Node.js 24 y pnpm 11.25.0 disponibles en la Mac, ejecutá:

```bash
git clone https://github.com/NahueDB/galileo-encende-la-estacion.git
cd galileo-encende-la-estacion
pnpm install --frozen-lockfile
test -f .env.local || cp .env.example .env.local
pnpm dev
```

El repositorio es privado: Git debe autenticarse con tu cuenta de GitHub, o podés clonarlo con GitHub Desktop. Si pnpm no está instalado y ya tenés Node.js 24, podés instalar la versión utilizada con `npm install -g pnpm@11.25.0`.

Completá `.env.local` en la Mac mediante un editor privado. Para conservar la misma configuración, transferí el archivo de esta PC por un medio privado, como AirDrop; no lo agregues a Git. Sin esas variables, el modo demo sigue funcionando. No hace falta inicializar de nuevo la planilla: las pestañas existentes se conservan.

Para Vercel, importá este repositorio privado como un proyecto nuevo y cargá las seis variables de `.env.example` en Settings → Environment Variables. Usá el valor actual de `SESSION_SIGNING_SECRET`, que se fortaleció durante la configuración. Las variables locales no se transfieren automáticamente a GitHub ni a Vercel. El archivo `vercel.json` define instalación y compilación, y `package.json` fija Node.js 24.x.

## Ejecutar en esta PC Windows

Abrí PowerShell en la carpeta del proyecto:

```powershell
Set-Location -LiteralPath 'C:\Users\Nahue\Desktop\Dev\Galileo\Encendé la estación'
powershell -ExecutionPolicy Bypass -File .\scripts\run.ps1 install
powershell -ExecutionPolicy Bypass -File .\scripts\run.ps1 dev
```

El script encuentra Node y pnpm instalados normalmente o utiliza el entorno incluido en Codex. No modifica el PATH permanente. Abrí http://localhost:3000 cuando la terminal indique que está listo. Para cerrar el servidor, usá Ctrl + C.

En una instalación estándar, usá **Node.js 24 LTS y pnpm 11.25.0** (versiones usadas durante el desarrollo):

```powershell
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`pnpm start` requiere ejecutar antes `pnpm build` y que el puerto 3000 esté libre. Para las otras tareas en esta PC también podés usar `scripts/run.ps1 build`, `test`, `typecheck`, `test:e2e` o `start`.

## Identidad de la escuela y compatibilidad gráfica

El encabezado y los iconos utilizan el escudo original de la escuela, obtenido de [su sitio oficial](https://galileo.edu.ar/sitio23/). El fondo institucional #001b30 y los acentos celestes, verdes y amarillos retoman esa identidad. La procedencia del archivo está documentada en `public/brand/README.md`.

El acceso docente se hace directamente por `/docente`; no hay un enlace en el encabezado del ingreso. Se conserva la protección del servidor.

La vista 3D comprueba primero que el navegador pueda crear un contexto WebGL 2, usa atributos gráficos conservadores y libera el contexto al salir de la pantalla. Esto evita llamar al constructor de Three.js cuando WebGL está bloqueado y reduce la acumulación de contextos al navegar o al remontar componentes en desarrollo. Si la GPU no está disponible, la campaña sigue con sus controles HTML y ofrece **Reintentar vista 3D**, sin perder el código ni los logros. Ante una pérdida del contexto se pausa el renderizado y se admite restauración o reinicio de la vista.

Si en una Mac sigue apareciendo la vista alternativa, probá el botón de reintento y un navegador actualizado con aceleración gráfica disponible. El cambio no habilita WebGL si el sistema o el navegador lo bloquean. Las pruebas automatizadas en WebKit no sustituyen la verificación de la GPU física de esa MacBook.

## Uso rápido sin Google Sheets

Elegí **Explorar en modo demo** en el ingreso. Se usan DEMO-01 y DEMO-02, se guardan los datos únicamente en ese navegador y no se envía nada a la planilla. Podés descargar un JSON desde el taller y desde el cierre. El archivo no incluye el token de sesión.

Al regresar al ingreso, el equipo ofrece **Continuar partida** o **Iniciar otra partida**. Descargá la partida anterior antes de reemplazarla. No existe sincronización entre equipos. Borrar los datos del navegador elimina la recuperación local. En una computadora compartida, revisá los códigos antes de continuar.

## Configurar Google Sheets

No pegues claves privadas en el chat ni las agregues al repositorio.

1. En tu proyecto de Google Cloud, habilitá Google Sheets API y creá una cuenta de servicio. Descargá su archivo JSON y guardalo en una ubicación privada fuera de esta carpeta. No hace falta habilitar delegación de dominio ni OAuth de estudiantes.
2. Creá una planilla privada y compartila con el `client_email` de la cuenta de servicio, con permiso **Editor**. La planilla no tiene que publicarse en la web.
3. Copiá `.env.example` a `.env.local` y completá los valores en un editor local:

```dotenv
GOOGLE_SHEETS_SPREADSHEET_ID=id_de_la_planilla
GOOGLE_SERVICE_ACCOUNT_EMAIL=cuenta@proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
TEACHER_ACCESS_SECRET=secreto_docente_aleatorio_de_al_menos_16_caracteres
SESSION_SIGNING_SECRET=otro_secreto_aleatorio_de_al_menos_32_caracteres
ACTIVITY_CODE=GALILEO7
```

El ID está entre `/d/` y `/edit` en la URL de Sheets. La clave privada es el campo `private_key` del JSON. Se admiten saltos reales o secuencias `\n`. Usá dos secretos diferentes y aleatorios para docente y firma. Nunca agregues `NEXT_PUBLIC_` a estos nombres.

4. Inicializá las pestañas y encabezados:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run.ps1 sheets:init
# Alternativa con Node y pnpm en el PATH:
pnpm sheets:init
```

El inicializador crea pestañas faltantes, escribe encabezados si están vacíos y rechaza encabezados distintos. No borra ni reemplaza filas existentes. Si falla, revisá los permisos, los nombres y la configuración. No imprime secretos.

5. En **Estudiantes**, aplicá **Formato → Número → Texto sin formato** a la columna A **antes de cargar los códigos**. Cargá desde la fila 2: código individual, nombre, curso y estado activo. Ejemplo de estructura (usá los códigos reales que vos asignes; no son datos de prueba para subir):

| Código individual | Nombre         | Curso | Estado activo |
| ----------------- | -------------- | ----- | ------------- |
| código como texto | nombre privado | 7A    | sí            |

Se aceptan estados activos `sí`, `si`, `true`, `1` o `activo`. Los dos integrantes deben estar activos, ser distintos y pertenecer al mismo curso. Los códigos aceptan letras ASCII, números, guion y guion bajo, con hasta 32 caracteres; se distinguen mayúsculas. Los nombres y la nómina quedan en el servidor y en tu planilla, no se descargan a los estudiantes.

6. Reiniciá el servidor después de cambiar las variables. Probá el ingreso real con dos códigos de la nómina y consultá `/docente`. Si faltan variables se deshabilita el ingreso real y se mantiene la demo. Si hay credenciales inválidas, el servidor informa que no pudo iniciar o guardar; no informa un guardado ficticio.

### Qué guarda cada pestaña

- **Estudiantes:** código individual, nombre, curso y activo. Mantenida por docentes.
- **Partidas:** identificador, actividad, versión, ambos códigos, curso, inicio y modalidad `pareja`. Es el registro inicial inmutable de cada partida.
- **Eventos:** identificador estable, partida, nivel, versión, tipo, fecha ISO, intento, pista, resultado de comprobaciones y código (máximo 12.000 caracteres). Se registran ejecuciones, pistas, cambios de nivel, logros y finalización; no cada tecla.

La pestaña Partidas no se actualiza sobre una misma fila en cada ejecución: el resumen de progreso se calcula a partir de Eventos. Esto evita escrituras concurrentes sobre una fila compartida. Los envíos usan `valueInputOption=RAW`, por lo que una entrada que comienza con `=` no se interpreta como fórmula.

La cola local envía hasta 20 eventos por solicitud y conserva los IDs en los reintentos. Solo elimina un evento pendiente después de la confirmación de su ID por el servidor. Reintenta con espera creciente de 2 a 60 segundos; volver a tener red dispara otro intento. Un corte después de escribir en Sheets y antes de recibir la respuesta puede dejar filas repetidas. **No hay garantía de unicidad al agregar filas.** El panel consolida cada evento y cada partida por ID, tomando la primera aparición. No utiliza un frágil «buscar y agregar» como garantía de unicidad.

Las fechas se almacenan en ISO 8601 UTC y se muestran al docente en America/Argentina/Buenos_Aires. El panel lee hasta 50.000 filas por pestaña; al llegar al límite solicita archivar registros anteriores. Está pensado para la escala de cinco parejas de esta práctica.

## Pantalla docente

Abrí `/docente` e ingresá `TEACHER_ACCESS_SECRET`. La comprobación se hace en el servidor, con cookie HttpOnly, SameSite Strict y Secure en producción. El secreto no se guarda en localStorage ni se pone en la URL. La sesión docente dura 8 horas; las sesiones de parejas, 12 horas. Cambiar el secreto de firma invalida las sesiones previas.

Se ven códigos de la pareja, curso, nivel alcanzado, logros, intentos, pistas únicas consultadas, último registro y finalización. Se actualiza aproximadamente cada 15 segundos y tiene actualización manual. El último registro no demuestra conexión actual. Si la consulta falla, se mantiene la información anterior con una advertencia de desactualización. El acceso docente sin configuración se rechaza.

## Navegar por la campaña

El mapa permite abrir estaciones aprobadas y la primera pendiente. Los destinos futuros permanecen bloqueados. Cambiar de estación conserva código, pistas e intentos y reinicia únicamente la vista previa; mientras se comprueba un programa, la navegación y el reinicio de código quedan bloqueados.

Al revisar, **Retomar misión** lleva al primer objetivo pendiente. Con los seis logros se puede volver al resumen y seguir revisando sin duplicar la finalización. El panel docente muestra **Nivel alcanzado** (el máximo registrado), que puede ser distinto de la estación abierta durante una revisita. Las partidas anteriores conservan su formato y progreso.

## Los seis niveles

| Nivel | Actividad               | Comprobación principal                                                              |
| ----- | ----------------------- | ----------------------------------------------------------------------------------- |
| 1     | Encontrar la estación   | Distingue `null`, otro elemento existente y la referencia a `#estacion`.            |
| 2     | Actualizar el panel     | Comprueba el texto real de `textContent`; explica HTML original frente a DOM.       |
| 3     | Dar la orden            | Conserva el estado antes del clic y enciende después; detecta invocación inmediata. |
| 4     | Controlar la marcha     | Prueba activar, detener y volver a alternar; la cinta responde al estado real.      |
| 5     | Identificar al operador | Cambia el campo entre dos nombres y vuelve a hacer clic sin reiniciar.              |
| 6     | Habilitar el taller     | Prueba vacío, espacios, nombres, recorte de extremos, cambio y limpieza.            |

Cada definición está en `lib/levels.ts`, con identificador, versión, HTML, zonas editables, código inicial, pistas, APIs requeridas, especificación de comprobaciones y estado visual. Los algoritmos compartidos de comprobación están en `lib/runtime.ts`. Después de los niveles 2 y 4 se propone intercambiar roles. Un logro aprobado se conserva al experimentar, pero una nueva ejecución fallida o un cambio sin ejecutar se identifica por separado.

## Ejecución e interpretación de JavaScript

El editor es liviano: campos para zonas editables con líneas de contexto protegidas. Tab inserta dos espacios; Shift + Tab permite salir hacia atrás y Escape quita el foco. No tiene autocompletado que resuelva la actividad.

Acorn analiza la sintaxis. Un intérprete de capacidades ejecuta el AST sobre **elementos HTML reales** en un iframe `sandbox="allow-scripts"`, sin `allow-same-origin`, sin secretos y con CSP que bloquea red, formularios, navegación de base y carga de recursos externos. El código del estudiante nunca se pasa a `eval` ni `new Function`, ni se ejecuta en el servidor. La comunicación valida ventana emisora, origen opaco `null`, canal e identificador de ejecución.

El subconjunto admite variables simples, funciones, parámetros simples, `if`, `return`, operadores básicos, cadenas, plantillas y las APIs `querySelector`, `getElementById`, `textContent`, `value`, `addEventListener('click', ...)`, `trim` y `console.log`. No es una implementación completa de JavaScript: no admite bucles, arrays u objetos literales, `new`, clases, propiedades computadas, importaciones, red, navegación, timers ni otras APIs. Los eventos se registran durante la inicialización. Límite: 8.000 operaciones iniciales, 4.000 por clic, profundidad de 30 llamadas y 32 listeners. Esto limita recursión y crecimiento de listeners; el timeout del padre se usa solo como respaldo, no como mecanismo para interrumpir un bucle arbitrario.

Se comprueba comportamiento real y también la presencia sintáctica de la API objetivo. No se compara todo el programa contra una respuesta textual única ni se usa una expresión regular como evaluador. Se aceptan comillas, formato, nombres alternativos dentro de las zonas y formas equivalentes compatibles con el subconjunto.

Las comprobaciones corren en un iframe separado que luego se elimina. La vista previa empieza de nuevo con el HTML inicial y el código enviado, así pueden probarla sin heredar los nombres o los clics de las pruebas automáticas. Cada ejecución reconstruye ambos entornos. La escena observa snapshots del DOM, no permite seleccionar objetos 3D mediante `querySelector`.

El taller usa Three.js, modelos procedurales sin servicios ni archivos pagos, geometrías sencillas, DPR máximo 1,5 y render objetivo de 30 fps sin sombras. Respeta `prefers-reduced-motion`: congela animación continua y mantiene señales y textos de estado. Si WebGL falta o se pierde, aparece una alternativa textual y los ejercicios siguen funcionando.

**Es una práctica formativa.** Las comprobaciones y la persistencia no acreditan autoría y pueden manipularse desde un navegador controlado por el usuario. El servidor valida sesión, pertenencia a la partida, tamaño y estructura de los envíos; no vuelve a ejecutar código ni genera calificaciones individuales.

## Pruebas

```powershell
pnpm typecheck
pnpm test
pnpm build
# Con el servidor ya iniciado en otra terminal:
pnpm test:e2e
```

Las pruebas de navegador usan Microsoft Edge instalado (`channel: msedge`), 1366 × 768 y un solo worker. Para otra URL definí `TEST_BASE_URL`. Para usar Chromium o WebKit en macOS, instalá el motor correspondiente con `pnpm exec playwright install chromium` o `pnpm exec playwright install webkit` y ejecutá `TEST_BROWSER=chromium pnpm test:e2e` o `TEST_BROWSER=webkit pnpm test:e2e`. No se necesitan cuentas de Google para la batería simulada. Las trazas están desactivadas para evitar archivos temporales grandes al abrir cinco contextos; hay capturas en `tests/artifacts/` y reporte HTML local.

`pnpm test` prueba el intérprete con DOM real de jsdom, sintaxis rechazada, recursión limitada, APIs requeridas, firmas, códigos como texto y consolidación de reenvíos. Las pruebas de API simulan GoogleAuth y Sheets: nunca escriben datos ficticios en una planilla real.

`pnpm test:e2e` recorre la campaña y prueba respuestas incorrectas, pistas, reinicio, recuperación, exportación, controles, cambio visual, teclado, WebGL ausente, movimiento reducido, cola ante falla de red y cinco partidas en contextos aislados. El rendimiento de cinco contextos en una PC no equivale a medir cinco equipos físicos de la escuela.

## Desplegar en Vercel

1. Subí este proyecto a un repositorio privado propio, excluyendo `.env.local`, claves, `node_modules`, `.next`, reportes y resultados de pruebas. El `.gitignore` está preparado.
2. En Vercel elegí **Add New → Project**, importá ese repositorio y seleccioná Next.js. Creá un proyecto nuevo; no reemplaces despliegues existentes. Elegí Node.js 24.x si está disponible y conservá el lockfile de pnpm. Instalación: `pnpm install --frozen-lockfile`. Build: `pnpm build`. No se requiere directorio de salida personalizado.
3. En **Settings → Environment Variables** cargá las seis variables de `.env.example` para los entornos que vayas a utilizar. En la clave privada, pegá el valor de `private_key` en ese formulario privado; no la incluyas en Git ni en el chat.
4. Desplegá y verificá la URL HTTPS que Vercel te entregue. Si agregás variables después, volvé a desplegar. No se utiliza el disco efímero ni memoria del proceso como almacenamiento de resultados.
5. Con dos códigos autorizados, completá un recorrido real y confirmá las filas de Partidas y Eventos y la finalización en `/docente`. Probá un código incorrecto y una recarga. Esa prueba debe hacerse sobre la planilla configurada por vos; los tests simulados no la reemplazan.

No se creó un proyecto Vercel ni una URL pública durante la implementación sin disponer de una cuenta conectada. Revisá el plan y los límites vigentes en tu cuenta antes de confirmar recursos.

## Antes de usarlo en clase

- Configurá la planilla, cuenta de servicio y secretos; inicializá las pestañas y cargá la nómina privada como texto.
- Probá la URL publicada desde una computadora de la escuela, con un recorrido real y acceso docente.
- Confirmá que la sesión finalizada aparece en el panel y que la exportación se descarga.
- Si Sheets falla durante la clase, mantené la página abierta para reintentos y descargá el JSON antes de cerrar. La demo no produce registros reales en el panel docente.
- Revisá la actividad con tu pareja pedagógica. La fecha original de clase es el 26/10/2026 a las 18:00 de Argentina; no hay un cronograma automático ni una restricción por horario.

## Limitaciones conocidas

La conexión real a Google Sheets, la inicialización de encabezados y el acceso docente ya se verificaron. Falta cargar la nómina y comprobar el envío de resultados de una partida real. El despliegue público en Vercel sigue pendiente por falta de cuenta conectada. No hay sincronización entre equipos, recuperación de tokens vencidos, administración de nómina, rate limiting distribuido ni corrección del lado servidor. Para una sesión vencida, conservá el JSON y comenzá una nueva partida autorizada. La consolidación elimina duplicados de la vista; no borra filas repetidas de Sheets. La cola depende del almacenamiento disponible del navegador; si falla, se indica descargar resultados. El subconjunto de JavaScript es intencional y puede rechazar soluciones que funcionarían en un navegador completo.

## Organización

- `app/`: páginas y endpoints de Next.js App Router.
- `components/`: ingreso, campaña, taller y seguimiento docente.
- `lib/levels.ts`, `types.ts`: contenidos y contratos compartidos.
- `lib/parser.ts`, `runtime.ts`, `frame.ts`: parser, intérprete, comprobaciones y aislamiento.
- `lib/sheets.ts`, `auth.ts`, `validation.ts`: integración de servidor y control de acceso.
- `lib/local.ts`, `useGame.ts`: recuperación y cola local.
- `tests/`: pruebas y soluciones de referencia para desarrollo; no se incluyen en el editor.
- `scripts/`: inicialización de Sheets y ejecución en esta PC.

Materiales revisados: [Teoría de JavaScript y HTML](https://docs.google.com/document/d/14Wqu3V2TVicqAtKYesizxA7pUiaRd_NL/edit) y [Trabajo práctico de DOM](https://docs.google.com/document/d/1-egoHZutsl7YOTtns2UbGuqRdR8UaYUd/edit).

Referencias técnicas: [versiones de Node admitidas en Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) y [entrada RAW de Google Sheets](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption).
