import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  galiReducer as reduce,
  initialGali,
  entryMessage,
  resultMessage,
} from '../lib/gali-dialogue';
import { levels } from '../lib/levels';
import { createGali } from '../lib/scene/gali';
test('Gali prioriza evidencia, descarta resultados antiguos y deduplica sin consumir pistas', () => {
  const entry = entryMessage('a', levels[0], false);
  let s = reduce(initialGali, { type: 'station', scope: 'a', message: entry });
  s = reduce(s, { type: 'start', scope: 'a', id: 'actual' });
  const error = resultMessage(
    'actual:result',
    {
      pass: false,
      error: 'Error del intérprete',
      checks: [{ pass: false, label: 'fallo', detail: 'Detalle' }],
    },
    1,
    false,
  );
  assert.equal(error.text, 'Error del intérprete');
  assert.equal(
    resultMessage(
      'x',
      {
        pass: false,
        checks: [
          { pass: true, label: 'ok' },
          { pass: false, label: 'fallo', detail: 'Detalle real' },
        ],
      },
      1,
      false,
    ).text,
    'Detalle real',
  );
  assert.equal(reduce(s, { type: 'message', scope: 'a', run: 'viejo', message: error }), s);
  s = reduce(s, { type: 'message', scope: 'a', run: 'actual', message: error });
  assert.equal(reduce(s, { type: 'message', scope: 'a', message: entry }), s);
  assert.equal(reduce(s, { type: 'message', scope: 'a', run: 'actual', message: error }), s);
  s = reduce(s, { type: 'edit' });
  assert.equal(s.open, false);
  s = reduce(s, { type: 'reopen' });
  assert.equal(s.message, error);
  assert.equal(s.open, true);
  s = reduce(s, { type: 'less', value: true });
  s = reduce(s, {
    type: 'message',
    scope: 'a',
    requested: true,
    message: {
      id: 'hint',
      kind: 'hint',
      text: 'Pista explícita',
      pose: 'explain',
      target: 'editor',
    },
  });
  assert.equal(s.open, true);
  s = reduce(s, { type: 'station', scope: 'b', message: entryMessage('b', levels[1], true) });
  assert.equal(s.open, false);
  assert.equal(s.run, null);
  assert.equal(s.seen.length, 1);
  assert.equal(reduce(s, { type: 'message', scope: 'a', message: error }), s);
});
test('Cada escena posee su modelo; ocho gestos se restablecen al reducir movimiento', () => {
  const a = createGali(),
    b = createGali();
  assert.notEqual(a.root, b.root);
  assert.notEqual(a.head, b.head);
  for (const pose of [
    'idle',
    'greeting',
    'attention',
    'explain',
    'review',
    'celebrate',
    'takeoff',
    'landing',
  ] as const) {
    a.update(pose, 1, false);
    a.update(pose, 1.5, false);
    assert.equal(a.thrusters.visible, pose === 'takeoff' || pose === 'landing');
    a.update(pose, 1.6, true);
    assert.equal(a.thrusters.visible, false);
    assert.equal(a.head.rotation.z, 0);
    assert.equal(a.body.position.y, 0);
  }
  a.dispose();
  b.dispose();
});
