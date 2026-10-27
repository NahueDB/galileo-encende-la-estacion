import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRecoveryPose, RECOVERY_DURATION, type ModuleRecovery } from '../lib/workshop-recovery';
const cue: ModuleRecovery = { id: 2, token: 'once', startedAt: 100, animate: true };
test('La incorporación dura 1,2 segundos, converge y nunca altera los logros', () => {
  assert.equal(RECOVERY_DURATION, 1200);
  assert.deepEqual(getRecoveryPose(cue, 100), { progress: 0, offsetY: 0.4, scale: 0.9 });
  const middle = getRecoveryPose(cue, 700);
  assert.equal(middle.progress, 0.5);
  assert.ok(middle.offsetY > 0 && middle.offsetY < 0.4);
  assert.deepEqual(getRecoveryPose(cue, 1300), { progress: 1, offsetY: 0, scale: 1 });
  assert.deepEqual(getRecoveryPose(cue, 10000), { progress: 1, offsetY: 0, scale: 1 });
});
test('Recuperación, modo estático y movimiento reducido muestran el módulo completo', () => {
  const idle = { progress: 1, offsetY: 0, scale: 1 };
  assert.deepEqual(getRecoveryPose(null, 0), idle);
  assert.deepEqual(getRecoveryPose(cue, 200, false), idle);
  assert.deepEqual(getRecoveryPose({ ...cue, animate: false }, 200), idle);
  assert.deepEqual(getRecoveryPose({ ...cue, startedAt: NaN }, 200), idle);
});
