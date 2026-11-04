# Plan de acción — diagnóstico de 7.º 1.ª

Fecha: 4 de noviembre de 2026. Estado: versión local implementada y verificada.

## Alcance acordado

- Trabajo en parejas, hasta 90 minutos: presentación 5, resolución 78 y revisión/cierre 7.
- Mantener a Gali, la estación, la identidad institucional y el taller 3D.
- Completar funciones, constructores y métodos sobre código preparado; no escribir la aplicación desde cero.
- Ocho misiones independientes, con dificultad creciente dentro de POO. Poder dejar una pendiente y volver.
- Pistas progresivas registradas sin penalización, sin ranking ni expulsión por tiempo.
- Resultados de la pareja; no atribuir autoría ni dominio individual a partir de la solución compartida.
- Alternar quién escribe y quién revisa cada dos misiones. El docente puede pedir explicaciones breves a ambos.

## Recorrido y evidencias

| Misión                           | Minutos orientativos | Bloque editable y evidencia                                                                              |
| -------------------------------- | -------------------: | -------------------------------------------------------------------------------------------------------- |
| 1. Encender el panel             |                    5 | Función que selecciona un elemento y cambia `textContent`.                                               |
| 2. Registrar al operador         |                    7 | Leer `value` en cada clic y mostrar el nombre actual.                                                    |
| 3. Revisar las baterías          |                    8 | Recorrer un vector y contar cargas mayores o iguales al umbral recibido. Probar vacío y límites.         |
| 4. Calcular el consumo           |                    7 | Parámetros potencia/tiempo, cálculo y retorno; probar cero y valores distintos.                          |
| 5. Crear los robots              |                   10 | Constructor y método; dos instancias con estado independiente.                                           |
| 6. Proteger la energía           |                   12 | Atributo privado, getter y setter: aceptar 0–100, rechazar fuera de rango conservando el valor anterior. |
| 7. Instalar una batería | 15 | Constructor con nombre y batería, mensajes de trabajo, consulta de energía y recarga delegada; Bateria provista. |
| 8. Activar al robot especialista | 14 | Declarar la herencia, constructor con tres datos, sobrescribir trabajar y validar cambio de herramienta. Sin llamadas a métodos heredados; solo super(nombre). |

Fuentes revisadas: Classroom (grabación del 4/11) y Drive: Guía 3 Arrays, Guía 5 Funciones y Modularización, Guía 06 Clases y Objetos, Guía 08 Constructor, Encapsulamiento Avanzado, Guía 10 Composición y Guía 11 Herencia. Algunas guías mezclan ejemplos Java/JavaScript: esta actividad usa exclusivamente JavaScript.

## Implementación

1. **Actividad y compatibilidad.** Nueva versión `2.0.0`, rutas `/diagnostico`, `/diagnostico/jugar` y `/diagnostico/resultado`. Conservar campaña DOM `1.0.0`, rutas anteriores y recuperación local. No migrar ni sobrescribir partidas existentes.
2. **Motor seguro.** Extender el intérprete de AST con listas, ciclos acotados por operaciones y clases interpretadas (constructor, `this`, privados, accesores, composición, herencia, `super`). Sin `eval`, `Function`, red ni acceso a objetos internos del navegador.
3. **Contenido.** Ocho consignas con código de referencia, espacios editables, tres pistas y comprobaciones de comportamiento con múltiples entradas. La vista previa empieza limpia.
4. **Experiencia.** Navegación libre, intentos y borradores por misión, intercambio de roles, duración orientativa y cierre aun con pendientes. Los indicadores separan finalización del diagnóstico y resolución de todas las misiones.
5. **Registro.** Guardar versión en sesión firmada y eventos. Admitir ocho misiones sin mezclar versiones. Conservar primer intento e intentos posteriores en el historial. Perfil por misión: sin intento, en revisión, resuelta sin pistas registradas o resuelta con pistas; sin inferir notas individuales.
6. **Verificación.** Probar soluciones válidas, errores frecuentes, límites del intérprete y escapes; compatibilidad con seis niveles; API/Sheets simulada; recorrido de navegador, navegación con pendientes, recuperación y cierre. Compilar con Node 24/pnpm.
7. **Entrega.** Actualizar README y contexto con implementación y resultados reales de pruebas. Dejar explícitas las verificaciones pendientes en equipos físicos.

## Criterios de aceptación

