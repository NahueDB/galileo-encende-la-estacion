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
  ['return this.bateria.consumir(costo);', 'return this.bateria.energia;'],
  [
    'super(nombre); this.herramienta = herramienta;',
    'return this.nombre + " repara con " + this.herramienta;',
  ],
];
