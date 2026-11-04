import type { Level } from '@/lib/types';

const instructions: Record<number, { steps: string[]; expected: string }> = {
  1: {
    steps: [
      'Completá `encenderPanel()`: buscá el párrafo con id `estado`.',
      'Cambiá su texto cuando se haga clic. El evento del botón ya está preparado.',
    ],
    expected: 'Panel encendido',
  },
  2: {
    steps: [
      'Completá `registrar()`: leé el valor actual de `campo` y actualizá `mensaje`.',
      'El evento ya está preparado. Cada clic debe usar el nombre escrito en ese momento.',
    ],
    expected: 'Estación asignada a [nombre]',
  },
  3: {
    steps: [
      'Completá `contarBaterias(cargas, minimo)`.',
      'Contá las cargas mayores o iguales a `minimo`, sin modificar la lista. Podés usar `for`, `while` o `for...of`.',
    ],
    expected: 'Devolvé la cantidad. Si la lista está vacía, devolvé 0.',
  },
  4: {
    steps: [
      'Completá `calcularConsumo(potencia, horas)` multiplicando los dos parámetros.',
      'La función recibe números no negativos. No imprimas el resultado ni modifiques el HTML desde su cuerpo.',
    ],
    expected: 'Devolvé el consumo como un número.',
  },
  5: {
    steps: [
      'Completá `constructor(nombre, energia)`: cada `Robot` debe guardar su propio nombre y energía.',
      'Completá `presentarse()` usando los datos de ese robot. Vamos a probar dos robots con datos diferentes.',
    ],
    expected: 'Soy [nombre] y tengo [energia] de energía',
  },
  6: {
    steps: [
      'Completá `get energia` para consultar la carga privada `#energia`.',
      'Completá `set energia(valor)`: aceptá valores entre 0 y 100 inclusive. Si están fuera del rango, conservá la carga anterior. El constructor ya está preparado.',
    ],
    expected: 'La carga solo cambia cuando el nuevo valor está dentro del rango.',
  },
  7: {
    steps: [
      'El `Robot` recibe una `Bateria` ya creada. Completá `trabajar(costo)` delegando en `consumir(costo)` y devolviendo su resultado booleano.',
      'Completá `energiaDisponible()` para consultar la energía de esa batería. No crees una carga paralela: la batería ya decide si alcanza.',
    ],
    expected: 'El robot trabaja y consulta su energía a través de la batería recibida.',
  },
  8: {
    steps: [
      '`RobotReparador` ya extiende `Robot`. Completá su constructor: inicializá la parte heredada con `super` y guardá `herramienta`.',
      'Sobrescribí `trabajar()`. Conservá `identificar()`, que se hereda de `Robot` y devuelve el nombre.',
    ],
    expected: '[nombre] repara con [herramienta]',
  },
};
function formatted(text: string) {
  return text
    .split(/(`[^`]+`)/g)
    .map((part, i) => (part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part));
}
export default function DiagnosticObjective({ level }: { level: Level }) {
  const instruction = instructions[level.id];
  return (
    <div className="diagnostic-objective-copy">
      <ol>
        {instruction.steps.map((step, i) => (
          <li key={i}>{formatted(step)}</li>
        ))}
      </ol>
      <div className="diagnostic-expected">
        <span>Resultado esperado</span>
        <p>{instruction.expected}</p>
      </div>
    </div>
  );
}
