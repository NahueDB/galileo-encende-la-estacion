// GALILEO · MISIÓN 7: Instalar una batería
// Modificá solamente los bloques marcados.

class Bateria {
  #energia;
  constructor(energia) { this.#energia = energia; }
  get energia() { return this.#energia; }
  consumir(costo) {
    if (costo >= 0 && costo <= this.#energia) {
      this.#energia -= costo;
      return true;
    }
    return false;
  }
}
class Robot {
  constructor(bateria) { this.bateria = bateria; }
  trabajar(costo) {
// INICIO BLOQUE 1
    // Pedile a la batería que consuma y devolvé su respuesta
// FIN BLOQUE 1
  }
  energiaDisponible() {// INICIO BLOQUE 2
    // Consultá la energía del componente
// FIN BLOQUE 2
  }
}
const estado = document.querySelector("#estado");
const bateria = new Bateria(80);
const gali = new Robot(bateria);
gali.trabajar(30);
estado.textContent = "Energía disponible: " + gali.energiaDisponible();
