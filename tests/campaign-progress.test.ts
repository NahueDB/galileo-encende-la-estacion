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
