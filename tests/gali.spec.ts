import { test, expect, type Page } from '@playwright/test';
import { solutions } from './solutions';
async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea')).toBeVisible();
}
async function execute(page: Page, code: string) {
  await page.locator('textarea').fill(code);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
}

test('Guía contextual: resultado real, foco, cierre, pistas explícitas, preferencias y revisitas', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demo(page);
  const bubble = page.locator('.gali-bubble'),
    dialogue = page.locator('.gali-dialogue');
  await expect(dialogue).toHaveAttribute('data-message-kind', 'entry');
  await page.locator('textarea').fill('while(true) {}');
  await expect(bubble).toHaveCount(0);
  await expect(page.locator('textarea')).toBeFocused();
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(bubble).toContainText('Revisá la sintaxis');
  await expect(dialogue).toHaveAttribute('data-message-kind', 'error');
  await expect(page.getByRole('button', { name: 'Ejecutar y comprobar' })).toBeFocused();
  expect(await page.locator('#run-feedback').getAttribute('aria-live')).toBe('off');
  await page.getByRole('button', { name: 'Cerrar ayuda de Gali' }).click();
  await expect(bubble).toHaveCount(0);
  await page.getByRole('button', { name: 'Hablar con Gali' }).click();
  await expect(bubble).toContainText('Revisá la sintaxis');
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('galileo:game:1')!).hints,
  );
  await page.getByLabel('Preferencias de Gali').click();
  await page.getByLabel('Menos intervenciones', { exact: true }).check();
  await expect(bubble).toHaveCount(0);
  await page.getByLabel('Preferencias de Gali').click();
  await execute(page, solutions[0][0]);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  await expect(bubble).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('galileo:game:1')!).hints),
  ).toEqual(before);
  await page.getByRole('button', { name: 'Ver pista 1 de 3' }).click();
  await expect(dialogue).toHaveAttribute('data-message-kind', 'hint');
  await expect(bubble).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('galileo:game:1')!).events.filter(
          (e: { type: string }) => e.type === 'hint',
        ).length,
    ),
  ).toBe(1);
  await page.getByRole('button', { name: /^Estación 2 ·/ }).click();
  await expect(bubble).toHaveCount(0);
  await page.getByRole('button', { name: 'Hablar con Gali' }).click();
  await expect(bubble).toContainText('textContent');
  await page.getByRole('button', { name: /^Estación 1 ·/ }).click();
  await page.getByRole('button', { name: 'Hablar con Gali' }).click();
  await expect(bubble).toContainText('ya está recuperado');
  await page.reload();
  await expect(bubble).toHaveCount(0);
  await page.getByRole('button', { name: 'Hablar con Gali' }).click();
  await expect(bubble).toContainText('ya está recuperado');
});

test('Vuelo en escritorio común: siete destinos, trayecto en dos ejes, clics, foco y cancelación', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demo(page);
  const companion = page.locator('.gali-companion'),
    flyer = page.locator('.gali-flyer'),
    world = page.locator('.workshop');
  await expect(companion).toHaveAttribute('data-floating', 'true');
  await expect(world).toHaveAttribute('data-gali-visible', 'false');
  await expect(page.locator('canvas')).toHaveCount(2);
  const stops: Record<string, { x: number; y: number }> = {};
  for (const [target, label] of [
    ['map', 'Mapa'],
    ['objective', 'Objetivo'],
    ['html', 'HTML'],
    ['editor', 'Código'],
    ['execute', 'Probar'],
    ['workshop', 'Taller'],
    ['help', 'Pistas'],
  ]) {
    await page.locator('.gali-places summary').click();
    await page
      .getByRole('navigation', { name: 'Lugares para visitar con Gali' })
      .getByRole('button', { name: label, exact: true })
      .click();
    await expect(companion).toHaveAttribute('data-destination', target);
    await expect(companion).toHaveAttribute('data-flight', 'arrived');
    const r = (await flyer.boundingBox())!;
    stops[target] = { x: r.x, y: r.y };
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(1366);
    expect(r.y + r.height).toBeLessThanOrEqual(768);
    expect(
      await flyer.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return Array.from(document.querySelectorAll('textarea,input,button,summary,a,pre,iframe'))
          .filter((e) => !el.contains(e))
          .every((e) => {
            const b = e.getBoundingClientRect();
            return (
              !b.width ||
              !b.height ||
              r.left >= b.right ||
              r.right <= b.left ||
              r.top >= b.bottom ||
              r.bottom <= b.top
            );
          });
      }),
    ).toBe(true);
    await page.screenshot({ path: 'tests/artifacts/gali-eva-1366-' + target + '.png' });
  }
  expect(
    Math.max(...Object.values(stops).map((p) => p.x)) -
      Math.min(...Object.values(stops).map((p) => p.x)),
  ).toBeGreaterThan(500);
  expect(
    Math.max(...Object.values(stops).map((p) => p.y)) -
      Math.min(...Object.values(stops).map((p) => p.y)),
  ).toBeGreaterThan(100);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('galileo:game:1')!).events.filter(
          (e: { type: string }) => e.type === 'hint',
        ).length,
    ),
  ).toBe(0);
  await page.locator('textarea').click();
  await expect(companion).toHaveAttribute('data-flight', 'idle');
  await expect(page.locator('textarea')).toBeFocused();
  await expect(page.locator('.gali-bubble')).toHaveCount(0);
  expect(
    await page.locator('textarea').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
    }),
  ).toBe(true);
  await page.locator('.gali-places summary').click();
  await page
    .getByRole('navigation', { name: 'Lugares para visitar con Gali' })
    .getByRole('button', { name: 'Mapa', exact: true })
    .click();
  await expect(companion).toHaveAttribute('data-flight', 'outbound');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(companion).toHaveAttribute('data-flight', 'idle');
  expect(await flyer.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(companion).toHaveAttribute('data-flight', 'idle');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(companion).toHaveAttribute('data-floating', 'false');
  await expect(world).toHaveAttribute('data-gali-visible', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(companion).toHaveAttribute('data-floating', 'true');
  await expect(page.locator('canvas')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('Recorrido guiado visita la página y termina sin acumular vuelos ni consumir pistas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demo(page);
  const companion = page.locator('.gali-companion');
  await expect(companion).toHaveAttribute('data-floating', 'true');
  await page.getByRole('button', { name: 'Recorrer la estación', exact: true }).click();
  const visited: string[] = [];
  for (const target of ['map', 'objective', 'html', 'editor', 'execute', 'workshop', 'help']) {
    await expect(companion).toHaveAttribute('data-destination', target, { timeout: 5000 });
    await expect(companion).toHaveAttribute('data-flight', 'arrived');
    visited.push(target);
  }
  await expect(companion).toHaveAttribute('data-flight', 'idle', { timeout: 5000 });
  await expect(page.locator('.gali-pointed')).toHaveCount(0);
  expect(visited).toHaveLength(7);
  await page.getByRole('button', { name: 'Recorrer la estación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Detener recorrido' })).toBeVisible();
  await page.getByRole('button', { name: 'Detener recorrido' }).click();
  await expect(companion).toHaveAttribute('data-flight', 'idle');
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('galileo:game:1')!).events.filter(
          (e: { type: string }) => e.type === 'hint',
        ).length,
    ),
  ).toBe(0);
});

