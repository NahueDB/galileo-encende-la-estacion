// @ts-nocheck
// Self-contained: used in the isolated iframe and in behavioral tests.
export function diagnosticRunner(config, runtimeFactory, host = window) {
    const { document } = host;
    const { id, html, ast, level, testing } = config;
    const runtime = runtimeFactory(document);
    const container = document.getElementById('exercise');
    let runtimeError = '';
    function send(data) {
        host.parent.postMessage({ channel: 'galileo', id, ...data }, '*');
    }
    function text() {
        return ((document.getElementById('estado') || document.getElementById('mensaje'))?.textContent || '');
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
        if (runtimeError)
            throw new Error(runtimeError);
    }
    const checks = [];
    function check(label, action, detail) {
        try {
            const pass = !!action();
            checks.push({ label, pass, ...(pass ? {} : { detail }) });
        }
        catch (error) {
            checks.push({ label, pass: false, detail: detail + ' ' + error.message });
        }
    }
    try {
        container.innerHTML = html;
        runtime.execute(ast);
        if (!testing) {
            send({ kind: 'snapshot', snapshot: snapshot() });
            container.addEventListener('click', () => send({ kind: 'snapshot', snapshot: snapshot() }));
            new host.MutationObserver(() => send({ kind: 'snapshot', snapshot: snapshot() })).observe(container, { subtree: true, childList: true, characterData: true });
            send({ kind: 'ready' });
            return;
        }
        if (level === 1) {
            check('Espera antes del clic', () => text() === 'Estación en espera', '¿En qué momento debería cambiar el panel: al cargar o al presionar el botón?');
            check('Enciende el panel', () => {
                click('activar');
                return text() === 'Panel encendido';
            }, '¿El elemento que encontraste es el párrafo indicado? ¿Qué debería mostrar después del clic?');
            check('Puede repetir la acción', () => {
                document.getElementById('estado').textContent = 'Estación en espera';
                click('activar');
                return text() === 'Panel encendido';
            }, 'Si el panel vuelve al estado inicial, ¿qué debería hacer un nuevo clic?');
        }
        if (level === 2) {
            check('Conserva el mensaje inicial', () => text() === 'No hay una persona registrada', '¿Qué debería mostrarse antes de que alguien presione Registrar?');
            for (const name of ['Ana', 'Bruno'])
                check('Registra a ' + name, () => {
                    document.getElementById('nombre').value = name;
                    click('registrar');
                    return text() === 'Estación asignada a ' + name;
                }, '¿En qué momento se está leyendo el nombre? ¿Qué pasa si lo cambian antes del segundo clic?');
        }
        if (level === 3) {
            for (const [values, min, expected, label] of [
                [[20, 80, 50, 10], 50, 2, 'Incluye el umbral'],
                [[0, 5, 5, 9], 5, 3, 'Cuenta otra lista'],
                [[], 30, 0, 'Lista vacía'],
                [[1, 2], 8, 0, 'Ninguna suficiente'],
                [[0, 20], 0, 2, 'Umbral cero'],
            ])
                check(label, () => {
                    const copy = values.slice();
                    return (runtime.call('contarBaterias', [copy, min]) === expected &&
                        copy.length === values.length &&
                        copy.every((v, i) => v === values[i]));
                }, '¿Estás contando las cargas que cumplen la condición, incluyendo el límite? ¿La lista original sigue igual?');
        }
        if (level === 4)
            for (const [p, h] of [
                [40, 3],
                [12, 5],
                [0, 3],
                [40, 0],
                [2.5, 1.2],
            ])
                check('Consumo ' + p + ' × ' + h, () => runtime.call('calcularConsumo', [p, h]) === p * h, '¿Qué valor recibe quien llama a la función? ¿La relación que usaste funciona con estos dos datos?');
        if (level === 5) {
            check('Guarda y presenta dos robots', () => {
                for (const [name, energy] of [
                    ['Gali', 80],
                    ['Luna', 25],
                ]) {
                    const obj = runtime.construct('Robot', [name, energy]);
                    if (runtime.get(obj, 'nombre') !== name ||
                        runtime.get(obj, 'energia') !== energy ||
                        runtime.method(obj, 'presentarse', []) !==
                            'Soy ' + name + ' y tengo ' + energy + ' de energía')
                        return false;
                }
                return true;
            }, '¿Qué datos conserva cada robot y de dónde los obtiene al presentarse?');
            check('Mantiene instancias independientes', () => {
                const a = runtime.construct('Robot', ['A', 10]), b = runtime.construct('Robot', ['B', 90]);
                runtime.set(a, 'energia', 5);
                return (runtime.get(b, 'energia') === 90 &&
                    runtime.method(a, 'presentarse', []) === 'Soy A y tengo 5 de energía');
            }, '¿Por qué cambiar la energía de un robot debería afectar, o no, al otro?');
        }
        if (level === 6) {
            check('Lee un atributo privado', () => {
                const b = runtime.construct('Bateria', [65]);
                return runtime.privateField(b, 'energia') && runtime.get(b, 'energia') === 65;
            }, '¿Qué dato tiene que entregar el getter y dónde se conserva ese dato?');
            check('Acepta los límites 0 y 100', () => {
                const b = runtime.construct('Bateria', [50]);
                runtime.set(b, 'energia', 0);
                if (runtime.get(b, 'energia') !== 0)
                    return false;
                runtime.set(b, 'energia', 100);
                return runtime.get(b, 'energia') === 100;
            }, '¿Las cargas de los dos extremos pertenecen al rango permitido?');
            check('Rechaza valores fuera del rango', () => {
                const b = runtime.construct('Bateria', [45]);
                for (const n of [-1, 101, -100, 500]) {
                    runtime.set(b, 'energia', n);
                    if (runtime.get(b, 'energia') !== 45)
                        return false;
                }
                return true;
            }, '¿Qué carga debería permanecer cuando se rechaza un valor nuevo?');
            check('Protege cada batería por separado', () => {
                const a = runtime.construct('Bateria', [20]), b = runtime.construct('Bateria', [80]);
                runtime.set(a, 'energia', 30);
                return runtime.get(a, 'energia') === 30 && runtime.get(b, 'energia') === 80;
            }, '¿A qué batería pertenece el dato que están leyendo o modificando?');
        }
        if (level === 7) {
            check('Guarda el nombre y la batería recibida', () => {
                const b = runtime.construct('Bateria', [80]);
                const r = runtime.construct('Robot', ['Gali', b]);
                return runtime.get(r, 'nombre') === 'Gali' && runtime.get(r, 'bateria') === b;
            }, '¿Qué datos recibe el constructor y dónde debe conservarlos cada robot?');
            check('Consume y elige el mensaje según la energía', () => {
                const b = runtime.construct('Bateria', [30]);
                const r = runtime.construct('Robot', ['Luna', b]);
                return runtime.method(r, 'trabajar', [31]) === 'Luna no tiene energía suficiente' &&
                    runtime.get(b, 'energia') === 30 &&
                    runtime.method(r, 'trabajar', [10]) === 'Luna completó el trabajo' &&
                    runtime.method(r, 'energiaDisponible', []) === 20 && runtime.get(b, 'energia') === 20 &&
                    runtime.method(r, 'trabajar', [-1]) === 'Luna no tiene energía suficiente' &&
                    runtime.get(b, 'energia') === 20;
            }, '¿Qué devuelve la batería al intentar consumir y qué mensaje corresponde en cada caso?');
            check('Admite consumo exacto y cero', () => {
                const b = runtime.construct('Bateria', [15]);
                const r = runtime.construct('Robot', ['Sol', b]);
                return runtime.method(r, 'trabajar', [15]) === 'Sol completó el trabajo' &&
                    runtime.method(r, 'trabajar', [0]) === 'Sol completó el trabajo' &&
                    runtime.method(r, 'energiaDisponible', []) === 0;
            }, '¿Qué ocurre cuando el costo coincide con la carga o vale cero?');
            check('Recarga la batería y respeta sus límites', () => {
                const b = runtime.construct('Bateria', [70]);
                const r = runtime.construct('Robot', ['Gali', b]);
                return runtime.method(r, 'recargar', [20]) === true && runtime.get(b, 'energia') === 90 &&
                    runtime.method(r, 'recargar', [11]) === false && runtime.get(b, 'energia') === 90 &&
                    runtime.method(r, 'recargar', [-5]) === false && runtime.get(b, 'energia') === 90 &&
                    runtime.method(r, 'recargar', [0]) === false &&
                    runtime.method(r, 'recargar', [10]) === true &&
                    runtime.method(r, 'energiaDisponible', []) === 100;
            }, '¿Qué objeto ya decide si una recarga es válida? ¿Qué respuesta debe devolver el robot?');
            check('Consulta el componente y conserva baterías independientes', () => {
                const a = runtime.construct('Bateria', [25]);
                const b = runtime.construct('Bateria', [90]);
                const r = runtime.construct('Robot', ['Gali', a]);
                const other = runtime.construct('Robot', ['Luna', b]);
                runtime.method(r, 'trabajar', [5]);
                runtime.method(r, 'recargar', [10]);
                runtime.method(a, 'consumir', [3]);
                return runtime.method(r, 'energiaDisponible', []) === 27 &&
                    runtime.method(other, 'energiaDisponible', []) === 90;
            }, '¿A qué objeto consultan para conocer la carga actual? ¿Cada robot conserva su propio componente?');
        }
        if (level === 8) {
            check('Hereda de Robot', () => runtime.inherits('RobotReparador', 'Robot'), '¿Cómo expresa la declaración de la clase que el reparador es un tipo de robot?');
            check('Inicializa y especializa dos robots', () => {
                for (const [name, tool, specialty] of [['Gali', 'soldador', 'paneles'], ['Luna', 'pinza', 'motores']]) {
                    const r = runtime.construct('RobotReparador', [name, tool, specialty]);
                    if (runtime.get(r, 'nombre') !== name || runtime.get(r, 'herramienta') !== tool ||
                        runtime.get(r, 'especialidad') !== specialty || runtime.method(r, 'identificar', []) !== name ||
                        runtime.method(r, 'trabajar', []) !== name + ' repara ' + specialty + ' con ' + tool)
                        return false;
                }
                return true;
            }, '¿Qué inicializa la clase base y qué dos datos propios necesita guardar el reparador?');
            check('Actualiza la herramienta y conserva la anterior ante texto vacío', () => {
                const a = runtime.construct('RobotReparador', ['Gali', 'soldador', 'paneles']);
                const b = runtime.construct('RobotReparador', ['Luna', 'pinza', 'motores']);
                runtime.method(a, 'cambiarHerramienta', ['']);
                if (runtime.get(a, 'herramienta') !== 'soldador')
                    return false;
                runtime.method(a, 'cambiarHerramienta', ['destornillador']);
                runtime.method(a, 'cambiarHerramienta', ['']);
                return runtime.get(a, 'herramienta') === 'destornillador' &&
                    runtime.method(a, 'trabajar', []) === 'Gali repara paneles con destornillador' &&
                    runtime.get(b, 'herramienta') === 'pinza';
            }, '¿Cuándo corresponde cambiar la herramienta? ¿El próximo trabajo usa el dato actualizado?');
            check('Conserva el comportamiento de la clase base', () => {
                const r = runtime.construct('Robot', ['Base']);
                return runtime.method(r, 'trabajar', []) === 'Base trabaja' && runtime.method(r, 'identificar', []) === 'Base';
            }, '¿Qué comportamiento corresponde a todos los robots y cuál solamente a los reparadores?');
        }
        send({
            kind: 'result',
            result: { pass: checks.length > 0 && checks.every((c) => c.pass), checks },
        });
    }
    catch (error) {
        send({
            kind: testing ? 'result' : 'error',
            error: error.message,
            result: { pass: false, checks, error: error.message },
        });
    }
}
