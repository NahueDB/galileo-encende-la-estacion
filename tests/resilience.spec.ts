import { test, expect } from '@playwright/test';
import { solutions } from './solutions';

const key = 'galileo:game:1';
async function demo(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea').first()).toBeVisible();
}
async function goLevel(page: import('@playwright/test').Page, level: number) {
  await page.evaluate(
    ({ key, level }) => {
      const g = JSON.parse(localStorage.getItem(key)!);
      g.level = level;
      localStorage.setItem(key, JSON.stringify(g));
    },
    { key, level },
  );
  await page.reload();
  await expect(page.locator('textarea').first()).toBeVisible();
}
async function run(page: import('@playwright/test').Page, code: string[]) {
  for (let i = 0; i < code.length; i++) await page.locator('textarea').nth(i).fill(code[i]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
}
test('Errores pedagógicos: anticipación, alternancias, lectura antigua, espacios y limpieza', async ({
  page,
}) => {
  await demo(page);
  await goLevel(page, 3);
  await run(page, ['boton.addEventListener("click", encender());']);
  await expect(
    page.getByText('Registrá click y una función sin invocarla con paréntesis.', { exact: true }),
  ).toBeVisible();
  await goLevel(page, 4);
  await run(page, [solutions[3][0], 'estado.textContent = "Estación en funcionamiento";']);
  await expect(
    page.getByText('Revisá la función asociada a detener.', { exact: false }).first(),
  ).toBeVisible();
  await goLevel(page, 5);
  await run(page, ['const nombre = "Ana"; mensaje.textContent = "Estación asignada a " + nombre;']);
  await expect(
    page.getByText('Este objetivo necesita que practiques value.', { exact: false }),
  ).toBeVisible();
  await run(page, ['mensaje.textContent = "Estación asignada a " + campo.value;']);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  await goLevel(page, 6);
  await run(page, [
    solutions[5][0]
      .replace('campo.value.trim()', 'campo.value')
      .replace('function limpiar() {', 'function limpiar() { const inutil = "".trim();'),
  ]);
  await expect(
    page
      .getByText('El campo con espacios también debe considerarse vacío.', { exact: false })
      .first(),
  ).toBeVisible();
  await run(page, [solutions[5][0].replace('campo.value = "";', '')]);
  await expect(
    page
      .getByText('Limpiar debe vaciar el campo y restablecer el mensaje inicial.', { exact: false })
      .first(),
  ).toBeVisible();
  await run(page, solutions[5]);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  await run(page, ['while(true) {}']);
  await expect(
    page.getByText('Esta campaña admite variables, funciones, condicionales y DOM.', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Esta nueva prueba todavía necesita ajustes.', { exact: false }),
  ).toBeVisible();
});
test('WebGL ausente y movimiento reducido mantienen controles y texto', async ({ page }) => {
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
  await expect(page.getByText('WebGL no está disponible.', { exact: false })).toBeVisible();
  await run(page, solutions[0]);
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
});
test('Cola real simulada: red fallida, reintento y confirmación conservan IDs', async ({
  page,
}) => {
  const seen: string[][] = [];
  let failing = true;
  await page.route('**/api/events', async (route) => {
    const data = route.request().postDataJSON();
    seen.push(data.events.map((e: { id: string }) => e.id));
    await route.fulfill({
      status: failing ? 503 : 200,
      json: failing
        ? { error: 'Falla simulada de red' }
        : { accepted: data.events.map((e: { id: string }) => e.id) },
    });
  });
  await demo(page);
  await page.evaluate((key) => {
    const g = JSON.parse(localStorage.getItem(key)!);
    g.mode = 'real';
    g.token = 'simulation-only';
    const e = {
      id: crypto.randomUUID(),
      gameId: g.id,
      level: 1,
      version: '1.0.0',
      type: 'start',
      at: new Date().toISOString(),
      attempt: 0,
    };
    g.events = [e];
    g.pending = [e];
    localStorage.setItem(key, JSON.stringify(g));
  }, key);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('1 eventos pendientes');
  await expect(page.getByRole('status')).toContainText('Falla simulada');
  const first = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).pending[0].id,
    key,
  );
  failing = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('status')).toContainText('Sin eventos pendientes de envío', {
    timeout: 10000,
  });
  expect(seen.length).toBeGreaterThanOrEqual(2);
  expect(seen.every((ids) => ids[0] === first)).toBe(true);
});
test('Cinco partidas demo aisladas ejecutan simultáneamente', async ({ browser }) => {
  const contexts = await Promise.all(
    Array.from({ length: 5 }, () => browser.newContext({ viewport: { width: 1366, height: 768 } })),
  );
  try {
    const ids = await Promise.all(
      contexts.map(async (context) => {
        const page = await context.newPage();
        await demo(page);
        await run(page, solutions[0]);
        await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible({
          timeout: 20000,
        });
        return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).id, key);
      }),
    );
    expect(new Set(ids).size).toBe(5);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
