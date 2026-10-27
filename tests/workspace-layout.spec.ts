import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { solutions } from './solutions';

async function demoAt(page: Page, level: number) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea').first()).toBeVisible();
  if (level === 1) return;
  await page.evaluate((level) => {
    const game = JSON.parse(localStorage.getItem('galileo:game:1')!);
    game.level = level;
    game.completed = Array.from({ length: level - 1 }, (_, i) => i + 1);
    localStorage.setItem('galileo:game:1', JSON.stringify(game));
  }, level);
  await page.reload();
  await expect(page.locator('textarea').first()).toBeVisible();
}

for (const [width, height] of [
  [1366, 768],
  [1440, 900],
]) {
  test(`Nivel 4: editor, pistas, controles y devolución visibles a ${width} × ${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    if (width === 683) {
      // Mismo espacio CSS y densidad que 1366 × 768 a 200 %.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: false,
      });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await demoAt(page, 4);
    const map = page.getByRole('region', { name: 'Mapa de estaciones' });
    expect((await map.boundingBox())!.height).toBeLessThanOrEqual(140);
    await page.screenshot({
      path: `tests/artifacts/refinamiento-despues-${width}-nivel-4.png`,
      fullPage: true,
    });
    await page.getByRole('link', { name: 'Consultar pistas ↓' }).click();
    await page.getByRole('button', { name: 'Ver pista 1 de 3' }).click();
    await page.getByRole('button', { name: 'Ver pista 2 de 3' }).click();
    await page.getByRole('link', { name: 'Volver al código ↑' }).click();
    for (let i = 0; i < 2; i++) await page.locator('textarea').nth(i).fill(solutions[3][i]);
    const execute = page.getByRole('button', { name: 'Ejecutar y comprobar' });
    await execute.click();
    const scrollAfterClick = await page.evaluate(() => scrollY);
    await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
    expect(Math.abs((await page.evaluate(() => scrollY)) - scrollAfterClick)).toBeLessThan(5);
    await expect(execute).toBeFocused();
    await expect(page.locator('.preview-column')).toHaveAttribute('data-sticky', 'true');
    await page.locator('textarea').nth(1).scrollIntoViewIfNeeded();
    const measurements = await page.evaluate(() => {
      const world = document.querySelector('.workshop')!.getBoundingClientRect();
      const feedback = document.querySelector('#run-feedback')!.getBoundingClientRect();
      const textarea = document.querySelectorAll('textarea')[1];
      const box = textarea.getBoundingClientRect();
      const point = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return {
        scrollY,
        mapHeight: document.querySelector('.campaign-map')!.getBoundingClientRect().height,
        workshopTop: world.top,
        workshopBottom: world.bottom,
        feedbackBottom: feedback.bottom,
        fieldUncovered: point === textarea,
      };
    });
    expect(measurements.workshopTop).toBeGreaterThanOrEqual(0);
    expect(measurements.workshopBottom).toBeLessThan(height);
    expect(measurements.feedbackBottom).toBeLessThanOrEqual(height);
    expect(measurements.fieldUncovered).toBe(true);
    writeFileSync(
      `tests/artifacts/refinamiento-despues-${width}-medidas.json`,
      JSON.stringify(measurements, null, 2),
    );
    const frame = page.frameLocator('iframe[title="Controles HTML de la estación"]');
    await frame.getByRole('button', { name: 'Activar', exact: true }).click();
    await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'true');
    await frame.getByRole('button', { name: 'Detener', exact: true }).click();
    await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
    await page.screenshot({
      path: `tests/artifacts/refinamiento-despues-${width}-nivel-4-editando.png`,
    });
    await page.getByText('Ver 5 comprobaciones', { exact: true }).click();
    await page.setViewportSize({ width, height: 600 });
    await expect(page.locator('.preview-column')).toHaveAttribute('data-sticky', 'false');
    await page.setViewportSize({ width, height });
    await expect(frame.getByRole('button', { name: 'Detener', exact: true })).toBeEnabled();
    await page.locator('textarea').nth(1).fill('estado.textContent = "Otro estado";');
    await execute.click();
    await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
    await expect(map.locator('.campaign-station').nth(3)).toContainText('Aprobado');
  });
}

for (const [width, height, level] of [
  [1366, 768, 1],
  [1366, 768, 6],
  [390, 844, 4],
  [390, 844, 6],
  [683, 384, 6],
]) {
  test(`Distribución operable ${width} × ${height}, nivel ${level}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    if (width === 683) {
      // Mismo espacio CSS y densidad que 1366 × 768 a 200 %.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: false,
      });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await demoAt(page, level);
    const toggle = page.getByRole('button', { name: 'Ver mapa completo' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Contraer mapa' })).toBeFocused();
    expect(
      await page
        .getByRole('button', { name: 'Contraer mapa' })
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe('none');
    await page.getByRole('button', { name: 'Contraer mapa' }).click();
    await page.locator('.html-reference summary').click();
    for (let i = 0; i < solutions[level - 1].length; i++)
      await page
        .locator('textarea')
        .nth(i)
        .fill(solutions[level - 1][i]);
    await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
    await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
    const frame = page.frameLocator('iframe[title="Controles HTML de la estación"]');
    if (level === 6) {
      await frame.getByLabel('Nombre de la persona responsable').fill('  Galileo  ');
      await frame.getByRole('button', { name: 'Registrar', exact: true }).click();
      await expect(frame.getByText('Estación asignada a Galileo')).toBeVisible();
      await frame.getByRole('button', { name: 'Limpiar', exact: true }).click();
      await expect(frame.getByLabel('Nombre de la persona responsable')).toHaveValue('');
    }
    const documentSize = await frame.locator('body').evaluate((body) => ({
      height: body.scrollHeight,
      width: body.scrollWidth,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
    }));
    expect(documentSize.height).toBeLessThanOrEqual(documentSize.viewportHeight);
    expect(documentSize.width).toBeLessThanOrEqual(documentSize.viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width <= 760) {
      const order = await page.evaluate(() => {
        const code = document.querySelector('.code-panel')!.getBoundingClientRect();
        const actions = document.querySelector('.editor-actions.mobile')!.getBoundingClientRect();
        const preview = document.querySelector('.preview-column')!.getBoundingClientRect();
        const help = document.querySelector('.learning-support')!.getBoundingClientRect();
        return (
          actions.bottom <= preview.top && code.bottom <= preview.top && preview.bottom <= help.top
        );
      });
      expect(order).toBe(true);
      await expect(page.locator('.preview-column')).toHaveAttribute('data-sticky', 'false');
    }
    await page.locator('iframe[title="Controles HTML de la estación"]').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tests/artifacts/refinamiento-controles-${width}-nivel-${level}.png`,
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `tests/artifacts/refinamiento-despues-${width}-nivel-${level}.png`,
      fullPage: true,
    });
  });
}

test('La alternativa sin GPU conserva botones descubiertos en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  await demoAt(page, 6);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const retry = page.getByRole('button', { name: 'Reintentar vista 3D' });
  await retry.scrollIntoViewIfNeeded();
  expect(
    await retry.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
    }),
  ).toBe(true);
  await retry.click();
  await expect(page.getByText('WebGL no está disponible.', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/refinamiento-sin-webgl.png' });
});
