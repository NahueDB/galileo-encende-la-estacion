import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { diagnosticLevels } from '../lib/diagnostic-levels';
import { diagnosticSolutions } from './diagnostic-solutions';
import { assemble } from '../lib/levels';
import { diagnosticDraft } from '../lib/diagnostic-draft';
import { parseCode } from '../lib/parser';
import { createDiagnosticRuntime } from '../lib/diagnostic-runtime';
import { diagnosticRunner } from '../lib/diagnostic-runner';
import { diagnosticProfile } from '../lib/diagnostic-profile';
import { DIAGNOSTIC_VERSION, type RunResult, type GameEvent } from '../lib/types';
import { consolidate } from '../lib/consolidate';
import { eventSchema } from '../lib/validation';
import {
  createGame,
  loadGame,
  storeGame,
  addEvent,
  STORAGE,
  DIAGNOSTIC_STORAGE,
} from '../lib/local';

function exercise(index: number, zones = diagnosticSolutions[index]): RunResult {
  const dom = new JSDOM('<div id="exercise"></div>');
  const level = diagnosticLevels[index];
  const ast = parseCode(assemble(level, zones), level);
  let result: RunResult | undefined;
  const host = {
    document: dom.window.document,
    parent: {
      postMessage: (data: { result?: RunResult }) => {
        if (data.result) result = data.result;
      },
    },
  };
  diagnosticRunner(
    { id: 'test', html: level.html, ast, level: level.id, testing: true },
    createDiagnosticRuntime,
    host,
  );
  dom.window.close();
  assert.ok(result, 'El runner debe responder');
  return result;
}
test('Las ocho misiones aceptan las soluciones y prueban comportamiento real', () => {
  for (let i = 0; i < 8; i++) {
    const result = exercise(i);
    assert.equal(result.pass, true, JSON.stringify({ mission: i + 1, result }));
    assert.ok(result.checks.length >= 2);
  }
});
test('Acepta otros nombres de variables, while y for...of', () => {
  assert.equal(
    exercise(2, [
      'let cantidad=0; for(const carga of cargas) { if(carga >= minimo) cantidad += 1; } return cantidad;',
    ]).pass,
    true,
  );
  assert.equal(
    exercise(2, [
      'let i=0; let suma=0; while(i<cargas.length) { if(cargas[i]>=minimo) { suma=suma+1; } i=i+1; } return suma;',
    ]).pass,
    true,
  );
});
test('Detecta errores de umbral, retorno, estado, encapsulamiento, composición y herencia', () => {
  const wrong: [number, string[]][] = [
    [2, ['return 2;']],
    [2, ['let total=0; for(const carga of cargas) { if(carga>minimo) total++; } return total;']],
    [3, ['console.log(potencia * horas);']],
    [4, [diagnosticSolutions[4][0], 'return "Soy Gali y tengo 80 de energía";']],
    [5, ['return this.#energia;', 'this.#energia = valor;']],
    [
      5,
      [
        'return this.#energia;',
        'if(valor>=0 && valor<=100) this.#energia=valor; else this.#energia=0;',
      ],
    ],
    [
      6,
      [diagnosticSolutions[6][0].replace('return this.bateria.cargar(cantidad);', 'return true;')],
    ],
    [
      7,
      [
        diagnosticSolutions[7][0].replace(
          'super(nombre); this.herramienta = herramienta;',
          'this.herramienta = herramienta; super(nombre);',
        ),
      ],
    ],
    [7, [diagnosticSolutions[7][0].replace('if (nueva !== "")', 'if (true)')]],
  ];
  for (const [i, zones] of wrong) assert.equal(exercise(i, zones).pass, false, 'Misión ' + (i + 1));
});
test('Preserva comprobaciones parciales y corta ciclos/recursión', () => {
  const partial = exercise(2, [
    'let total=0; for(const n of cargas) {if(n>minimo) total++;} return total;',
  ]);
  assert.ok(partial.checks.some((check) => check.pass));
  assert.ok(partial.checks.some((check) => !check.pass));
  const dom = new JSDOM('');
  for (const code of ['while(true){}', 'function f(){return f();} f();', 'for(;;){}']) {
    assert.throws(
      () =>
        createDiagnosticRuntime(dom.window.document).execute(parseCode(code, diagnosticLevels[2])),
      /operaciones|llamadas/,
    );
  }
  dom.window.close();
});
test('No permite red, objetos nativos, prototipos ni escapes por índices calculados', () => {
  const dom = new JSDOM('<p id="estado"></p>');
  const runtime = createDiagnosticRuntime(dom.window.document);
  for (const code of [
    'fetch("https://example.invalid")',
    'window.location="/"',
    'document.constructor',
    'document["con"+"structor"]',
    'const a=[]; a["__proto__"]',
    'new Function("return window")',
    'class A {} const a=new A(); a["constructor"]',
    'document.querySelector("#estado").innerHTML="x"',
    'const a={get x(){return 1;}}',
    'class A { #x=1; } const a=new A(); a.x = 2; a.#x;',
    'import x from "x"',
  ])
    assert.throws(() => runtime.execute(parseCode(code, diagnosticLevels[2])), code);
  dom.window.close();
});
test('El acceso privado conserva el dueño de clase y super inicializa al padre', () => {
  const dom = new JSDOM('');
  const r = createDiagnosticRuntime(dom.window.document);
  r.execute(
    parseCode(
      'class A { #x=1; leer(){ return this.#x; } } class B extends A { #x=2; propia(){ return this.#x; } }',
      diagnosticLevels[7],
    ),
  );
  const b = r.construct('B', []);
  assert.equal(r.method(b, 'leer', []), 1);
  assert.equal(r.method(b, 'propia', []), 2);
  dom.window.close();
});
test('Guarda ambas actividades por separado y conserva la versión en cada evento', () => {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  try {
    const legacy = createGame(['A', 'B'], 'demo');
    const diagnostic = createGame(['C', 'D'], 'demo', undefined, DIAGNOSTIC_VERSION);
    diagnostic.level = 8;
    storeGame(legacy);
    storeGame(diagnostic);
    assert.equal(loadGame()?.id, legacy.id);
    assert.equal(loadGame(DIAGNOSTIC_VERSION)?.level, 8);
    assert.ok(values.has(STORAGE));
    assert.ok(values.has(DIAGNOSTIC_STORAGE));
    assert.equal(addEvent(diagnostic, 'run').events[0].version, DIAGNOSTIC_VERSION);
  } finally {
    if (old) Object.defineProperty(globalThis, 'localStorage', old);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
test('El perfil usa las pistas previas al logro y conserva primer/último intento', () => {
  let g = createGame(['A', 'B'], 'demo', undefined, DIAGNOSTIC_VERSION);
  g = addEvent(g, 'run', { result: { pass: false, checks: [] } });
  g = addEvent(g, 'hint', { hint: 1 });
  g = addEvent(g, 'run', { result: { pass: true, checks: [] } });
  g = addEvent(g, 'run', { result: { pass: false, checks: [] } });
  const profile = diagnosticProfile(g.events);
  assert.equal(profile[0].status, 'Resuelta con pistas');
  assert.equal(profile[0].attempts, 3);
  assert.equal(profile[0].first?.pass, false);
  assert.equal(profile[0].latest?.pass, false);
  assert.equal(profile[1].status, 'Sin intento');
  const events = g.events.filter((e) => e.type !== 'hint');
  events.push({ ...g.events[1], id: 'later-hint' });
  assert.equal(diagnosticProfile(events)[0].status, 'Resuelta sin pistas registradas');
});
test('Acepta misión 8 solo en diagnóstico y consolida cierre con pendientes sin mezclar versiones', () => {
  const g = createGame(['A', 'B'], 'demo', undefined, DIAGNOSTIC_VERSION);
  const event = addEvent(g, 'run', { level: 8, result: { pass: false, checks: [] } }).events[0];
  assert.equal(eventSchema.safeParse(event).success, true);
  assert.equal(eventSchema.safeParse({ ...event, version: '1.0.0' }).success, false);
  const row = (event: GameEvent) => [
    event.id,
    event.gameId,
    String(event.level),
    event.version,
    event.type,
    event.at,
    String(event.attempt),
    '',
    event.result ? JSON.stringify(event.result) : '',
    '',
  ];
  const finish = { ...event, id: 'finish', type: 'finish' as const };
  const games = consolidate(
    [[g.id, 'A', DIAGNOSTIC_VERSION, 'A', 'B', '7A', g.started, 'pareja']],
    [row(event), row(finish), row({ ...event, id: 'wrong', version: '1.0.0', type: 'complete' })],
  );
  assert.equal(games[0].total, 8);
  assert.equal(games[0].finished, true);
  assert.equal(games[0].completed.length, 0);
  assert.equal(games[0].profile?.[7].status, 'En revisión');
});

test('Los borradores anteriores de 7 y 8 conservan su código al cambiar las consignas', () => {
  const seven = diagnosticDraft(diagnosticLevels[6], ['return this.bateria.consumir(costo);', 'return this.bateria.energia;']);
  assert.match(seven, /constructor\(bateria\)/);
  assert.match(seven, /return this.bateria.consumir\(costo\);/);
  const eight = diagnosticDraft(diagnosticLevels[7], ['super(nombre); this.herramienta = herramienta;', 'return this.nombre + " repara con " + this.herramienta;']);
  assert.match(eight, /constructor\(nombre, herramienta\)/);
  assert.match(eight, /super\(nombre\);/);
  for (const level of diagnosticLevels.slice(6)) {
    assert.equal(diagnosticDraft(level, diagnosticSolutions[level.id - 1]), assemble(level, diagnosticSolutions[level.id - 1]));
  }
});
