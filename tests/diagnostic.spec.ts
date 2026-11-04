import { test, expect, type Page } from '@playwright/test';
import { diagnosticSolutions } from './diagnostic-solutions';

const key = 'galileo:diagnostic:2';
const mission = (page: Page, id: number) =>
  page
    .getByRole('navigation', { name: 'Misiones del diagnóstico' })
    .getByRole('button')
    .nth(id - 1);
async function start(page: Page) {
  await page.goto('/diagnostico');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.getByRole('heading', { name: 'Encender el panel', exact: true })).toBeVisible();
}
async function solve(page: Page, id: number) {
  for (let i = 0; i < diagnosticSolutions[id - 1].length; i++)
    await page
      .locator('textarea')
      .nth(i)
      .fill(diagnosticSolutions[id - 1][i]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible({
    timeout: 15000,
  });
}

test('Diagnóstico completo: ocho misiones reales, pistas, preview limpia, recuperación y perfil', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let sent = 0;
  await page.route('**/api/events', (route) => {
    sent++;
    return route.fulfill({ status: 500, json: { error: 'Las demos no envían eventos' } });
  });
  await start(page);
  await expect(page.locator('.gali-dialogue')).toHaveCount(1);
  await expect(
    page.getByRole('navigation', { name: 'Misiones del diagnóstico' }).getByRole('button'),
  ).toHaveCount(8);
  for (let id = 1; id <= 8; id++) {
    await mission(page, id).click();
    if (id === 6) await page.getByRole('button', { name: 'Ver pista 1', exact: true }).click();
    await solve(page, id);
    const frame = page.frameLocator('iframe[title="Vista previa del diagnóstico"]');
    await expect(page.locator('iframe[title="Vista previa del diagnóstico"]')).toHaveAttribute(
      'sandbox',
      'allow-scripts',
    );
    if (id === 1) {
      await expect(frame.getByText('Estación en espera', { exact: true })).toBeVisible();
      await frame.getByRole('button', { name: 'Encender panel' }).click();
      await expect(frame.getByText('Panel encendido', { exact: true })).toBeVisible();
    }
    if (id === 2) {
      await frame.getByLabel('Nombre del operador').fill('Sol');
      await frame.getByRole('button', { name: 'Registrar', exact: true }).click();
      await expect(frame.getByText('Estación asignada a Sol')).toBeVisible();
    }
    if (id === 5) {
      await page.reload();
      await expect(page.locator('textarea').first()).toHaveValue(diagnosticSolutions[4][0]);
      await expect(
        page.getByText('Misión resuelta y logro conservado.', { exact: true }),
      ).toBeVisible();
    }
  }
  await page.screenshot({ path: 'tests/artifacts/diagnostico-mision-8.png', fullPage: true });
  await expect(page.getByText('8/8 misiones resueltas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Revisar y cerrar diagnóstico' }).click();
  await page.getByRole('button', { name: 'Confirmar cierre y ver perfil' }).click();
  await expect(page).toHaveURL(/\/diagnostico\/resultado$/);
  await expect(page.getByText('8 de 8 misiones resueltas.', { exact: false })).toBeVisible();
  const table = page.locator('table');
  await expect(table.getByText('Resuelta con pistas', { exact: true })).toHaveCount(1);
  await expect(table.getByText('Resuelta sin pistas registradas', { exact: true })).toHaveCount(7);
  await page.reload();
  await expect(page.getByText('DIAGNÓSTICO CERRADO', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar resultados JSON ↓' }).click();
  expect((await download).suggestedFilename()).toMatch(/^galileo-.*\.json$/);
  const game = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(game.version).toBe('2.0.0');
  expect(game.finished).toBe(true);
  expect(game.events.filter((event: { type: string }) => event.type === 'complete')).toHaveLength(
    8,
  );
  expect(game.events.every((event: { version: string }) => event.version === '2.0.0')).toBe(true);
  expect(sent).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'tests/artifacts/diagnostico-perfil.png', fullPage: true });
});

