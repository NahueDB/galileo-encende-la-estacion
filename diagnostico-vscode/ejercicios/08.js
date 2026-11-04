// GALILEO · MISIÓN 8: Activar al robot especialista
// Modificá solamente los bloques marcados.

class Robot {
  constructor(nombre) { this.nombre = nombre; }
  identificar() { return this.nombre; }
  trabajar() { return this.nombre + " trabaja"; }
}
// INICIO BLOQUE 1
// Declaración de la clase RobotReparador y su herencia
  // constructor(nombre, herramienta, especialidad)
  // trabajar()
  // cambiarHerramienta(nueva)

// FIN BLOQUE 1
const estado = document.querySelector("#estado");
const gali = new RobotReparador("Gali", "soldador", "paneles");
estado.textContent = gali.trabajar();
