import { test, expect } from '@playwright/test';

test('Identidad oficial y acceso docente solo por URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a[href="/docente"]')).toHaveCount(0);
  const logo = page.locator('.school-logo');
  await expect(logo).toBeVisible();
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await expect(page.locator('header')).toContainText('E.E.S.T. N.º 5');
  await page.goto('/docente');
  await expect(page.getByLabel('Clave docente')).toBeVisible();
});

for (const failure of ['null', 'exception'] as const) {
  test(`WebGL ${failure}: sin overlay ni error de Three y reintento disponible`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.addInitScript((failure) => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (type === 'webgl2') {
          if (failure === 'exception') throw new Error('GPU bloqueada (simulación)');
          return null;
        }
        return original.call(this, type as '2d', ...(args as []));
      } as typeof original;
    }, failure);
    await page.goto('/');
    await expect(page.getByText('WebGL no está disponible.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Reintentar vista 3D' }).click();
    await expect(page.getByText('WebGL no está disponible.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
    await page.locator('textarea').fill('"#estacion"');
    await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
    await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('Libera contextos al navegar y permite recuperar una pérdida gráfica', async ({ page }) => {
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.getExtension as (name: string) => unknown;
    WebGL2RenderingContext.prototype.getExtension = function (
      this: WebGL2RenderingContext,
      name: string,
    ) {
      const extension = original.call(this, name);
      if (name === 'WEBGL_lose_context' && extension) {
        return {
          loseContext() {
            (window as unknown as { released: number }).released =
              ((window as unknown as { released: number }).released || 0) + 1;
            (extension as WEBGL_lose_context).loseContext();
          },
          restoreContext() {
            (extension as WEBGL_lose_context).restoreContext();
          },
        };
      }
      return extension;
    } as typeof WebGL2RenderingContext.prototype.getExtension;
  });
  await page.goto('/');
  const canvas = page.locator('.canvas-host canvas');
  await expect(canvas).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
    await expect(page.locator('textarea')).toBeVisible();
    await page.getByRole('link', { name: 'Galileo, inicio' }).click();
    await page.getByRole('button', { name: 'Iniciar otra partida', exact: true }).click();
  }
  expect(
    await page.evaluate(() => (window as unknown as { released: number }).released),
  ).toBeGreaterThanOrEqual(6);
  await canvas.evaluate((c: HTMLCanvasElement) =>
    c.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext(),
  );
  await expect(page.getByRole('button', { name: 'Reintentar vista 3D' })).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar vista 3D' }).click();
  await expect(page.getByRole('button', { name: 'Reintentar vista 3D' })).toHaveCount(0);
  await expect(canvas).toBeVisible();
});