test('Navega con pendientes, conserva borradores y cierra sin aprobar todas las misiones', async ({
  page,
}) => {
  await start(page);
  const draft = '// Este borrador debe conservarse';
  await page.locator('textarea').fill(draft);
  await mission(page, 8).click();
  await expect(
    page.getByRole('heading', { name: 'Activar al robot especialista', exact: true }),
  ).toBeFocused();
  await mission(page, 1).click();
  await expect(page.locator('textarea')).toHaveValue(draft);
  await solve(page, 1);
  await page
    .locator('textarea')
    .fill('document.querySelector("#estado").textContent="Otro mensaje";');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(
    page.getByText('Los cambios de esta ejecución todavía necesitan revisión.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar código', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue(/Otro mensaje/);
  await mission(page, 3).click();
  await expect(page.locator('.diagnostic-roles')).toContainText('DEMO-02 escribe');
  await page.locator('textarea').fill('return 2;');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await page.getByRole('button', { name: 'Dejar pendiente y seguir →' }).click();
  await expect(
    page.getByRole('heading', { name: 'Calcular el consumo', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Revisar y cerrar diagnóstico' }).click();
  await page.getByRole('button', { name: 'Confirmar cierre y ver perfil' }).click();
  await expect(page.locator('table').getByText('En revisión', { exact: true })).toHaveCount(1);
  await expect(page.locator('table').getByText('Sin intento', { exact: true })).toHaveCount(6);
  await page.getByRole('link', { name: 'Volver a las misiones' }).click();
  await mission(page, 3).click();
  await expect(page.locator('textarea')).toHaveValue('return 2;');
});

test('Campaña anterior y diagnóstico conviven en el mismo navegador', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await page.locator('textarea').fill('"#estacion"');
  const original = await page.evaluate(() => localStorage.getItem('galileo:game:1'));
  await start(page);
  await solve(page, 1);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar partida →' }).click();
  await expect(
    page.getByRole('heading', { name: 'Encontrar la estación', exact: true }),
  ).toBeVisible();
  await expect(page.locator('textarea')).toHaveValue('"#estacion"');
  expect(await page.evaluate(() => localStorage.getItem('galileo:game:1'))).toBe(original);
  await page.goto('/diagnostico');
  await page.getByRole('button', { name: 'Continuar partida →' }).click();
  await expect(page.getByRole('heading', { name: 'Encender el panel', exact: true })).toBeVisible();
  await expect(page.locator('textarea')).toHaveValue(diagnosticSolutions[0][0]);
});

test('Listas y clases: errores se interrumpen sin congelar la página; teclado y pantallas pequeñas', async ({
  page,
}) => {
  await start(page);
  await mission(page, 3).click();
  await page.locator('textarea').fill('while(true) {}');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(page.locator('#diagnostic-feedback')).toContainText('Límite de operaciones');
  await solve(page, 3);
  await mission(page, 8).click();
  for (const width of [1366, 390, 683]) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `tests/artifacts/diagnostico-${width}.png`, fullPage: true });
  }
  await page.locator('textarea').first().focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('textarea').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('textarea').first()).not.toBeFocused();
});

test('Ingreso remoto y reintentos guardan versión 2 sin escribir datos reales', async ({
  page,
}) => {
  let writes = 0,
    fail = true;
  await page.route('**/api/session', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { configured: true } })
      : (expect(route.request().postDataJSON().version).toBe('2.0.0'),
        route.fulfill({
          json: {
            id: crypto.randomUUID(),
            course: '7A SIMULADO',
            started: new Date().toISOString(),
            token: 'fixture-not-a-real-token',
          },
        })),
  );
  await page.route('**/api/events', (route) => {
    writes++;
    const events = route.request().postDataJSON().events as { id: string; version: string }[];
    expect(events.every((event) => event.version === '2.0.0')).toBe(true);
    return route.fulfill(
      fail
        ? { status: 503, json: { error: 'Sin conexión simulada' } }
        : { json: { accepted: events.map((event) => event.id) } },
    );
  });
  await page.goto('/diagnostico');
  await page.getByLabel('Código de actividad').fill('PRUEBA');
  await page.getByLabel('Tu código', { exact: true }).fill('PRUEBA-01');
  await page.getByLabel('Código de tu pareja').fill('PRUEBA-02');
  await page.getByRole('button', { name: 'Comenzar misión →' }).click();
  await solve(page, 1);
  await expect.poll(() => writes).toBeGreaterThan(0);
  await expect(page.locator('.diagnostic-footer')).toContainText('pendientes de envío');
  fail = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect
    .poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).pending.length, key))
    .toBe(0);
  await expect(page.locator('.diagnostic-footer')).toContainText('Eventos locales confirmados');
});
