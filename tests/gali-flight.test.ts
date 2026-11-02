import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGaliBubble, findGaliLanding, flightKeyframes, overlaps } from '../lib/gali-flight';
test('Los destinos evitan controles y código; se adaptan a ventanas y zonas ocupadas', () => {
  const anchor = { left: 300, right: 600, top: 300, bottom: 450 };
  const viewport = { width: 1366, height: 768 },
    size = { width: 72, height: 112 };
  const first = findGaliLanding(anchor, [], viewport, size)!;
  assert.ok(first);
  assert.ok(first.y < anchor.top);
  const blocked = {
    left: first.x - 5,
    right: first.x + 77,
    top: first.y - 5,
    bottom: first.y + 117,
  };
  const next = findGaliLanding(anchor, [blocked], viewport, size)!;
  assert.ok(next);
  assert.ok(
    !overlaps({ left: next.x, right: next.x + 72, top: next.y, bottom: next.y + 112 }, blocked),
  );
  assert.equal(
    findGaliLanding(anchor, [{ left: 0, right: 1366, top: 0, bottom: 768 }], viewport, size),
    null,
  );
  assert.equal(findGaliLanding(anchor, [], { width: 50, height: 100 }, size), null);
  const keys = flightKeyframes({ x: 0, y: 200 }, { x: 500, y: 400 });
  assert.equal(keys.length, 3);
  assert.equal(keys[1].offset, 0.5);
  assert.equal(keys[2].transform, 'translate3d(500px,400px,0)');
});
test('El globo busca un espacio libre y puede omitirse si no cabe', () => {
  const avatar = { left: 300, right: 372, top: 300, bottom: 412 };
  const viewport = { width: 1000, height: 700 };
  const above = findGaliBubble(avatar, [], viewport)!;
  assert.ok(above.y < avatar.top);
  const block = { left: above.x, top: above.y, right: above.x + 184, bottom: above.y + 78 };
  const other = findGaliBubble(avatar, [block], viewport)!;
  assert.ok(
    !overlaps({ left: other.x, top: other.y, right: other.x + 184, bottom: other.y + 78 }, block),
  );
  assert.equal(
    findGaliBubble(avatar, [{ left: 0, top: 0, right: 1000, bottom: 700 }], viewport),
    null,
  );
});
