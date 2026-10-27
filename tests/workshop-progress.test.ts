import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWorkshopProgress, getWorkshopView, workshopModules } from '../lib/workshop-progress';
import { levels } from '../lib/levels';

test('Cada logro válido agrega exactamente un módulo y no modifica la entrada', () => {
  assert.deepEqual(
    workshopModules.map((m) => m.id),
    levels.map((l) => l.id),
  );
  for (let count = 0; count <= 6; count++) {
    const input = Object.freeze(Array.from({ length: count }, (_, i) => i + 1));
    const result = getWorkshopProgress(input);
    assert.equal(result.recoveredCount, count);
    assert.deepEqual(result.completedIds, input);
    assert.equal(Object.values(result.modules).filter(Boolean).length, count);
    for (let i = 0; i < 6; i++) assert.equal(result.modules[workshopModules[i].key], i < count);
  }
});

test('Duplicados, IDs desconocidos y huecos no inventan módulos ni borran logros', () => {
  const result = getWorkshopProgress([6, 2, 2, 999, 0, -1]);
  assert.deepEqual(result.completedIds, [2, 6]);
  assert.equal(result.recoveredCount, 2);
  assert.deepEqual(result.modules, {
    station: false,
    panel: true,
    power: false,
    controls: false,
    operator: false,
    validation: true,
  });
  assert.deepEqual(getWorkshopProgress([1, 2, 3, 3]), getWorkshopProgress([3, 2, 1]));
});

test('La demostración muestra el taller sin aprobar niveles; campaña y resumen usan logros reales', () => {
  const preview = getWorkshopView('preview', []);
  assert.equal(preview.recoveredCount, 0);
  assert.deepEqual(preview.completedIds, []);
  assert.ok(Object.values(preview.visibleModules).every(Boolean));
  assert.ok(Object.values(preview.modules).every((v) => !v));
  for (const mode of ['campaign', 'summary'] as const) {
    const view = getWorkshopView(mode, [1, 4]);
    assert.equal(view.recoveredCount, 2);
    assert.deepEqual(view.visibleModules, view.modules);
    assert.equal(view.visibleModules.power, false);
    assert.equal(view.visibleModules.controls, true);
  }
});
