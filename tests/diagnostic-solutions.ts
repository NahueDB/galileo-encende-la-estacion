export const diagnosticSolutions = [
  ['const panel = document.getElementById("estado"); panel.textContent = "Panel encendido";'],
  ['const nombre = campo.value; mensaje.textContent = `Estación asignada a ${nombre}`;'],
  [
    'let total = 0; for (let i = 0; i < cargas.length; i++) { if (cargas[i] >= minimo) total++; } return total;',
  ],
  ['return potencia * horas;'],
  [
    'this.nombre = nombre; this.energia = energia;',
    'return `Soy ${this.nombre} y tengo ${this.energia} de energía`;',
  ],
  ['return this.#energia;', 'if (valor >= 0 && valor <= 100) { this.#energia = valor; }'],
  [
    `class Robot {
    constructor(nombre, bateria) { this.nombre = nombre; this.bateria = bateria; }
    trabajar(costo) {
      if (this.bateria.consumir(costo)) return this.nombre + " completó el trabajo";
      return this.nombre + " no tiene energía suficiente";
    }
    energiaDisponible() { return this.bateria.energia; }
    recargar(cantidad) { return this.bateria.cargar(cantidad); }
  }`,
  ],
  [
    `class RobotReparador extends Robot {
    constructor(nombre, herramienta, especialidad) {
      super(nombre); this.herramienta = herramienta; this.especialidad = especialidad;
    }
    trabajar() { return this.nombre + " repara " + this.especialidad + " con " + this.herramienta; }
    cambiarHerramienta(nueva) { if (nueva !== "") this.herramienta = nueva; }
  }`,
  ],
];
