import { test, expect } from '@playwright/test';
import { solutions } from './solutions';

const key = 'galileo:game:1';

test('El mapa sigue los logros reales y conserva la estación abierta al avanzar', async ({
  page,
}) => {
  let writes = 0;
  await page.route('**/api/events', async (route) => {
    writes++;
    await route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  const map = page.getByRole('region', { name: 'Mapa de estaciones' });
  const stations = map.locator('.campaign-station');
  await expect(stations).toHaveCount(6);
  await expect(stations.nth(0)).toContainText('Disponible');
  await expect(stations.nth(0).getByRole('button')).toHaveAttribute('aria-current', 'step');
  await expect(stations.nth(5)).toContainText('Bloqueado');
  expect(await map.getByRole('button').count()).toBe(7);
  await expect(stations.nth(0).getByRole('button')).toBeEnabled();
  await expect(stations.nth(5).getByRole('button')).toBeDisabled();
  const toggle = map.getByRole('button', { name: 'Ver mapa completo' });
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(map.getByRole('button', { name: 'Contraer mapa' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(map).toContainText('Próximo objetivo: 1 · Encontrar la estación.');
  await expect(
    page.getByRole('heading', { name: 'Encontrar la estación', exact: true }),
  ).toBeVisible();

  await page.locator('textarea').fill(solutions[0][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  await expect(stations.nth(0)).toContainText('Aprobado');
  await expect(stations.nth(0)).toContainText('Estás acá');
  await expect(stations.nth(0).getByRole('button')).toHaveAttribute('aria-current', 'step');
  await expect(stations.nth(1)).toContainText('Disponible');
  await expect(stations.nth(2)).toContainText('Bloqueado');
  await expect(map.locator('.campaign-connection.energized')).toHaveCount(1);
  await page.reload();
  await expect(map.getByRole('button', { name: 'Contraer mapa' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(stations.nth(0)).toContainText('Aprobado');
  await expect(page.locator('textarea')).toHaveValue(solutions[0][0]);
  await page.locator('textarea').fill('"#titulo"');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(stations.nth(0)).toContainText('Aprobado');
  await expect(stations.nth(1)).toContainText('Disponible');
  await page.getByRole('button', { name: 'Continuar al siguiente nivel →' }).click();
  await expect(stations.nth(1).getByRole('button')).toHaveAttribute('aria-current', 'step');
  await expect(stations.nth(1)).toContainText('Estás acá');
  await expect(map.getByRole('button', { name: 'Contraer mapa' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await map.getByRole('button', { name: 'Contraer mapa' }).click();
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).completed, key)).toEqual([
    1,
  ]);
  for (let i = 1; i < 6; i++) {
    for (let j = 0; j < solutions[i].length; j++)
      await page.locator('textarea').nth(j).fill(solutions[i][j]);
    await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
    await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
    await expect(stations.nth(i)).toContainText('Aprobado');
    await expect(stations.nth(i).getByRole('button')).toHaveAttribute('aria-current', 'step');
    if (i < 5) {
      await expect(stations.nth(i + 1)).toContainText('Disponible');
      await page.getByRole('button', { name: 'Continuar al siguiente nivel →' }).click();
    }
  }
  await expect(map).toContainText('6 de 6 aprobadas');
  expect(writes).toBe(0);
});

test('Mapa legible en escritorio, móvil, zoom y sin WebGL', async ({ page }) => {
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
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.getByText('WebGL no está disponible.', { exact: false })).toBeVisible();
  const map = page.getByRole('region', { name: 'Mapa de estaciones' });
  const toggle = map.getByRole('button', { name: 'Ver mapa completo' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect((await map.boundingBox())!.height).toBeLessThanOrEqual(140);
  expect((await map.boundingBox())!.height).toBeGreaterThanOrEqual(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'tests/artifacts/mapa-escritorio.png', fullPage: true });
  // Ancho CSS equivalente al de una ventana de 1366 px con zoom 200 %.
  await page.setViewportSize({ width: 683, height: 384 });
  await toggle.click();
  await expect(map.locator('.campaign-objectives article')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'tests/artifacts/mapa-zoom.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(map.getByRole('button', { name: 'Contraer mapa' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(map).toContainText('0 de 6 aprobadas');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'tests/artifacts/mapa-movil.png', fullPage: true });
  await map.getByRole('button', { name: 'Contraer mapa' }).click();
  await expect(map.locator('.campaign-details')).toBeHidden();
  await expect(map.locator('.campaign-stations')).toBeVisible();
});
