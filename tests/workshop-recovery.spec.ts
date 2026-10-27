import { test, expect, type Page } from '@playwright/test';
import { solutions } from './solutions';
async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea')).toBeVisible();
}
async function solve1(page: Page) {
  await page.locator('textarea').fill(solutions[0][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
}
test('Solo un logro nuevo incorpora el módulo, pulsa el mapa y conserva su mensaje', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demo(page);
  await solve1(page);
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '1');
  await expect(page.locator('.module-recovery')).toHaveText('Puesto y conexión recuperados');
  await expect(page.locator('.campaign-station.recovering')).toHaveCount(1);
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '', {
    timeout: 3000,
  });
  await page.locator('textarea').fill('"#estacion" // Sigo probando');
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '');
  await page.reload();
  await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', '1');
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '');
  await expect(page.locator('.module-recovery')).toHaveCount(0);
  await solve1(page);
  await expect(page.locator('.module-recovery')).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('galileo:game:1')!).events.filter(
          (e: { type: string }) => e.type === 'complete',
        ).length,
    ),
  ).toBe(1);
});
test('Reducir movimiento cancela la incorporación y no la reinicia al reactivarlo', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demo(page);
  await solve1(page);
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '');
  await expect(page.locator('.campaign-station.recovering')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '');
  await expect(page.locator('.campaign-station.recovering')).toHaveCount(0);
});
test('Cambiar de estación cancela la presentación y conserva el módulo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await demo(page);
  await solve1(page);
  await page.getByRole('button', { name: /^Estación 2 ·/ }).click();
  await expect(page.locator('.workshop')).toHaveAttribute('data-constructing-module', '');
  await expect(page.locator('.module-recovery')).toHaveCount(0);
  await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', '1');
  await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
});
test('Sin GPU hay seis módulos con estados reales y controles descubiertos', async ({ page }) => {
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
  await demo(page);
  const modules = page.getByRole('region', { name: 'Módulos del taller' });
  await expect(modules.locator('li')).toHaveCount(6);
  await expect(modules.locator('[data-installed="false"]')).toHaveCount(6);
  await solve1(page);
  await expect(modules.locator('[data-installed="true"]')).toHaveCount(1);
  for (const width of [1366, 390, 683]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const retry = page.getByRole('button', { name: 'Reintentar vista 3D' });
    await retry.scrollIntoViewIfNeeded();
    expect(
      await retry.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
      }),
    ).toBe(true);
    await page.screenshot({
      path: `tests/artifacts/entrega-2b-fallback-${width}.png`,
      fullPage: true,
    });
  }
  await page.reload();
  await expect(modules.locator('[data-installed="true"]')).toHaveCount(1);
});
