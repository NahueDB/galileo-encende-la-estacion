import { assemble } from './levels';
import type { Level } from './types';
const legacy = {
  '7': {
    prefix:
      'class Bateria {\n  #energia;\n  constructor(energia) { this.#energia = energia; }\n  get energia() { return this.#energia; }\n  consumir(costo) {\n    if (costo >= 0 && costo <= this.#energia) {\n      this.#energia -= costo;\n      return true;\n    }\n    return false;\n  }\n}\nclass Robot {\n  constructor(bateria) { this.bateria = bateria; }\n  trabajar(costo) {\n',
    joins: ['\n  }\n  energiaDisponible() {\n'],
    suffix:
      '\n  }\n}\nconst estado = document.querySelector("#estado");\nconst bateria = new Bateria(80);\nconst gali = new Robot(bateria);\ngali.trabajar(30);\nestado.textContent = "Energía disponible: " + gali.energiaDisponible();',
  },
  '8': {
    prefix:
      'class Robot {\n  constructor(nombre) { this.nombre = nombre; }\n  identificar() { return this.nombre; }\n  trabajar() { return this.nombre + " trabaja"; }\n}\nclass RobotReparador extends Robot {\n  constructor(nombre, herramienta) {\n',
    joins: ['\n  }\n  trabajar() {\n'],
    suffix:
      '\n  }\n}\nconst estado = document.querySelector("#estado");\nconst gali = new RobotReparador("Gali", "soldador");\nestado.textContent = gali.trabajar();',
  },
};
export function diagnosticDraft(level: Level, zones: string[]) {
  if (level.id >= 7 && zones.length === 2) {
    const old = legacy[level.id as 7 | 8];
    return old.prefix + zones.map((code, i) => code + (old.joins[i] ?? '')).join('') + old.suffix;
  }
  return assemble(level, zones);
}
