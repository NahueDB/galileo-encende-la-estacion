// GALILEO · MISIÓN 5: Crear los robots
// Modificá solamente los bloques marcados.

class Robot {
  constructor(nombre, energia) {
// INICIO BLOQUE 1
    // Guardá ambos datos en esta instancia
// FIN BLOQUE 1
  }
  presentarse() {
// INICIO BLOQUE 2
    // Devolvé la presentación de este robot
// FIN BLOQUE 2
  }
}
const estado = document.querySelector("#estado");
const gali = new Robot("Gali", 80);
estado.textContent = gali.presentarse();