- Demo de ocho misiones utilizable de principio a fin y campaña anterior funcional.
- Misiones POO realmente ejecutadas y comprobadas, sin comparar respuestas de texto exactas.
- Un bucle infinito o recursión se interrumpe por presupuesto del intérprete.
- Privados protegidos, instancias independientes y herencia/composición verificadas.
- Actividades separadas en almacenamiento y resultados docentes con denominador correcto.
- Sin secretos ni resultados reales en Git; pruebas sin escribir partidas ficticias en Sheets.
- Sin commit, push ni reemplazo de despliegue en esta entrega.

## Seguimiento

- [x] Revisar repositorio, instrucciones y contenidos del año.
- [x] Documentar alcance y plan en el proyecto.
- [x] Implementar actividad, motor y ocho misiones.
- [x] Integrar experiencia, registro y perfil por misión.
- [x] Verificar y actualizar documentación de continuidad.

## Resultado de la implementación

- Ocho misiones, tres pistas por misión, navegación libre, borradores recuperables y cierre con pendientes implementados.
- Gali conserva el acompañamiento, recorrido guiado, celebración de resultados correctos y preferencias de movimiento/intervenciones.
- Perfil local con primer y último intento; panel docente distingue las actividades y presenta resultado, intentos y pistas por tema.
- Sesiones y eventos separados por versión; sin cambios en las columnas de Sheets ni migración de partidas anteriores.
- TypeScript correcto, **31 pruebas de lógica/API aprobadas** y **52 pruebas Chromium aprobadas** (campaña anterior y diagnóstico). Comprobaciones remotas con Sheets simulado, sin escribir datos ficticios en la planilla real.
- Build de producción aprobado con Node 24.22.1 y Next.js 16.4.3, usando webpack en una copia temporal sin `.env.local`. Dependencias conservadas con el lockfile de pnpm 11.25.0. El enlace de dependencias de esa copia requirió invocar el CLI de Next directamente para evitar una reinstalación automática de pnpm; la instalación del proyecto original quedó verificada con `pnpm install --frozen-lockfile`.
- Un recorrido adicional completo de ocho misiones aprobado contra el servidor de desarrollo del proyecto (Turbopack), en demo y con envíos interceptados. Vista previa disponible en `http://localhost:3000/diagnostico` mientras siga activo el servidor.
- Capturas de escritorio, móvil, ancho equivalente a zoom y perfil final revisadas. Están en `tests/artifacts/diagnostico-*.png`, excluidas de Git. La revisión visual permitió corregir una duplicación inicial del diálogo de Gali.
- README, AGENTS y contexto de continuidad actualizados. Sin commit, push ni deploy.

## Pendientes para el aula

### Refinamiento solicitado: ayudas y VS Code

- [x] Reemplazar las 24 pistas por preguntas socráticas sin código resuelto; orientar también mediante preguntas en las comprobaciones fallidas.
- [x] Presentar las preguntas en tarjetas numeradas y reemplazar el botón agotado por un estado discreto.
- [x] Crear `diagnostico-vscode` independiente: ocho ejercicios sin resolver, consignas, tareas del editor, instalación con lockfile, pruebas individuales/completas, modo de observación y exportación.
- [x] Reutilizar el mismo intérprete y las mismas comprobaciones mediante soporte generado; preservar cualquier ejercicio ya editado al regenerar.
- [x] Importar los ocho borradores en el juego con validación y confirmación. Conservar historial/logros y volver a comprobar antes de aprobar o enviar código.
- [x] Documentar que Sheets registra ejecuciones web de una sesión real, no pulsaciones, pruebas locales ni demos. El historial local no se suma al perfil web.
- [x] Verificar TypeScript, 35 pruebas de lógica/API/VS Code, siete escenarios de diagnóstico Chromium y build de producción. Soluciones de prueba únicamente en una copia temporal; los ejercicios entregados permanecen sin resolver. Sin escrituras ficticias en Sheets.
- [x] Comprobar el modo de pruebas al guardar en una copia independiente: ejecución inicial y repetición tras modificar un ejercicio. Verificar que Gali detenido no cubra los textos de las preguntas en escritorio y móvil.

### Verificación pendiente en clase

- Confirmar claridad y duración de las consignas con estudiantes; la distribución 5 + 78 + 7 minutos es orientativa y no bloquea la actividad al cumplirse el tiempo.
- Comprobar rendimiento y WebGL en los equipos físicos de la escuela/Mac. Las pruebas Chromium de Windows no sustituyen esa comprobación.
- Verificar un ingreso y guardado real del diagnóstico con los códigos que use el docente, cuando corresponda realizar la actividad. La integración nueva se validó con simulaciones; no se generaron partidas reales durante el desarrollo.

Los 78 minutos son una estimación pedagógica: falta una prueba con estudiantes para confirmar tiempos y ajustar consignas.
