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
      'Un id permite encontrar un elemento concreto del HTML.',
      'querySelector("#estado") encuentra el párrafo. textContent cambia su texto.',
      'Guardá el párrafo en una variable y asignale "Panel encendido" a su propiedad textContent.',
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
      'El valor de un campo puede cambiar después de cargar la página.',
      'campo.value devuelve la entrada; mensaje.textContent permite mostrar la salida.',
      'Dentro de registrar, guardá campo.value y concatenalo con "Estación asignada a ".',
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
      'Necesitás contar elementos, no sumar sus cargas.',
      'Empezá un contador en 0. En cada vuelta compará la carga con minimo usando >=.',
      'Recorré desde índice 0 mientras i < cargas.length; si cargas[i] >= minimo, aumentá el contador. Retornalo al terminar.',
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
      'Los datos de entrada están en los parámetros; no necesitás fijar valores dentro de la función.',
      'Multiplicá potencia por horas. return entrega el resultado a quien llamó a la función.',
      'El cuerpo puede resolverse con una instrucción: return seguida del producto de los parámetros.',
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
      'La clase es el molde; cada objeto conserva sus propios valores.',
      'Usá this.nombre y this.energia para guardar y consultar atributos.',
      'En el constructor asigná los parámetros a this. En presentarse, retorná un texto usando los atributos de esa instancia.',
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
      'El acceso público energia controla un dato privado llamado #energia.',
      'El getter usa return. El setter modifica this.#energia solo cuando valor >= 0 y valor <= 100.',
      'Combiná ambas comparaciones con &&; dejá la asignación dentro del if, sin un else que borre el valor anterior.',
    ],
  },
  {
    ...base,
    id: 7,
    minutes: 12,
    title: 'Instalar una batería',
    concept: 'POO · composición y delegación',
    objective:
      'Robot recibe un objeto Bateria ya creado. Completá trabajar(costo) para delegar en consumir(costo) de esa batería y devolver su resultado booleano. Completá energiaDisponible() para devolver la energía de la batería. No crees una carga paralela en el robot. Bateria ya resuelve si alcanza la energía.',
    html: panel,
    prefix:
      'class Bateria {\n  #energia;\n  constructor(energia) { this.#energia = energia; }\n  get energia() { return this.#energia; }\n  consumir(costo) {\n    if (costo >= 0 && costo <= this.#energia) {\n      this.#energia -= costo;\n      return true;\n    }\n    return false;\n  }\n}\nclass Robot {\n  constructor(bateria) { this.bateria = bateria; }\n  trabajar(costo) {\n',
    zones: [
      zone(
        'Cuerpo de trabajar',
        '    // Pedile a la batería que consuma y devolvé su respuesta',
        4,
      ),
      zone('Cuerpo de energiaDisponible', '    // Consultá la energía del componente', 4),
    ],
    joins: ['\n  }\n  energiaDisponible() {\n'],
    suffix:
      '\n  }\n}\n' +
      message +
      'const bateria = new Bateria(80);\nconst gali = new Robot(bateria);\ngali.trabajar(30);\nestado.textContent = "Energía disponible: " + gali.energiaDisponible();',
    tests: [
      'Consume en la batería recibida',
      'Rechaza consumo insuficiente',
      'Consumo exacto y cero',
      'Componentes independientes',
    ],
    hints: [
      'Un Robot tiene una Bateria: es composición.',
      'this.bateria es el objeto recibido. Podés llamar su método consumir(costo).',
      'trabajar retorna this.bateria.consumir(costo). energiaDisponible retorna this.bateria.energia; el getter se consulta sin paréntesis.',
    ],
  },
  {
    ...base,
    id: 8,
    minutes: 14,
    title: 'Activar al robot especialista',
    concept: 'POO · herencia y sobrescritura',
    objective:
      'RobotReparador ya extiende Robot. Completá su constructor(nombre, herramienta): inicializá la parte heredada con super y guardá herramienta. Sobrescribí trabajar() para devolver «[nombre] repara con [herramienta]». Debe conservar identificar(), heredado de Robot, que devuelve el nombre.',
    html: panel,
    prefix:
      'class Robot {\n  constructor(nombre) { this.nombre = nombre; }\n  identificar() { return this.nombre; }\n  trabajar() { return this.nombre + " trabaja"; }\n}\nclass RobotReparador extends Robot {\n  constructor(nombre, herramienta) {\n',
    zones: [
      zone(
        'Cuerpo del constructor de RobotReparador',
        '    // Inicializá al padre y guardá la herramienta',
        5,
      ),
      zone(
        'Cuerpo de trabajar en RobotReparador',
        '    // Devolvé el comportamiento especializado',
        4,
      ),
    ],
    joins: ['\n  }\n  trabajar() {\n'],
    suffix:
      '\n  }\n}\n' +
      message +
      'const gali = new RobotReparador("Gali", "soldador");\nestado.textContent = gali.trabajar();',
    tests: [
      'Inicializa al padre y la herramienta',
      'Conserva un método heredado',
      'Sobrescribe trabajar',
      'Otra instancia y clase base intacta',
    ],
    hints: [
      'Un RobotReparador es un Robot: hereda sus datos y métodos.',
      'En el constructor llamá super(nombre) antes de usar this; después guardá la herramienta.',
      'Guardá this.herramienta y retorná el texto de trabajar usando this.nombre y this.herramienta. identificar no necesita volver a escribirse.',
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
