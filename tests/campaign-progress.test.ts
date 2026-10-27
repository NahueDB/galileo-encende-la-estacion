import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCampaignProgress } from '../lib/campaign';

test('El mapa deriva estados, primer pendiente y estación actual de los logros', () => {
  const empty = getCampaignProgress({ level: 1, completed: [] });
  assert.deepEqual(
    empty.stations.map((s) => s.state),
    ['available', 'locked', 'locked', 'locked', 'locked', 'locked'],
  );
  assert.equal(empty.firstPending?.id, 1);
  assert.equal(empty.stations[5].requirement?.id, 1);
  assert.equal(empty.approvedCount, 0);

  const partial = getCampaignProgress({ level: 1, completed: [1, 2, 2, 999] });
  assert.deepEqual(
    partial.stations.map((s) => s.state),
    ['approved', 'approved', 'available', 'locked', 'locked', 'locked'],
  );
  assert.equal(partial.approvedCount, 2);
  assert.equal(partial.firstPending?.id, 3);
  assert.equal(partial.stations[0].isCurrent, true);
  assert.equal(partial.stations[3].requirement?.id, 3);

  const gap = getCampaignProgress({ level: 3, completed: [1, 3] });
  assert.equal(gap.firstPending?.id, 2);
  assert.equal(gap.stations[2].state, 'approved');
  assert.equal(gap.stations[2].isCurrent, true);
  assert.equal(gap.stations[3].requirement?.id, 2);

  const full = getCampaignProgress({ level: 6, completed: [1, 2, 3, 4, 5, 6, 6] });
  assert.equal(full.firstPending, null);
  assert.equal(full.approvedCount, 6);
  assert.ok(full.stations.every((s) => s.state === 'approved'));
  assert.equal(full.stations[5].isCurrent, true);
});

import { canVisitStation } from '../lib/campaign';
import { createGame, loadGame, STORAGE } from '../lib/local';

test('Solo se puede visitar el primer pendiente o los logros válidos, incluso con huecos', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 0, 99].map((id) => canVisitStation({ level: 1, completed: [] }, id)),
    [true, false, false, false, false, false, false, false],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((id) => canVisitStation({ level: 1, completed: [1, 2, 2, 99] }, id)),
    [true, true, true, false, false, false],
  );
  assert.deepEqual(
    [1, 2, 3, 4].map((id) => canVisitStation({ level: 3, completed: [1, 3] }, id)),
    [true, true, true, false],
  );
  assert.ok(
    [1, 2, 3, 4, 5, 6].every((id) =>
      canVisitStation({ level: 2, completed: [6, 5, 4, 3, 2, 1, 1] }, id),
    ),
  );
});

test('Recuperar partidas antiguas conserva datos y repara solo una estación bloqueada o inválida', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved = '';
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => (key === STORAGE ? saved : null) },
  });
  try {
    const game = {
      ...createGame(['DEMO-01', 'DEMO-02'], 'demo'),
      level: 5,
      completed: [1, 2, 2, 99],
      codes: { 2: ['mi trabajo'] },
      hints: { 2: [1, 2] },
      attempts: { 2: 3 },
    };
    saved = JSON.stringify(game);
    assert.deepEqual(loadGame(), JSON.parse(JSON.stringify({ ...game, level: 3 })));
    saved = JSON.stringify({ ...game, level: 1 });
    assert.deepEqual(loadGame(), JSON.parse(JSON.stringify({ ...game, level: 1 })));
    saved = JSON.stringify({ ...game, level: 99, completed: [1, 2, 3, 4, 5, 6] });
    assert.equal(loadGame()?.level, 1);
    saved = JSON.stringify({ ...game, level: 5, completed: [1, 2, 3, 4, 5, 6] });
    assert.equal(loadGame()?.level, 5);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