test('Segundo contexto fallido o perdido conserva el taller, la ayuda y permite reintentar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === 'webgl2' &&
        document.querySelector('.workshop canvas') &&
        !(window as unknown as { allowCompanion: boolean }).allowCompanion
      )
        return null;
      return original.call(this, type as '2d', ...(args as []));
    } as typeof original;
  });
  await demo(page);
  const companion = page.locator('.gali-companion'),
    world = page.locator('.workshop');
  await expect(page.getByRole('button', { name: 'Reintentar acompañante' })).toBeVisible();
  await expect(world).toHaveAttribute('data-gali-visible', 'true');
  await expect(page.locator('.gali-bubble')).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { allowCompanion: boolean }).allowCompanion = true;
  });
  await page.getByRole('button', { name: 'Reintentar acompañante' }).click();
  await expect(companion).toHaveAttribute('data-floating', 'true');
  await companion
    .locator('canvas')
    .evaluate((c: HTMLCanvasElement) =>
      c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext(),
    );
  await expect(world).toHaveAttribute('data-gali-visible', 'true');
  await expect(companion).toHaveAttribute('data-floating', 'false');
  await expect(page.locator('canvas')).toHaveCount(1);
  await execute(page, solutions[0][0]);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar acompañante' }).click();
  await expect(companion).toHaveAttribute('data-floating', 'true');
  await expect(page.locator('canvas')).toHaveCount(2);
});

test('Móvil, zoom y preferencias: ayuda en flujo sin cubrir campos ni perder foco', async ({
  page,
}) => {
  await demo(page);
  for (const [width, height] of [
    [1366, 768],
    [390, 844],
    [683, 384],
  ]) {
    await page.setViewportSize({ width, height });
    const companion = page.locator('.gali-companion');
    await expect(companion).toHaveAttribute('data-floating', width >= 1100 ? 'true' : 'false');
    await page.locator('.gali-places summary').click();
    const menu = page.getByRole('navigation', { name: 'Lugares para visitar con Gali' });
    const menuBox = (await menu.boundingBox())!;
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: 'tests/artifacts/gali-eva-menu-' + width + '.png' });
    await page.locator('.gali-places summary').click();
    await page.getByRole('button', { name: /Cerrar ayuda de Gali|Hablar con Gali/ }).click();
    await page.locator('textarea').click();
    await page.keyboard.type(' ');
    await expect(page.locator('textarea')).toBeFocused();
    await expect(page.locator('.gali-bubble')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `tests/artifacts/etapa-3-4-${width}.png`, fullPage: true });
  }
  await page.getByLabel('Preferencias de Gali').click();
  await page.getByLabel('Animaciones reducidas', { exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
});

test('Las preferencias siguen funcionando en memoria cuando el almacenamiento está bloqueado', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demo(page);
  await page.evaluate(() => {
    Storage.prototype.getItem = function () {
      throw new Error('Almacenamiento bloqueado (prueba)');
    };
    Storage.prototype.setItem = function () {
      throw new Error('Almacenamiento bloqueado (prueba)');
    };
  });
  await page.getByLabel('Preferencias de Gali').click();
  await page.getByLabel('Animaciones reducidas', { exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  const canvas = page.locator('.workshop canvas');
  await page.waitForTimeout(150);
  const before = await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(before)).toBe(true);
  await page.getByLabel('Menos intervenciones', { exact: true }).check();
  await expect(page.locator('.gali-bubble')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hablar con Gali' }).click();
  await expect(page.locator('.gali-bubble')).toBeVisible();
  await page.getByLabel('Animaciones reducidas', { exact: true }).uncheck();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
});
