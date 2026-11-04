import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { useGaliPreferences } from '../lib/useGaliPreferences';

test('Desactivar Gali sincroniza consumidores y conserva la elección al volver a abrir', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const names = ['window', 'document', 'localStorage', 'Event', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  for (const [name, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    Event: dom.window.Event,
    IS_REACT_ACT_ENVIRONMENT: true,
  }))
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  const controls: ReturnType<typeof useGaliPreferences>[] = [];
  function Consumer({ index }: { index: number }) {
    controls[index] = useGaliPreferences();
    return null;
  }
  let root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () =>
      root.render(
        createElement(
          'div',
          null,
          createElement(Consumer, { index: 0 }),
          createElement(Consumer, { index: 1 }),
        ),
      ),
    );
    assert.equal(controls[0].enabled, true);
    await act(async () => controls[0].setEnabled(false));
    assert.equal(controls[1].enabled, false);
    await act(async () => root.unmount());
    root = createRoot(dom.window.document.getElementById('root')!);
    await act(async () => root.render(createElement(Consumer, { index: 0 })));
    assert.equal(controls[0].enabled, false);
    await act(async () => controls[0].setEnabled(true));
    assert.equal(controls[0].enabled, true);
  } finally {
    await act(async () => root.unmount());
    names.forEach((name, i) =>
      previous[i]
        ? Object.defineProperty(globalThis, name, previous[i]!)
        : Reflect.deleteProperty(globalThis, name),
    );
    dom.window.close();
  }
});
