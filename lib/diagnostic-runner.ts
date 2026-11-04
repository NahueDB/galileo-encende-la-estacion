// @ts-nocheck
// Self-contained: used in the isolated iframe and in behavioral tests.
export function diagnosticRunner(config, runtimeFactory, host: any = window) {
  const { document } = host;
  const { id, html, ast, level, testing } = config;
  const runtime = runtimeFactory(document);
  const container = document.getElementById('exercise');
  let runtimeError = '';
  function send(data) {
    host.parent.postMessage({ channel: 'galileo', id, ...data }, '*');
  }
  function text() {
    return (
      (document.getElementById('estado') || document.getElementById('mensaje'))?.textContent || ''
    );
  }
  function snapshot() {
    const value = text();
    return {
      text: value,
      value: document.getElementById('nombre')?.value || '',
      selected: false,
      running: value === 'Panel encendido' || value.startsWith('Estación asignada a '),
    };
  }
  document.addEventListener('runner-error', (event) => {
    runtimeError = event.detail;
    send({ kind: 'error', error: runtimeError });
  });
  function click(button) {
    document.getElementById(button).click();
    if (runtimeError) throw new Error(runtimeError);
  }
  const checks = [];
  function check(label, action, detail) {
    try {
      const pass = !!action();
      checks.push({ label, pass, ...(pass ? {} : { detail }) });
    } catch (error) {
      checks.push({ label, pass: false, detail: detail + ' ' + error.message });
    }
  }
  try {
    container.innerHTML = html;
    runtime.execute(ast);
    if (!testing) {
      send({ kind: 'snapshot', snapshot: snapshot() });
      container.addEventListener('click', () => send({ kind: 'snapshot', snapshot: snapshot() }));
      new host.MutationObserver(() => send({ kind: 'snapshot', snapshot: snapshot() })).observe(
        container,
        { subtree: true, childList: true, characterData: true },
      );
      send({ kind: 'ready' });
      return;
    }
    if (level === 1) {
      check(
        'Espera antes del clic',
        () => text() === 'Estación en espera',
        'El panel debe esperar al clic.',
      );
      check(
        'Enciende el panel',
        () => {
          click('activar');
          return text() === 'Panel encendido';
        },
        'Buscá #estado y asigná el texto solicitado.',
      );
      check(
        'Puede repetir la acción',
        () => {
          document.getElementById('estado').textContent = 'Estación en espera';
          click('activar');
          return text() === 'Panel encendido';
        },
        'La función debe actualizar el panel en cada clic.',
      );
    }
    if (level === 2) {
      check(
        'Conserva el mensaje inicial',
        () => text() === 'No hay una persona registrada',
        'Leé y mostrale el nombre cuando se presiona Registrar.',
      );
      for (const name of ['Ana', 'Bruno'])
        check(
          'Registra a ' + name,
          () => {
            document.getElementById('nombre').value = name;
            click('registrar');
            return text() === 'Estación asignada a ' + name;
          },
          'Leé campo.value dentro de registrar para usar el nombre actual.',
        );
    }
    if (level === 3) {
      for (const [values, min, expected, label] of [
        [[20, 80, 50, 10], 50, 2, 'Incluye el umbral'],
        [[0, 5, 5, 9], 5, 3, 'Cuenta otra lista'],
        [[], 30, 0, 'Lista vacía'],
        [[1, 2], 8, 0, 'Ninguna suficiente'],
        [[0, 20], 0, 2, 'Umbral cero'],
      ])
        check(
          label,
          () => {
            const copy = values.slice();
            return (
              runtime.call('contarBaterias', [copy, min]) === expected &&
              copy.length === values.length &&
              copy.every((v, i) => v === values[i])
            );
          },
          'Contá las cargas >= minimo y devolvé el total sin modificar la lista.',
        );
    }
    if (level === 4)
      for (const [p, h] of [
        [40, 3],
        [12, 5],
        [0, 3],
        [40, 0],
        [2.5, 1.2],
      ])
        check(
          'Consumo ' + p + ' × ' + h,
          () => runtime.call('calcularConsumo', [p, h]) === p * h,
          'Devolvé el producto numérico usando los dos parámetros.',
        );
    if (level === 5) {
      check(
        'Guarda y presenta dos robots',
        () => {
          for (const [name, energy] of [
            ['Gali', 80],
            ['Luna', 25],
          ]) {
            const obj = runtime.construct('Robot', [name, energy]);
            if (
              runtime.get(obj, 'nombre') !== name ||
              runtime.get(obj, 'energia') !== energy ||
              runtime.method(obj, 'presentarse', []) !==
                'Soy ' + name + ' y tengo ' + energy + ' de energía'
            )
              return false;
          }
          return true;
        },
        'Guardá los parámetros con this y usá esos atributos en presentarse.',
      );
      check(
        'Mantiene instancias independientes',
        () => {
          const a = runtime.construct('Robot', ['A', 10]),
            b = runtime.construct('Robot', ['B', 90]);
          runtime.set(a, 'energia', 5);
          return (
            runtime.get(b, 'energia') === 90 &&
            runtime.method(a, 'presentarse', []) === 'Soy A y tengo 5 de energía'
          );
        },
        'Cada robot debe consultar su propio estado actual.',
      );
    }
    if (level === 6) {
      check(
        'Lee un atributo privado',
        () => {
          const b = runtime.construct('Bateria', [65]);
          return runtime.privateField(b, 'energia') && runtime.get(b, 'energia') === 65;
        },
        'El getter devuelve this.#energia.',
      );
      check(
        'Acepta los límites 0 y 100',
        () => {
          const b = runtime.construct('Bateria', [50]);
          runtime.set(b, 'energia', 0);
          if (runtime.get(b, 'energia') !== 0) return false;
          runtime.set(b, 'energia', 100);
          return runtime.get(b, 'energia') === 100;
        },
        'Incluí ambos extremos del rango.',
      );
      check(
        'Rechaza valores fuera del rango',
        () => {
          const b = runtime.construct('Bateria', [45]);
          for (const n of [-1, 101, -100, 500]) {
            runtime.set(b, 'energia', n);
            if (runtime.get(b, 'energia') !== 45) return false;
          }
          return true;
        },
        'Una carga inválida debe conservar la energía anterior.',
      );
      check(
        'Protege cada batería por separado',
        () => {
          const a = runtime.construct('Bateria', [20]),
            b = runtime.construct('Bateria', [80]);
          runtime.set(a, 'energia', 30);
          return runtime.get(a, 'energia') === 30 && runtime.get(b, 'energia') === 80;
        },
        'Usá el atributo privado de cada instancia.',
      );
    }
    if (level === 7) {
      check(
        'Usa la batería recibida',
        () => {
          const b = runtime.construct('Bateria', [80]),
            r = runtime.construct('Robot', [b]);
          return (
            runtime.method(r, 'trabajar', [30]) === true &&
            runtime.get(b, 'energia') === 50 &&
            runtime.method(r, 'energiaDisponible', []) === 50
          );
        },
        'Delegá el consumo en this.bateria y devolvé su respuesta.',
      );
      check(
        'Conserva energía si no alcanza',
        () => {
          const b = runtime.construct('Bateria', [10]),
            r = runtime.construct('Robot', [b]);
          return runtime.method(r, 'trabajar', [11]) === false && runtime.get(b, 'energia') === 10;
        },
        'La batería debe rechazar el consumo sin alterar su carga.',
      );
      check(
        'Admite consumo exacto y cero',
        () => {
          const b = runtime.construct('Bateria', [15]),
            r = runtime.construct('Robot', [b]);
          return (
            runtime.method(r, 'trabajar', [15]) === true &&
            runtime.method(r, 'trabajar', [0]) === true &&
            runtime.method(r, 'energiaDisponible', []) === 0
          );
        },
        'Consultá siempre la energía actual del componente.',
      );
      check(
        'Mantiene componentes independientes',
        () => {
          const a = runtime.construct('Bateria', [25]),
            b = runtime.construct('Bateria', [90]),
            r = runtime.construct('Robot', [a]),
            other = runtime.construct('Robot', [b]);
          runtime.method(r, 'trabajar', [5]);
          return (
            runtime.method(r, 'energiaDisponible', []) === 20 &&
            runtime.method(other, 'energiaDisponible', []) === 90
          );
        },
        'Cada robot usa su batería, sin una carga compartida.',
      );
    }
    if (level === 8) {
      check(
        'Hereda de Robot',
        () => runtime.inherits('RobotReparador', 'Robot'),
        'Conservá la relación de herencia preparada.',
      );
      check(
        'Inicializa y especializa dos robots',
        () => {
          for (const [name, tool] of [
            ['Gali', 'soldador'],
            ['Luna', 'pinza'],
          ]) {
            const r = runtime.construct('RobotReparador', [name, tool]);
            if (
              runtime.get(r, 'nombre') !== name ||
              runtime.get(r, 'herramienta') !== tool ||
              runtime.method(r, 'identificar', []) !== name ||
              runtime.method(r, 'trabajar', []) !== name + ' repara con ' + tool
            )
              return false;
          }
          return true;
        },
        'Llamá super(nombre), guardá herramienta y sobrescribí trabajar usando los atributos.',
      );
      check(
        'Conserva el comportamiento de la clase base',
        () => {
          const r = runtime.construct('Robot', ['Base']);
          return runtime.method(r, 'trabajar', []) === 'Base trabaja';
        },
        'El comportamiento especializado pertenece a RobotReparador.',
      );
    }
    send({
      kind: 'result',
      result: { pass: checks.length > 0 && checks.every((c) => c.pass), checks },
    });
  } catch (error) {
    send({
      kind: testing ? 'result' : 'error',
      error: error.message,
      result: { pass: false, checks, error: error.message },
    });
  }
}
