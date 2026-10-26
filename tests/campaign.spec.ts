import { test, expect } from '@playwright/test';
import { solutions } from './solutions';
test('Ingreso y ejecución sin crypto.randomUUID, como en HTTP por red local', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.getByRole('heading', { name: 'Encontrar la estación' })).toBeVisible();
  await page.locator('textarea').fill(solutions[0][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  const game = await page.evaluate(() => JSON.parse(localStorage.getItem('galileo:game:1')!));
  expect(game.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(new Set(game.events.map((event: { id: string }) => event.id)).size).toBe(game.events.length);
});
test('Recorrido completo, pistas, reinicio, recuperación, DOM y exportación', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Encendé/ })).toBeVisible();
  await expect(
    page.getByText(/Google Sheets no está configurado\.|Los códigos se validan en el servidor\./),
  ).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/ingreso.png', fullPage: true });
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.getByRole('heading', { name: 'Encontrar la estación' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver pista 1 de 3' }).click();
  await expect(page.getByText('Un identificador permite encontrar')).toBeVisible();
  await page.locator('textarea').fill('"#titulo"');
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: 'Revisemos el programa' })).toBeVisible();
  await expect(
    page.getByText('Seleccionaste otro elemento existente.', { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar código', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, reiniciar' }).click();
  await expect(page.locator('textarea')).toHaveValue('""');
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < solutions[i].length; j++)
      await page.locator('textarea').nth(j).fill(solutions[i][j]);
    await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
    await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible({
      timeout: 15000,
    });
    const frame = page.frameLocator('iframe[title="Controles HTML de la estación"]');
    if (i === 2 || i === 3) {
      await frame.getByRole('button', { name: 'Activar', exact: true }).click();
      await expect(
        page.getByRole('img', {
          name: 'Taller Galileo. Estación en funcionamiento. Cinta activa.',
        }),
      ).toBeVisible();
      if (i === 3) {
        await frame.getByRole('button', { name: 'Detener', exact: true }).click();
        await expect(
          page.getByRole('img', { name: 'Taller Galileo. Estación en espera. Cinta detenida.' }),
        ).toBeVisible();
      }
    }
    if (i === 4 || i === 5) {
      await frame.getByLabel('Nombre de la persona responsable').fill('Nahuel');
      await frame.getByRole('button', { name: 'Registrar', exact: true }).click();
      await expect(frame.getByText('Estación asignada a Nahuel')).toBeVisible();
    }
    if (i === 0) {
      await page.screenshot({ path: 'tests/artifacts/nivel-1.png', fullPage: true });
      await page.reload();
      await expect(page.getByText('Nivel aprobado y conservado.', { exact: false })).toBeVisible();
      await expect(page.locator('textarea')).toHaveValue(solutions[0][0]);
      await expect(page.getByText('1/3', { exact: true })).toBeVisible();
    }
    if (i === 5) await page.screenshot({ path: 'tests/artifacts/nivel-6.png', fullPage: true });
    await page
      .getByRole('button', {
        name: i === 5 ? 'Finalizar misión →' : 'Continuar al siguiente nivel →',
        exact: true,
      })
      .click();
  }
  await expect(page.getByRole('heading', { name: 'El taller está en tus manos.' })).toBeVisible();
  await expect(page.getByText('6 de 6 objetivos aprobados.', { exact: false })).toBeVisible();
  await expect(page.getByText('Modo demo:', { exact: false })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar resultados JSON ↓' }).click();
  expect((await download).suggestedFilename()).toMatch(/^galileo-.*\.json$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'El taller está en tus manos.' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continuar partida →' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('Protección docente, endpoints y modo sin credenciales', async ({ page, request }) => {
  const r = await request.get('/api/teacher');
  expect(r.status()).toBe(401);
  const event = await request.post('/api/events', {
    data: { events: [] },
    headers: { origin: process.env.TEST_BASE_URL || 'http://localhost:3000' },
  });
  expect(event.status()).toBe(401);
  await page.goto('/docente');
  await expect(page.getByLabel('Clave docente')).toBeVisible();
  await page.getByLabel('Clave docente').fill('incorrecta');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByText('Acceso no válido o sin configurar.')).toBeVisible();
});
test('1366 × 768 sin desbordes y navegación por teclado', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Galileo, inicio' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: 'tests/artifacts/1366.png', fullPage: true });
});
