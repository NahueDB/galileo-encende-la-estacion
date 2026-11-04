import type { Level } from './types';
import { DIAGNOSTIC_VERSION } from './types';

const base = { version: DIAGNOSTIC_VERSION, required: [] as string[], visual: 'diagnostic' };
const panel = '<p id="estado">Estación en espera</p>';
const message = 'const estado = document.querySelector("#estado");\n';
const zone = (label: string, initial: string, rows = 6) => ({ label, initial, rows });
export const diagnosticLevels: Level[] = [
  {
    ...base,
    id: 1,
    minutes: 5,
    title: 'Encender el panel',
    concept: 'DOM · selección y texto',
    objective:
      'Completá encenderPanel(): buscá el párrafo con id estado y cambiá su texto por «Panel encendido». El evento del botón ya está preparado; el panel debe esperar al clic.',
    html: panel + '<button id="activar" type="button">Encender panel</button>',
    prefix: 'function encenderPanel() {\n',
    zones: [zone('Cuerpo de encenderPanel', '  // Buscá el panel y actualizá su texto')],
    suffix: '\n}\ndocument.querySelector("#activar").addEventListener("click", encenderPanel);',
    required: ['textContent'],
    tests: ['Espera al clic', 'Actualiza el párrafo correcto'],
    hints: [
      '¿Qué elemento del HTML tiene que cambiar y cómo podés distinguirlo de los demás?',
      '¿Qué herramienta de selección recordás para encontrar ese elemento a partir de su identificador?',
      'Una vez encontrado el párrafo, ¿qué parte necesitás modificar para mostrar el mensaje? ¿Cómo comprobarías que el cambio ocurre al hacer clic?',
    ],
  },
  {
    ...base,
    id: 2,
    minutes: 7,
    title: 'Registrar al operador',
    concept: 'DOM · entrada y salida',
    objective:
      'Completá registrar(): leé el valor actual de campo y mostrá «Estación asignada a [nombre]» en mensaje. El evento ya está preparado. Cada clic debe usar el nombre que esté escrito en ese momento.',
    html: '<label for="nombre">Nombre del operador</label><input id="nombre"><button id="registrar" type="button">Registrar</button><p id="mensaje">No hay una persona registrada</p>',
    prefix:
      'const campo = document.querySelector("#nombre");\nconst mensaje = document.querySelector("#mensaje");\nfunction registrar() {\n',
    zones: [zone('Cuerpo de registrar', '  // Leé el campo en cada clic y mostrale el saludo')],
    suffix: '\n}\ndocument.querySelector("#registrar").addEventListener("click", registrar);',
    required: ['value', 'textContent'],
    tests: ['Mensaje inicial', 'Dos nombres sin reiniciar'],
    hints: [
      '¿De dónde sale el nombre que debe aparecer en el mensaje y en qué momento puede cambiar?',
      'Si escribieran otro nombre antes del segundo clic, ¿en qué momento tendría que leerse el campo para usar ese dato nuevo?',
      '¿Cómo podrían combinar el mensaje fijo con el nombre actual? ¿Qué prueba les permitiría detectar que quedó guardado un nombre anterior?',
    ],
  },
  {
    ...base,
    id: 3,
    minutes: 8,
    title: 'Revisar las baterías',
    concept: 'Vectores · ciclos y condiciones',
    objective:
      'Completá contarBaterias(cargas, minimo). Devolvé cuántas cargas son mayores o iguales a minimo. No modifiques la lista recibida. Una lista vacía debe devolver 0. Podés usar for, while o for...of.',
    html: panel,
    prefix: 'function contarBaterias(cargas, minimo) {\n',
    zones: [
      zone(
        'Cuerpo de contarBaterias',
        '  // Recorré la lista, contá las cargas suficientes y devolvé el total',
        8,
      ),
    ],
    suffix:
      '\n}\n' +
      message +
      'estado.textContent = "Baterías disponibles: " + contarBaterias([20, 80, 50, 10], 50);',
    tests: [
      'Recorrido y umbral incluido',
      'Otra lista y otro umbral',
      'Lista vacía',
      'Conserva la lista original',
    ],
    hints: [
      '¿La consigna pide una cantidad de baterías o una suma de sus cargas? ¿Qué resultado esperarían si no hubiera ninguna?',
      '¿Cómo podrían visitar cada carga una sola vez y decidir si cumple la condición? ¿Qué debería pasar si coincide exactamente con el mínimo?',
      '¿Qué dato necesitarían conservar mientras recorren la lista? ¿Cuándo tendría que cambiar y en qué momento deberían devolver el resultado?',
    ],
  },
  {
    ...base,
    id: 4,
    minutes: 7,
    title: 'Calcular el consumo',
    concept: 'Funciones · parámetros y retorno',
    objective:
      'Completá calcularConsumo(potencia, horas). Devolvé potencia multiplicada por horas. La función recibe números no negativos; debe devolver un número, sin imprimirlo ni modificar el HTML desde su cuerpo.',
    html: panel,
    prefix: 'function calcularConsumo(potencia, horas) {\n',
    zones: [zone('Cuerpo de calcularConsumo', '  // Calculá el consumo y devolvé el resultado', 4)],
    suffix:
      '\n}\n' + message + 'estado.textContent = "Consumo: " + calcularConsumo(40, 3) + " Wh";',
    tests: ['Dos parámetros distintos', 'Potencia o tiempo cero', 'Valores decimales'],
    hints: [
      '¿Qué representa cada parámetro y qué debería pasar con el consumo si se duplica el tiempo?',
      '¿Qué relación entre potencia y tiempo coincide con el resultado esperado? ¿También funciona cuando uno de los datos vale cero?',
      '¿Mostrar un número y entregarlo a quien llamó a la función producen el mismo efecto? ¿Cómo podrían comprobar qué valor recibe esa llamada?',
    ],
  },
  {
    ...base,
    id: 5,
    minutes: 10,
    title: 'Crear los robots',
    concept: 'POO · constructor, atributos y métodos',
    objective:
      'Completá constructor(nombre, energia) y presentarse(). Cada Robot guarda su propio nombre y energia. presentarse() devuelve «Soy [nombre] y tengo [energia] de energía». Probamos dos robots con datos diferentes.',
    html: panel,
    prefix: 'class Robot {\n  constructor(nombre, energia) {\n',
    zones: [
      zone('Cuerpo del constructor de Robot', '    // Guardá ambos datos en esta instancia', 4),
      zone('Cuerpo de presentarse', '    // Devolvé la presentación de este robot', 4),
    ],
    joins: ['\n  }\n  presentarse() {\n'],
    suffix:
      '\n  }\n}\n' +
      message +
      'const gali = new Robot("Gali", 80);\nestado.textContent = gali.presentarse();',
    tests: ['Guarda los parámetros', 'Presenta dos robots', 'Instancias independientes'],
    hints: [
      '¿Qué información necesita conservar cada robot después de que termine su constructor?',
      'Si crean dos robots con datos distintos, ¿cómo se refiere un método al objeto particular que lo está ejecutando?',
      'Si cambia la energía de uno de los robots, ¿de dónde debería obtener sus datos la próxima presentación? ¿Qué tendría que ocurrir con la presentación del otro?',
    ],
  },
  {
    ...base,
    id: 6,
    minutes: 12,
    title: 'Proteger la energía',
    concept: 'POO · encapsulamiento y accesores',
    objective:
      'El atributo privado #energia y el constructor ya están preparados. Completá get energia y set energia(valor). El getter devuelve la carga. El setter acepta valores entre 0 y 100 inclusive; si el valor está fuera del rango, conserva la carga anterior.',
    html: panel,
    prefix:
      'class Bateria {\n  #energia = 0;\n  constructor(energia) {\n    this.energia = energia;\n  }\n  get energia() {\n',
    zones: [
      zone('Cuerpo del getter energia', '    // Devolvé el atributo privado', 4),
      zone(
        'Cuerpo del setter energia',
        '    // Validá el rango antes de cambiar el atributo privado',
        6,
      ),
    ],
    joins: ['\n  }\n  set energia(valor) {\n'],
    suffix:
      '\n  }\n}\n' +
      message +
      'const bateria = new Bateria(70);\nbateria.energia = 120;\nestado.textContent = "Energía protegida: " + bateria.energia;',
    tests: [
      'Lectura del valor privado',
      'Acepta 0 y 100',
      'Rechaza negativos y más de 100',
      'No mezcla instancias',
    ],
    hints: [
      '¿Qué diferencia hay entre consultar la energía y pedir un cambio? ¿Qué responsabilidad tiene cada accesor?',
      '¿Qué condiciones debe cumplir una carga válida? ¿Los valores de los extremos pertenecen al rango permitido?',
      'Si la nueva carga es inválida, ¿qué valor debería seguir mostrando la batería? ¿En qué caso tendría sentido modificar el dato privado?',
    ],
  },
  {
    ...base,
    id: 7,
    minutes: 15,
    title: 'Instalar una batería',
    concept: 'POO · composición y delegación',
    objective:
      'Completá Robot: su constructor recibe nombre y una bateria ya creada y guarda ambos. trabajar(costo) delega en consumir(costo) y devuelve «[nombre] completó el trabajo» si alcanza la energía, o «[nombre] no tiene energía suficiente» si no alcanza. energiaDisponible() consulta la carga de la batería. recargar(cantidad) delega en cargar(cantidad) y devuelve su resultado booleano. Bateria ya valida consumos y recargas; no crees una carga paralela.',
    prefix:
      'class Bateria {\n  #energia;\n  constructor(energia) { this.#energia = energia; }\n  get energia() { return this.#energia; }\n  consumir(costo) {\n    if (costo >= 0 && costo <= this.#energia) {\n      this.#energia -= costo;\n      return true;\n    }\n    return false;\n  }\n  cargar(cantidad) {\n    if (cantidad > 0 && this.#energia + cantidad <= 100) {\n      this.#energia += cantidad;\n      return true;\n    }\n    return false;\n  }\n}\n',
    suffix:
      '\nconst estado = document.querySelector("#estado");\nconst bateria = new Bateria(80);\nconst gali = new Robot("Gali", bateria);\nestado.textContent = gali.trabajar(30) + ". Energía: " + gali.energiaDisponible();',
    tests: [
      'Guarda nombre y componente',
      'Mensajes y consumo',
      'Recarga delegada y límites',
      'Componentes independientes',
    ],
    hints: [
      '¿Qué datos pertenecen al robot y cuál es el objeto que administra la energía?',
      '¿Qué respuesta da la batería cuando intentan consumir? ¿Cómo elegirían el mensaje a partir de esa respuesta?',
      '¿Qué objeto ya valida las recargas? ¿Cómo comprobarían que un robot no cambia la batería de otro?',
    ],
    html: panel,
    zones: [
      zone(
        'Clase Robot',
        'class Robot {\n  constructor(nombre, bateria) {\n    // Guardá el nombre y la batería recibida\n  }\n  trabajar(costo) {\n    // Pedile energía a la batería y devolvé el mensaje correspondiente\n  }\n  energiaDisponible() {\n    // Consultá la energía del componente\n  }\n  recargar(cantidad) {\n    // Delegá la recarga en la batería y devolvé su respuesta\n  }\n}',
        20,
      ),
    ],
  },
  {
    ...base,
    id: 8,
    minutes: 14,
    title: 'Activar al robot especialista',
    concept: 'POO · herencia y sobrescritura',
    objective:
      'Declará RobotReparador extends Robot. Su constructor recibe nombre, herramienta y especialidad: inicializá la parte heredada con super(nombre) y guardá los otros datos. Sobrescribí trabajar() para devolver «[nombre] repara [especialidad] con [herramienta]». Agregá cambiarHerramienta(nueva): actualizá la herramienta solo si nueva es distinta de "". identificar() se conserva por herencia; no tenés que llamarlo ni reescribirlo.',
    prefix:
      'class Robot {\n  constructor(nombre) { this.nombre = nombre; }\n  identificar() { return this.nombre; }\n  trabajar() { return this.nombre + " trabaja"; }\n}\n',
    suffix:
      '\nconst estado = document.querySelector("#estado");\nconst gali = new RobotReparador("Gali", "soldador", "paneles");\nestado.textContent = gali.trabajar();',
    tests: [
      'Declara la herencia',
      'Inicializa tres atributos',
      'Especializa trabajar',
      'Cambia herramienta y rechaza texto vacío',
    ],
    hints: [
      '¿Cómo expresa una clase que es una especialización de otra? ¿Qué datos agrega el reparador?',
      '¿Qué parte del constructor necesita inicializar primero la clase base? ¿Qué datos quedan a cargo del reparador?',
      '¿Qué debería ocurrir con la herramienta anterior si reciben un texto vacío? ¿Cómo se reflejaría un cambio válido en el próximo trabajo?',
    ],
    html: panel,
    zones: [
      zone(
        'Clase RobotReparador',
        '// Declaración de la clase RobotReparador y su herencia\n  // constructor(nombre, herramienta, especialidad)\n  // trabajar()\n  // cambiarHerramienta(nueva)\n',
        20,
      ),
    ],
  },
];

// Six decorative modules; academic progress always counts eight missions.
export function diagnosticWorkshopModules(completed: readonly number[]) {
  const done = new Set(completed);
  return [[1], [2], [3], [4], [5, 6], [7, 8]].flatMap((group, i) =>
    group.every((id) => done.has(id)) ? [i + 1] : [],
  );
}
