import { test, expect, type Page } from '@playwright/test';
import { solutions } from './solutions';
const key = 'galileo:game:1';
const station = (page: Page, id: number) =>
  page.getByRole('button', { name: new RegExp(`^Estación ${id} ·`) });
async function game(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
}
async function start(page: Page, level = 1, completed: number[] = []) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea').first()).toBeVisible();
  if (level !== 1 || completed.length) {
    await page.evaluate(
      ({ key, level, completed }) => {
        const g = JSON.parse(localStorage.getItem(key)!);
        g.level = level;
        g.completed = completed;
        localStorage.setItem(key, JSON.stringify(g));
      },
      { key, level, completed },
    );
    await page.reload();
  }
  await expect(page.locator('.game-main')).toHaveAttribute('data-level', String(level));
}
async function solve(page: Page, id: number) {
  for (let i = 0; i < solutions[id - 1].length; i++)
    await page
      .locator('textarea')
      .nth(i)
      .fill(solutions[id - 1][i]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
}

test('Navegar, revisar y retomar conserva código, pistas, intentos y logros sin duplicar eventos', async ({
  page,
}) => {
  await start(page);
  for (let i = 1; i <= 6; i++)
    await expect(station(page, i))[i === 1 ? 'toBeEnabled' : 'toBeDisabled']();
  await station(page, 1).click();
  expect(
    (await game(page)).events.filter((e: { type: string }) => e.type === 'enter'),
  ).toHaveLength(0);
  await solve(page, 1);
  await expect(station(page, 2)).toBeEnabled();
  await expect(station(page, 3)).toBeDisabled();
  await station(page, 2).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Actualizar el panel', exact: true }),
  ).toBeFocused();
  await expect(page.locator('iframe[title="Controles HTML de la estación"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Un paso a la vez' })).toBeVisible();
  const draft = '// Un borrador propio que todavía no ejecutamos';
  await page.locator('textarea').fill(draft);
  await page.getByRole('button', { name: 'Ver pista 1 de 3' }).click();
  await station(page, 1).click();
  await expect(page.locator('textarea')).toHaveValue(solutions[0][0]);
  await page.locator('textarea').fill('"#titulo"');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(station(page, 1)).toContainText('Aprobado');
  await page.getByRole('button', { name: 'Retomar misión → Estación 2', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue(draft);
  await expect(page.getByText('1/3', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.game-main')).toHaveAttribute('data-level', '2');
  await expect(page.locator('textarea')).toHaveValue(draft);
  await expect(page.getByText('1/3', { exact: true })).toBeVisible();
  await solve(page, 2);
  await station(page, 1).click();
  await page.getByRole('button', { name: 'Retomar misión → Estación 3', exact: true }).click();
  const g = await game(page);
  expect(g.completed).toEqual([1, 2]);
  expect(g.attempts[1]).toBe(2);
  expect(g.hints[2]).toEqual([1]);
  expect(g.events.filter((e: { type: string }) => e.type === 'complete')).toHaveLength(2);
  expect(
    g.events
      .filter((e: { type: string }) => e.type === 'enter')
      .map((e: { level: number }) => e.level),
  ).toEqual([2, 1, 2, 1, 3]);
});

test('Partida completa permite revisar y volver al resumen con un solo finish', async ({
  page,
}) => {
  await start(page, 6, [1, 2, 3, 4, 5, 6]);
  await page.evaluate(
    ({ key, solutions }) => {
      const g = JSON.parse(localStorage.getItem(key)!);
      g.codes = Object.fromEntries(solutions.map((s, i) => [i + 1, s]));
      localStorage.setItem(key, JSON.stringify(g));
    },
    { key, solutions },
  );
  await page.reload();
  await station(page, 1).click();
  await expect(page.locator('textarea')).toHaveValue(solutions[0][0]);
  await page.locator('.campaign-navigation button').click();
  await expect(page.getByRole('heading', { name: 'El taller está en tus manos.' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al taller' }).click();
  await expect(page.locator('.game-main')).toHaveAttribute('data-level', '1');
  await station(page, 5).click();
  await solve(page, 5);
  await page.locator('.campaign-navigation button').click();
  await expect(page.getByRole('heading', { name: 'El taller está en tus manos.' })).toBeVisible();
  const g = await game(page);
  expect(g.finished).toBe(true);
  expect(g.events.filter((e: { type: string }) => e.type === 'finish')).toHaveLength(1);
  expect(g.events.filter((e: { type: string }) => e.type === 'complete')).toHaveLength(0);
});

declare global {
  interface Window {
    heldResults: { data: unknown; source: MessageEventSource | null }[];
    holdResults: boolean;
  }
}
async function holdResults(page: Page) {
  await page.addInitScript(() => {
    window.heldResults = [];
    window.holdResults = true;
    window.addEventListener(
      'message',
      (event) => {
        if (
          window.holdResults &&
          event.data?.channel === 'galileo' &&
          event.data?.kind === 'result'
        ) {
          event.stopImmediatePropagation();
          window.heldResults.push({ data: event.data, source: event.source });
        }
      },
      true,
    );
  });
}
async function release(page: Page, index: number, twice = false) {
  await page.evaluate(
    ({ index, twice }) => {
      window.holdResults = false;
      const held = window.heldResults[index];
      const emit = () =>
        window.dispatchEvent(
          new MessageEvent('message', { data: held.data, source: held.source, origin: 'null' }),
        );
      emit();
      if (twice) emit();
      window.holdResults = true;
    },
    { index, twice },
  );
}

test('Bloqueo durante comprobación y descarte de respuestas antiguas o duplicadas', async ({
  page,
}) => {
  await holdResults(page);
  await start(page, 2, [1, 2]);
  await page.locator('textarea').fill(solutions[1][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect.poll(() => page.evaluate(() => window.heldResults.length)).toBe(1);
  for (let i = 1; i <= 6; i++) await expect(station(page, i)).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Retomar misión → Estación 3', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Continuar al siguiente nivel →' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reiniciar código', exact: true })).toBeDisabled();
  await station(page, 1).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('.game-main')).toHaveAttribute('data-level', '2');
  await release(page, 0, true);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  expect((await game(page)).events.filter((e: { type: string }) => e.type === 'run')).toHaveLength(
    1,
  );
  await station(page, 1).click();
  await page.locator('textarea').fill(solutions[0][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect.poll(() => page.evaluate(() => window.heldResults.length)).toBe(2);
  await release(page, 0);
  await expect(page.getByRole('heading', { name: 'Comprobando el programa…' })).toBeVisible();
  expect((await game(page)).events.filter((e: { type: string }) => e.type === 'run')).toHaveLength(
    1,
  );
  await release(page, 1, true);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  expect((await game(page)).events.filter((e: { type: string }) => e.type === 'run')).toHaveLength(
    2,
  );
});

test('Salir durante una ejecución cancela el trabajo anterior y una partida nueva sigue operable', async ({
  page,
}) => {
  await holdResults(page);
  await start(page);
  await page.locator('textarea').fill(solutions[0][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect.poll(() => page.evaluate(() => window.heldResults.length)).toBe(1);
  const previous = (await game(page)).id;
  await page.getByRole('link', { name: 'Galileo, inicio' }).click();
  await page.getByRole('button', { name: 'Iniciar otra partida', exact: true }).click();
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await release(page, 0);
  await expect(page.locator('textarea')).toHaveValue('""');
  expect((await game(page)).id).not.toBe(previous);
  expect((await game(page)).completed).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Un paso a la vez' })).toBeVisible();
  await page.evaluate(() => (window.holdResults = false));
  await solve(page, 1);
  expect((await game(page)).events.filter((e: { type: string }) => e.type === 'run')).toHaveLength(
    1,
  );
});

test('Revisitas operables con teclado, móvil, zoom y alternativa sin GPU', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith('webgl')) return null;
      return original.call(this, type as '2d', ...(args as []));
    } as typeof original;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, 4, [1, 2, 3]);
  await station(page, 1).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Encontrar la estación', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Retomar misión → Estación 4', exact: true }).click();
  for (const [width, height] of [
    [1366, 768],
    [390, 844],
    [683, 384],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(station(page, 4)).toHaveAttribute('aria-current', 'step');
    await expect(station(page, 5)).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `tests/artifacts/entrega-1b-${width}.png`, fullPage: true });
  }
  await expect(page.getByText('WebGL no está disponible.', { exact: false })).toBeVisible();
});
