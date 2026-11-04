// GALILEO · MISIÓN 8: Activar al robot especialista
// Modificá solamente los bloques marcados.

class Robot {
  constructor(nombre) { this.nombre = nombre; }
  identificar() { return this.nombre; }
  trabajar() { return this.nombre + " trabaja"; }
}
class RobotReparador extends Robot {
  constructor(nombre, herramienta) {
// INICIO BLOQUE 1
    // Inicializá al padre y guardá la herramienta
// FIN BLOQUE 1
  }
  trabajar() {// INICIO BLOQUE 2
    // Devolvé el comportamiento especializado
// FIN BLOQUE 2
  }
}
const estado = document.querySelector("#estado");
const gali = new RobotReparador("Gali", "soldador");
estado.textContent = gali.trabajar();
