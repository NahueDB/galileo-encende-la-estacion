# Galileo · diagnóstico en VS Code

Abrí **esta carpeta** en VS Code. Se puede copiar y usar por separado del sitio. Trabajen en pareja y cambien quién escribe y quién revisa cada dos misiones.

## Preparación

Necesitás Node.js 24 y pnpm. En la terminal de esta carpeta, ejecutá una vez:

```powershell
pnpm install --frozen-lockfile
```

La primera instalación necesita internet. Después, las pruebas funcionan sin conexión y no necesitan cuentas ni credenciales de Google.

## Completar y probar

1. Leé [CONSIGNAS.md](CONSIGNAS.md).
2. Abrí un archivo de `ejercicios`, del `01.js` al `08.js`.
3. Completá solamente lo que está entre `INICIO BLOQUE` y `FIN BLOQUE`. Conservá esos comentarios. El contexto de cada función o clase está preparado.
4. Probá una misión o todas:

```powershell
pnpm test 1
pnpm test
```

También podés elegir **Terminal → Ejecutar tarea → Galileo: probar una misión**. Para repetir las pruebas automáticamente cada vez que guardás:

```powershell
pnpm test:watch
```

Es normal que las comprobaciones fallen antes de completar los bloques. Los mensajes señalan qué quedó por pensar; no incluyen soluciones completas. Si necesitás orientación, pedí las preguntas de Gali en la web para que su consulta quede registrada.

Se evalúan solamente los bloques marcados: las modificaciones fuera de ellos no se ejecutan ni se exportan. Las pruebas usan el mismo intérprete y los mismos casos de la web, incluso para DOM. Admiten el mismo subconjunto de JavaScript; no hace falta abrir un HTML ni instalar Live Server. El último resultado se guarda en `resultados/ultimo.json`.

## Entregar desde la sesión de su pareja

```powershell
pnpm entrega
```

Esto genera **`respuestas-galileo.json`**, con los ocho borradores, aunque haya misiones pendientes.

Ingresen al diagnóstico web con el código de actividad y los dos códigos de la pareja. Elijan **Importar desde VS Code**, seleccionen ese archivo y confirmen la carga. Luego, entren a cada misión y presionen **Ejecutar y comprobar** para registrar el código y sus comprobaciones en Google Sheets. El sitio vuelve a verificar las respuestas; importar no aprueba misiones por sí solo.

Las pruebas y exportaciones locales no envían datos a Sheets. En modo demo, tampoco se envían desde la web. Pueden seguir editando después de exportar y volver a generar el archivo. Antes de importar, revisen que no quieran conservar otros borradores del navegador: la importación reemplaza los ocho, con confirmación.

El historial de pruebas locales no se suma al perfil web. Ese perfil registra las ejecuciones hechas en el juego después de importar; no debe interpretarse como la cantidad total de intentos realizados en VS Code.

## Organización

- `ejercicios/`: los ocho archivos que completan ustedes.
- `soporte/`: motor y pruebas; no necesitan modificarlo.
- `.vscode/tasks.json`: tareas para ejecutar desde VS Code.
- `CONSIGNAS.md`: objetivos y tiempos orientativos, hasta 90 minutos en total con presentación y cierre.

No contiene respuestas resueltas, claves, nóminas ni resultados de otros estudiantes.
