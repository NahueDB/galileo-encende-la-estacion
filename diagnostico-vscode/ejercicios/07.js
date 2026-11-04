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
  cargar(cantidad) {
    if (cantidad > 0 && this.#energia + cantidad <= 100) {
      this.#energia += cantidad;
      return true;
    }
    return false;
  }
}
// INICIO BLOQUE 1
class Robot {
  constructor(nombre, bateria) {
    // Guardá el nombre y la batería recibida
  }
  trabajar(costo) {
    // Pedile energía a la batería y devolvé el mensaje correspondiente
  }
  energiaDisponible() {
    // Consultá la energía del componente
  }
  recargar(cantidad) {
    // Delegá la recarga en la batería y devolvé su respuesta
  }
}
// FIN BLOQUE 1
const estado = document.querySelector("#estado");
const bateria = new Bateria(80);
const gali = new Robot("Gali", bateria);
estado.textContent = gali.trabajar(30) + ". Energía: " + gali.energiaDisponible();
