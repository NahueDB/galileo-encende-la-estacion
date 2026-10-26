# Verificación de la entrega

Fecha: 26 de octubre de 2026, antes de la clase de las 18:00 de Argentina.

## Comprobado

- Node.js 24.22.1 y pnpm 11.25.0.
- Instalación con `pnpm install --frozen-lockfile` correcta.
- `pnpm typecheck` sin errores.
- `pnpm build` correcto con Next.js 16.4.3, App Router y TypeScript.
- El script `scripts/run.ps1 typecheck` funciona con el entorno disponible de esta PC.
- Diez pruebas de lógica y API aprobadas.
- Ocho pruebas de navegador aprobadas en Microsoft Edge, sobre el servidor de producción.
- Campaña demo completa de seis niveles; controles sobre DOM real y reacción visual del taller.
- Respuestas incorrectas, pistas, reinicio con confirmación, recuperación después de recargar, exportación JSON y logros conservados al experimentar.
- Aislamiento del intérprete, restricciones de sintaxis y límite de recursión.
- Modo sin WebGL y movimiento reducido.
- 1366 × 768 sin desbordes horizontales y navegación inicial por teclado.
- Cinco partidas simultáneas en contextos separados del navegador.
- Pérdida de red y reenvío simulado con los mismos identificadores; la cola solo se vacía tras confirmar.
- API con Google Sheets simulado: códigos activos, pareja distinta, curso coincidente, ceros iniciales, cinco solicitudes concurrentes, RAW, autorización y deduplicación de resumen.
- Sesión docente con secretos ficticios de prueba: comprobación de servidor, cookie HttpOnly / Secure / SameSite Strict, cierre y endpoint protegido.
- Visualización docente de una finalización simulada mediante fixture del navegador, sin subir datos ficticios a Google.
- Recorrido completo final sin errores de consola ni excepciones de página.
- Capturas revisadas del ingreso, taller y controles. Las capturas de página completa pueden mostrar un fotograma transitorio del iframe al cambiar de altura; se comprobó por separado el tamaño y la visualización de sus controles.

## No comprobado con servicios o equipos reales

- Envío de resultados de una partida real: pendiente de cargar la nómina. La conexión y la escritura de encabezados reales ya se verificaron.
- Validación contra una nómina real y finalización real visible en el panel: se verificaron con simulaciones, no con la planilla del docente.
- Despliegue en Vercel: no había autenticación disponible ni proyecto de hosting configurado.
- Rendimiento y funcionamiento en las cinco computadoras físicas de la escuela.

El servidor temporal de producción usado para probar el acceso docente tenía secretos ficticios y se cerró al terminar. La aplicación local de la entrega permanece en el puerto 3000, con Sheets configurado y acceso docente verificado. No existe una URL pública verificada.

Los comandos, variables y pasos para la conexión real están en README.md y .env.example. Antes de la clase, falta completar esa configuración y realizar un recorrido real desde una computadora de la escuela.

## Actualización: conexión real con Google Sheets

- Cuenta de servicio autenticada y permiso de edición confirmado.
- Estudiantes, Partidas y Eventos inicializadas con sus encabezados, sin sobrescribir datos existentes.
- Configuración local completa; secreto de firma fortalecido sin exponer su valor.
- Acceso docente real: login 200, consulta a Sheets 200, cierre 200 y acceso sin sesión 401.
- Códigos inexistentes rechazados con HTTP 400.
- No se crearon partidas ni eventos ficticios. La nómina está vacía.
- Pendiente: cargar estudiantes reales con códigos como texto y hacer un recorrido real. El despliegue Vercel sigue pendiente.

## Actualización: identidad institucional y WebGL

- Retirado el enlace docente del encabezado. Acceso directo y protegido por /docente.
- Escudo oficial guardado localmente, con procedencia documentada; iconos y paleta institucional actualizados.
- Contexto WebGL 2 comprobado antes de crear WebGLRenderer, atributos conservadores y liberación explícita al desmontar.
- Pérdida gráfica detiene el renderizado; restauración y botón de reintento disponibles.
- TypeScript y diez pruebas de lógica/API aprobadas.
- Once pruebas de navegador Edge aprobadas, incluida campaña completa, fallas gráficas simuladas y liberación de contextos. La prueba docente con secretos ficticios se omitió en este pase porque el servidor local está configurado con credenciales reales; no se sobrescribieron.
- No se dispone de la GPU física de la MacBook para verificar el caso nativo.
- Build de producción aprobado y tres pruebas adicionales en WebKit aprobadas (identidad y contexto gráfico no disponible o bloqueado). Estas pruebas corrieron en Windows y no acreditan rendimiento de la GPU de una Mac.
