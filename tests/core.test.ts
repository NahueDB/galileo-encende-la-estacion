import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parseCode } from '../lib/parser';
import { createRuntime } from '../lib/runtime';
import { levels, assemble } from '../lib/levels';
import { solutions } from './solutions';
import { consolidate } from '../lib/consolidate';
import { sign, verify } from '../lib/auth';
import { eventSchema, sessionSchema } from '../lib/validation';
function exercise(index: number, zones = solutions[index]) {
  const dom = new JSDOM(levels[index].html);
  const doc = dom.window.document;
  const runtime = createRuntime(doc);
  runtime.execute(parseCode(assemble(levels[index], zones), levels[index]));
  return { dom, doc, runtime };
}
const text = (doc: Document, id = 'estado') => doc.getElementById(id)?.textContent;
const click = (doc: Document, id: string) => (doc.getElementById(id) as HTMLButtonElement).click();
const input = (doc: Document, name: string) => {
  (doc.getElementById('nombre') as HTMLInputElement).value = name;
};
test('Los seis niveles aceptan las soluciones y cambian DOM real', () => {
  assert.equal(exercise(0).runtime.selected(), true);
  assert.equal(text(exercise(1).doc), 'El taller está disponible para trabajar');
  const third = exercise(2);
  assert.equal(text(third.doc), 'Estación en espera');
  click(third.doc, 'activar');
  assert.equal(text(third.doc), 'Estación en funcionamiento');
  const fourth = exercise(3);
  for (const id of ['activar', 'detener', 'activar', 'detener']) {
    click(fourth.doc, id);
    assert.equal(
      text(fourth.doc),
      id === 'activar' ? 'Estación en funcionamiento' : 'Estación detenida',
    );
  }
  const fifth = exercise(4);
  for (const name of ['Ana', 'Bruno']) {
    input(fifth.doc, name);
    click(fifth.doc, 'registrar');
    assert.equal(text(fifth.doc, 'mensaje'), 'Estación asignada a ' + name);
  }
  const sixth = exercise(5);
  for (const name of ['', '   ', 'Ana', '  Bruno  ', 'Celeste']) {
    input(sixth.doc, name);
    click(sixth.doc, 'registrar');
    assert.equal(
      text(sixth.doc, 'mensaje'),
      name.trim()
        ? 'Estación asignada a ' + name.trim()
        : 'Ingresá el nombre de la persona responsable',
    );
  }
  click(sixth.doc, 'limpiar');
  assert.equal(text(sixth.doc, 'mensaje'), 'No hay una persona registrada');
  assert.equal((sixth.doc.getElementById('nombre') as HTMLInputElement).value, '');
});
test('Distingue null y otro elemento; acepta formato equivalente', () => {
  assert.equal(exercise(0, ['"#titulo"']).runtime.selected(), false);
  assert.equal(exercise(0, ['"#inexistente"']).runtime.selected(), false);
  assert.equal(exercise(0, ["  '#estacion'  "]).runtime.selected(), true);
  const alternate = exercise(4, [
    'const actual = campo.value; mensaje.textContent = `Estación asignada a ${actual}`;',
  ]);
  input(alternate.doc, 'Sol');
  click(alternate.doc, 'registrar');
  assert.equal(text(alternate.doc, 'mensaje'), 'Estación asignada a Sol');
});
test('Rechaza escapes, bucles, red, navegación, getters y sintaxis no admitida', () => {
  for (const code of [
    'while(true){}',
    'for(;;){}',
    'fetch("https://example.com")',
    'window.location="/"',
    'document.constructor.constructor("return window")()',
    'const a = {get x(){return 1}}',
    'document["querySelector"]("#estado")',
    'import x from "x"',
    'new Function("a")',
  ]) {
    assert.throws(() => {
      const ast = parseCode(code);
      const { doc } = exercise(1);
      createRuntime(doc).execute(ast);
    });
  }
});
test('Interrumpe recursión y escrituras fuera de capacidades', () => {
  assert.throws(() => {
    const { doc } = exercise(1);
    createRuntime(doc).execute(parseCode('function f(){f();} f();'));
  }, /llamadas|operaciones/);
  assert.throws(() => parseCode('document.querySelector("#estado").innerHTML="a"'));
  assert.throws(() => parseCode('const a=1;', levels[1]));
});
test('Una función invocada inmediatamente cambia antes del clic', () => {
  const dom = new JSDOM(levels[2].html);
  const r = createRuntime(dom.window.document);
  assert.throws(
    () =>
      r.execute(parseCode(assemble(levels[2], ['boton.addEventListener("click", encender());']))),
    /sin invocarla/,
  );
  assert.equal(text(dom.window.document), 'Estación en funcionamiento');
});
test('Reiniciar crea un documento sin listeners anteriores', () => {
  const old = exercise(2);
  const fresh = { doc: new JSDOM(levels[2].html).window.document };
  click(old.doc, 'activar');
  assert.equal(text(fresh.doc), 'Estación en espera');
});
test('Consolidación deduplica reenvíos por ID y mantiene cinco partidas', () => {
  const games = Array.from({ length: 5 }, (_, i) => [
    'g' + i,
    'GALILEO7',
    '1.0.0',
    '01',
    '02',
    '7A',
    '2026-10-26T19:00:00.000Z',
    'pareja',
  ]);
  const ev = games.flatMap((p) =>
    Array.from({ length: 6 }, (_, i) => [
      'e' + p[0] + i,
      p[0],
      String(i + 1),
      '1.0.0',
      'complete',
      '2026-10-26T19:00:00.000Z',
      '1',
      '',
      '',
      '',
    ]),
  );
  const run = ['run1', 'g0', '1', '1.0.0', 'run', '2026-10-26T19:01:00.000Z', '1', '', '', ''];
  const finish = [
    'finish1',
    'g0',
    '6',
    '1.0.0',
    'finish',
    '2026-10-26T19:02:00.000Z',
    '1',
    '',
    '',
    '',
  ];
  const result = consolidate(games, [...ev, run, run, finish]);
  assert.equal(result.length, 5);
  assert.equal(result[0].attempts, 1);
  assert.equal(result[0].completed.length, 6);
  assert.equal(result[0].finished, true);
  assert.equal(result[1].finished, false);
});
test('Sesiones firmadas rechazan manipulación y roles incorrectos', () => {
  process.env.SESSION_SIGNING_SECRET = 'test-secret-minimum-32-characters-long';
  const token = sign({ role: 'teacher' });
  assert.equal(verify(token, 'teacher')?.role, 'teacher');
  assert.equal(verify(token, 'pair'), null);
  assert.equal(verify(token + 'x', 'teacher'), null);
  assert.equal(verify(sign({ role: 'teacher' }, -1), 'teacher'), null);
});
test('Validación conserva ceros iniciales y rechaza pareja repetida', () => {
  assert.deepEqual(sessionSchema.parse({ activity: 'A', pair: ['001', '002'] }).pair, [
    '001',
    '002',
  ]);
  assert.throws(() => sessionSchema.parse({ activity: 'A', pair: ['001', '001'] }));
  assert.equal(eventSchema.safeParse({}).success, false);
});
