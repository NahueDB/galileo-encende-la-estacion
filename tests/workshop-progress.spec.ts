import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { solutions } from './solutions';
const key = 'galileo:game:1';
async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea').first()).toBeVisible();
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
const station = (page: Page, id: number) =>
  page.getByRole('button', { name: new RegExp(`^Estación ${id} ·`) });

test('La entrada es una demostración; la campaña empieza sin módulos recuperados', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.workshop')).toHaveAttribute('data-mode', 'preview');
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '1,2,3,4,5,6');
  await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', '');
  await expect(page.locator('.workshop')).toContainText('DEMOSTRACIÓN DEL TALLER');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('.workshop')).toHaveAttribute('data-mode', 'campaign');
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '');
  await expect(page.locator('.workshop')).toContainText('0/6 MÓDULOS');
});

test('Seis logros construyen seis estados distintos sin recrear el canvas ni encender por aprobar', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demo(page);
  const canvas = await page.locator('.canvas-host canvas').elementHandle();
  expect(canvas).not.toBeNull();
  let previous = await page.locator('.canvas-host canvas').screenshot();
  writeFileSync('tests/artifacts/entrega-2a-estado-0.png', previous);
  for (let id = 1; id <= 6; id++) {
    await solve(page, id);
    const ids = Array.from({ length: id }, (_, i) => i + 1).join(',');
    await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', ids);
    await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', ids);
    await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
    expect(
      await canvas!.evaluate(
        (el) => el.isConnected && el === document.querySelector('.canvas-host canvas'),
      ),
    ).toBe(true);
    await expect(
      page.frameLocator('iframe[title="Controles HTML de la estación"]').locator('body'),
    ).toBeVisible();
    // Allow the throttled scene render to apply visibility before taking a static capture.
    await page.waitForTimeout(80);
    const image = await page.locator('.canvas-host canvas').screenshot();
    expect(image.equals(previous)).toBe(false);
    previous = image;
    writeFileSync(`tests/artifacts/entrega-2a-estado-${id}.png`, image);
    const frame = page.frameLocator('iframe[title="Controles HTML de la estación"]');
    if (id === 3 || id === 4) {
      await frame.getByRole('button', { name: 'Activar', exact: true }).click();
      await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'true');
      if (id === 4) {
        await frame.getByRole('button', { name: 'Detener', exact: true }).click();
        await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
      }
      await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', ids);
    }
    if (id < 6) await page.getByRole('button', { name: 'Continuar al siguiente nivel →' }).click();
  }
  await page.reload();
  await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', '1,2,3,4,5,6');
  await expect(page.locator('.workshop')).toHaveAttribute('data-mood', 'wait');
  await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
  await page.getByRole('button', { name: 'Finalizar misión →', exact: true }).click();
  await expect(page.locator('.workshop')).toHaveAttribute('data-mode', 'summary');
  await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', '1,2,3,4,5,6');
  await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
  await expect(page.locator('.workshop')).toHaveAttribute('data-mood', 'wait');
  await expect(page.locator('.operator-badge')).toHaveCount(0);
  await page.reload();
  expect(
    await page.evaluate(
      (k) =>
        JSON.parse(localStorage.getItem(k)!).events.filter(
          (e: { type: string }) => e.type === 'finish',
        ).length,
      key,
    ),
  ).toBe(1);
  expect(errors).toEqual([]);
});

test('Fallar, revisar y recargar conserva los módulos y reinicia solo la respuesta del DOM', async ({
  page,
}) => {
  await demo(page);
  await page.evaluate((k) => {
    const g = JSON.parse(localStorage.getItem(k)!);
    g.level = 4;
    g.completed = [1, 2, 3, 4];
    localStorage.setItem(k, JSON.stringify(g));
  }, key);
  await page.reload();
  await page.locator('textarea').nth(0).fill(solutions[3][0]);
  await page.locator('textarea').nth(1).fill('estado.textContent = "Otro estado";');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '1,2,3,4');
  await station(page, 1).click();
  await page.locator('textarea').fill('"#titulo"');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '1,2,3,4');
  await page.reload();
  await expect(page.locator('textarea')).toHaveValue('"#titulo"');
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '1,2,3,4');
  await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
  await page.getByRole('button', { name: 'Retomar misión → Estación 5' }).click();
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '1,2,3,4');
  await expect(page.locator('.operator-badge')).toHaveCount(0);
});

test('Sin WebGL se informa el progreso guardado y se puede seguir completando', async ({
  page,
}) => {
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
  await expect(
    page.getByText('Conservás 0 de 6 módulos recuperados.', { exact: false }),
  ).toBeVisible();
  await solve(page, 1);
  await expect(
    page.getByText('Conservás 1 de 6 módulos recuperados.', { exact: false }),
  ).toBeVisible();
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const retry = page.getByRole('button', { name: 'Reintentar vista 3D' });
    await retry.scrollIntoViewIfNeeded();
    expect(
      await retry.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
      }),
    ).toBe(true);
    await page.screenshot({ path: `tests/artifacts/entrega-2a-fallback-${width}.png` });
  }
  await page.reload();
  await expect(
    page.getByText('Conservás 1 de 6 módulos recuperados.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar vista 3D' }).click();
  await expect(page.locator('.workshop')).toHaveAttribute('data-installed-modules', '1');
});

test('El resumen parcial no representa un taller completo ni un operador ficticio', async ({
  page,
}) => {
  await demo(page);
  await page.evaluate((k) => {
    const g = JSON.parse(localStorage.getItem(k)!);
    g.completed = [1, 1, 2, 99];
    localStorage.setItem(k, JSON.stringify(g));
  }, key);
  await page.goto('/resultado');
  await expect(page.getByText('2 de 6 objetivos aprobados.', { exact: false })).toBeVisible();
  await expect(page.locator('.workshop')).toHaveAttribute('data-visible-modules', '1,2');
  await expect(page.locator('.workshop')).toHaveAttribute('data-running', 'false');
});
