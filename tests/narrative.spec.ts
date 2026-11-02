import { test, expect, type Page } from '@playwright/test';
import { solutions } from './solutions';

async function chapterFour(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probá la nueva escena · Capítulo 4 →' }).click();
  await expect(page.locator('textarea').first()).toBeVisible();
}
async function solve(page: Page) {
  for (let i = 0; i < 2; i++) await page.locator('textarea').nth(i).fill(solutions[3][i]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
}

test('La reparación se guarda sin encender la cinta y no se repite al recargar', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await chapterFour(page);
  const scene = page.locator('.narrative-scene');
  await expect(scene).toHaveAttribute('data-installed', 'false');
  await solve(page);
  await expect(scene).toHaveAttribute('data-repairing', 'true');
  await expect(scene).toHaveAttribute('data-running', 'false');
  const frame = page.frameLocator('iframe[title="Controles HTML de la estación"]');
  for (let i = 0; i < 2; i++) {
    await frame.getByRole('button', { name: 'Activar', exact: true }).click();
    await expect(scene).toHaveAttribute('data-running', 'true');
    await frame.getByRole('button', { name: 'Detener', exact: true }).click();
    await expect(scene).toHaveAttribute('data-running', 'false');
  }
  await page.reload();
  await expect(scene).toHaveAttribute('data-installed', 'true');
  await expect(scene).toHaveAttribute('data-repairing', 'false');
  await page.locator('textarea').nth(0).fill('estado.textContent = "Todavía no";');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await frame.getByRole('button', { name: 'Activar', exact: true }).click();
  await expect(scene).toHaveAttribute('data-running', 'false');
  await expect(scene).toHaveAttribute('data-installed', 'true');
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('galileo:game:1')!).events.filter(
          (e: { type: string; level: number }) => e.type === 'complete' && e.level === 4,
        ).length,
    ),
  ).toBe(1);
  expect(errors).toEqual([]);
});

test('Herramientas independientes, sin duplicar ayudas al abrir o recuperar', async ({ page }) => {
  await chapterFour(page);
  await page.getByText('Mirá un ejemplo', { exact: false }).click();
  await page.getByText('Revisá el plano', { exact: false }).click();
  await page.getByText('Mirá un ejemplo', { exact: false }).click();
  await page.getByText('Mirá un ejemplo', { exact: false }).click();
  await page.reload();
  await expect(page.locator('.workshop-tool[open]')).toHaveCount(2);
  const game = await page.evaluate(() => JSON.parse(localStorage.getItem('galileo:game:1')!));
  expect(game.hints[4]).toEqual([3, 1]);
  expect(game.events.filter((e: { type: string }) => e.type === 'hint')).toHaveLength(2);
  expect(game.completed).toEqual([1, 2, 3]);
});

test('Gali transporta el repuesto y termina con la pieza instalada', async ({ page }) => {
  await chapterFour(page);
  await page
    .locator('.narrative-scene')
    .screenshot({ path: 'tests/artifacts/narrativa-antes.png' });
  await solve(page);
  await expect(page.locator('.held-fan')).toBeVisible();
  await expect(page.locator('.source-fan')).toBeHidden();
  await page
    .locator('.narrative-scene')
    .screenshot({ path: 'tests/artifacts/narrativa-traslado.png', animations: 'allow' });
  await expect(page.locator('.narrative-scene')).toHaveAttribute('data-installed', 'true', {
    timeout: 9000,
  });
  await expect(page.locator('.installed-fan')).toBeVisible();
  await expect(page.locator('.held-fan')).toBeHidden();
  await expect(page.locator('.narrative-scene')).toHaveAttribute('data-running', 'false');
  await page
    .locator('.narrative-scene')
    .screenshot({ path: 'tests/artifacts/narrativa-reparada.png' });
});

test('Escena completa, movimiento reducido y pantallas de escuela y móvil', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chapterFour(page);
  await solve(page);
  await expect(page.locator('.narrative-scene')).toHaveAttribute('data-installed', 'true', {
    timeout: 9000,
  });
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 768 });
    await page.locator('.narrative-scene').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page.locator('.gali-hover').evaluate((el) => getComputedStyle(el).animationName),
    ).toBe('none');
    await page.screenshot({ path: `tests/artifacts/narrativa-4-${width}.png`, fullPage: true });
  }
});
