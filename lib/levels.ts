import { Level, VERSION } from './types';
const state = '<p id="estado">Estación en espera</p>';
const buttons =
  '<button id="activar" type="button">Activar</button>\n<button id="detener" type="button">Detener</button>';
const form =
  '<label for="nombre">Nombre de la persona responsable</label>\n<input id="nombre" type="text">\n<button id="registrar" type="button">Registrar</button>';
const refs = 'const estado = document.querySelector("#estado");\n';
const formRefs =
  'const campo = document.querySelector("#nombre");\nconst mensaje = document.querySelector("#mensaje");\nconst boton = document.querySelector("#registrar");\n';
export const levels: Level[] = [
  {
    id: 1,
    version: VERSION,
    title: 'Encontrar la estación',
    concept: 'Selección · querySelector',
    objective:
      'El taller está a oscuras. Completá el selector para encontrar el párrafo con id estacion. Guardamos su referencia en la constante estacion.',
    html: '<h2 id="titulo">Taller Galileo</h2>\n<p id="estacion">Estación en espera</p>\n<p class="aviso">Panel auxiliar</p>',
    prefix: 'const estacion = document.querySelector(',
    zones: [{ label: 'Selector CSS (incluí las comillas)', initial: '""', rows: 1 }],
    suffix: ');',
    hints: [
      'Un identificador permite encontrar un único elemento del documento.',
      'querySelector recibe un selector CSS como texto. Para un id, usá #.',
      'El identificador es estacion. Escribí "#estacion".',
    ],
    required: ['querySelector'],
    visual: 'selected',
    tests: ['Selecciona un elemento existente', 'La referencia corresponde a #estacion'],
  },
  {
    id: 2,
    version: VERSION,
    title: 'Actualizar el panel',
    concept: 'Propiedades · textContent',
    objective:
      'Usá la referencia estado y textContent para mostrar exactamente «El taller está disponible para trabajar». Cambia el DOM de la página abierta; el archivo HTML original conserva su contenido.',
    html: state,
    prefix: refs,
    zones: [{ label: 'Asignación al párrafo', initial: '// Completá la asignación', rows: 2 }],
    suffix: '',
    hints: [
      'Ya tenemos una referencia al párrafo. Ahora necesitamos modificar una propiedad.',
      'textContent permite reemplazar el texto del elemento.',
      'Usá estado.textContent = "El taller está disponible para trabajar";',
    ],
    required: ['textContent'],
    visual: 'ready',
    tests: ['El párrafo muestra el aviso solicitado'],
  },
  {
    id: 3,
    version: VERSION,
    title: 'Dar la orden',
    concept: 'Eventos · addEventListener',
    objective:
      'Registrá encender para el evento click de boton. Al iniciar debe seguir en espera; recién al pulsar Activar debe mostrar «Estación en funcionamiento».',
    html: state + '\n<button id="activar" type="button">Activar</button>',
    prefix:
      refs +
      'const boton = document.querySelector("#activar");\nfunction encender() {\n  estado.textContent = "Estación en funcionamiento";\n}\n',
    zones: [{ label: 'Registro del evento', initial: '// Asociá el clic con la función', rows: 2 }],
    suffix: '',
    hints: [
      'Definir una función no la ejecuta. El evento decide cuándo llamarla.',
      'addEventListener recibe el nombre del evento y una referencia a la función.',
      'Escribí boton.addEventListener("click", encender); sin invocar encender().',
    ],
    required: ['addEventListener'],
    visual: 'running',
    tests: ['Permanece en espera antes del clic', 'Activar enciende la estación'],
  },
  {
    id: 4,
    version: VERSION,
    title: 'Controlar la marcha',
    concept: 'Funciones · dos controles',
    objective:
      'Completá ambas funciones. Activar debe mostrar «Estación en funcionamiento» y Detener, «Estación detenida». Probá alternarlos: la cinta responde al texto real del panel.',
    html: state + '\n' + buttons,
    prefix:
      refs +
      'const activar = document.getElementById("activar");\nconst detener = document.getElementById("detener");\nfunction encender() {\n',
    zones: [
      { label: 'Cuerpo de encender', initial: '  // Encendé la estación', rows: 3 },
      { label: 'Cuerpo de apagar', initial: '  // Detené la estación', rows: 3 },
    ],
    joins: ['\n}\nfunction apagar() {\n'],
    suffix:
      '\n}\nactivar.addEventListener("click", encender);\ndetener.addEventListener("click", apagar);',
    hints: [
      'Cada botón necesita su propia acción. No cambies el estado durante la inicialización.',
      'Dentro de cada función asigná un texto distinto a estado.textContent.',
      'Encender: estado.textContent = "Estación en funcionamiento"; Apagar: estado.textContent = "Estación detenida";',
    ],
    required: ['addEventListener', 'textContent'],
    visual: 'running',
    tests: ['Estado inicial sin cambios', 'Activar → Detener → Activar → Detener'],
  },
  {
    id: 5,
    version: VERSION,
    title: 'Identificar al operador',
    concept: 'Entrada · value',
    objective:
      'Dentro de registrar, leé el valor actual del campo y mostrá «Estación asignada a [nombre]» en mensaje. No alcanza con leer el nombre una sola vez al cargar.',
    html: form + '\n<p id="mensaje">No hay una persona registrada</p>',
    prefix: formRefs + 'function registrar() {\n',
    zones: [
      {
        label: 'Cuerpo de registrar',
        initial: '  // Leé el campo y actualizá el mensaje',
        rows: 5,
      },
    ],
    suffix: '\n}\nboton.addEventListener("click", registrar);',
    hints: [
      'El campo puede cambiar entre dos clics. Leelo en cada registro.',
      'campo.value devuelve lo escrito; mensaje.textContent permite mostrar la salida.',
      'Dentro de registrar: const nombre = campo.value; mensaje.textContent = "Estación asignada a " + nombre;',
    ],
    required: ['value', 'textContent'],
    visual: 'badge',
    tests: ['Registra Ana', 'Cambia a Bruno sin volver a ejecutar el script'],
  },
  {
    id: 6,
    version: VERSION,
    title: 'Habilitar el taller',
    concept: 'Integración · validar y limpiar',
    objective:
      'Escribí registrar y limpiar, y registrá sus eventos. Usá trim(): vacío o espacios → «Ingresá el nombre de la persona responsable». Nombre válido → «Estación asignada a [nombre]». Limpiar vacía el campo y restablece «No hay una persona registrada».',
    html:
      form +
      '\n<button id="limpiar" type="button">Limpiar</button>\n<p id="mensaje">No hay una persona registrada</p>',
    prefix: formRefs + 'const botonLimpiar = document.querySelector("#limpiar");\n',
    zones: [
      {
        label: 'Funciones y registro de eventos',
        initial:
          'function registrar() {\n  // Leé, validá y mostrá el resultado\n}\n\nfunction limpiar() {\n  // Restablecé campo y mensaje\n}\n\n// Registrá las dos funciones',
        rows: 13,
      },
    ],
    suffix: '',
    hints: [
      'Separá entrada, validación y salida. Limpiar es otra acción independiente.',
      'Usá campo.value.trim() dentro de registrar y un if para comprobar "".',
      'Registrá con addEventListener. Para limpiar: campo.value = ""; mensaje.textContent = "No hay una persona registrada";',
    ],
    required: ['trim', 'value', 'textContent', 'addEventListener'],
    visual: 'complete',
    tests: [
      'Vacío y solo espacios',
      'Nombre válido y espacios en extremos',
      'Segundo nombre y limpieza',
    ],
  },
];
export function assemble(level: Level, zones: string[]) {
  return level.prefix + zones.map((z, i) => z + (level.joins?.[i] ?? '')).join('') + level.suffix;
}
