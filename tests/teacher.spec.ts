import { test, expect } from '@playwright/test';

const secret = 'test-only-teacher-access-secret';
test('Sesión docente con cookie: acceso, protección, datos y cierre', async ({ page, context }) => {
  test.skip(!process.env.TEST_TEACHER_AUTH, 'Requiere servidor de prueba con secretos ficticios.');
  await page.route('**/api/teacher', async (route) => {
    // The live endpoint is checked separately below; fixture tests dashboard rendering only.
    await route.fulfill({
      json: {
        at: '2026-10-26T20:00:00.000Z',
        games: [
          {
            id: 'fixture-only',
            pair: ['PRUEBA-01', 'PRUEBA-02'],
            course: '7A · SIMULADO',
            level: 6,
            completed: [1, 2, 3, 4, 5, 6],
            attempts: 8,
            hints: 3,
            last: '2026-10-26T20:00:00.000Z',
            finished: true,
          },
        ],
      },
    });
  });
  await page.goto('/docente');
  await page.getByLabel('Clave docente').fill(secret);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Parejas en el taller' })).toBeVisible();
  await expect(page.getByText('Finalizada', { exact: true })).toBeVisible();
  await expect(page.getByText('7A · SIMULADO', { exact: true })).toBeVisible();
  const cookie = (await context.cookies()).find((c) => c.name === 'galileo_teacher');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Strict');
  expect(cookie?.secure).toBe(true);
  // Direct request bypasses browser route fixture and reaches protected server endpoint.
  const response = await context.request.get('/api/teacher');
  expect(response.status()).toBe(503);
  expect((await response.json()).error).toContain('Sheets');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByLabel('Clave docente')).toBeVisible();
  expect((await context.request.get('/api/teacher')).status()).toBe(401);
});
