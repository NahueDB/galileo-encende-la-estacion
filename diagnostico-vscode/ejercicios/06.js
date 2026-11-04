// GALILEO · MISIÓN 6: Proteger la energía
// Modificá solamente los bloques marcados.

class Bateria {
  #energia = 0;
  constructor(energia) {
    this.energia = energia;
  }
  get energia() {
// INICIO BLOQUE 1
    // Devolvé el atributo privado
// FIN BLOQUE 1
  }
  set energia(valor) {
// INICIO BLOQUE 2
    // Validá el rango antes de cambiar el atributo privado
// FIN BLOQUE 2
  }
}
const estado = document.querySelector("#estado");
const bateria = new Bateria(70);
bateria.energia = 120;
estado.textContent = "Energía protegida: " + bateria.energia;
