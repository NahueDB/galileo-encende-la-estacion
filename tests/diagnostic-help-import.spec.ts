import { test, expect, type Page } from '@playwright/test';
import { diagnosticSolutions } from './diagnostic-solutions';
const key = 'galileo:diagnostic:2';
async function start(page: Page) {
  await page.goto('/diagnostico');
  await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
  await expect(page.locator('textarea')).toBeVisible();
}
test('Las preguntas socráticas se registran y terminan en un indicador sin botón agotado', async ({
  page,
}) => {
  await start(page);
  const help = page.locator('.diagnostic-help');
  for (let n = 1; n <= 3; n++)
    await help.getByRole('button', { name: `Ver pista ${n}`, exact: true }).click();
  await expect(help.locator('.diagnostic-questions li')).toHaveCount(3);
  const questions = await help.locator('.diagnostic-questions p').allTextContents();
  expect(questions.every((question) => question.includes('¿') && question.endsWith('?'))).toBe(
    true,
  );
  await expect(help.getByRole('button')).toHaveCount(0);
  await expect(help.getByRole('status')).toContainText('tres preguntas');
  const game = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(game.hints[1]).toEqual([1, 2, 3]);
  expect(game.events.filter((event: { type: string }) => event.type === 'hint')).toHaveLength(3);
  for (const width of [1101, 390]) {
    await page.setViewportSize({ width, height: 884 });
    await help.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator('.gali-flyer')
          .evaluate(
            (element) =>
              element.getAnimations().filter((animation) => animation.playState === 'running')
                .length,
          ),
      )
      .toBe(0);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const flyer = document.querySelector<HTMLElement>('.gali-flyer');
          if (
            !flyer ||
            !flyer.getBoundingClientRect().width ||
            getComputedStyle(flyer).visibility === 'hidden' ||
            getComputedStyle(flyer).display === 'none'
          )
            return true;
          const body = flyer.getBoundingClientRect();
          return Array.from(document.querySelectorAll('.diagnostic-help p')).every((element) => {
            const text = element.getBoundingClientRect();
            return (
              body.right <= text.left ||
              body.left >= text.right ||
              body.bottom <= text.top ||
              body.top >= text.bottom
            );
          });
        }),
      )
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await help.screenshot({ path: `tests/artifacts/diagnostico-preguntas-${width}.png` });
  }
});
test('Importa borradores con confirmación, conserva historial y vuelve a comprobar antes de aprobar', async ({
  page,
}) => {
  await start(page);
  await page.locator('textarea').fill(diagnosticSolutions[0][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  const exported = {
    format: 'galileo-vscode',
    version: '2.0.0',
    completed: [1, 2, 3, 4, 5, 6, 7, 8],
    missions: diagnosticSolutions.map((zones, i) => ({ id: i + 1, zones })),
  };
  const file = {
    name: 'respuestas-galileo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  };
  const input = page.getByLabel('Archivo de respuestas de VS Code');
  await input.setInputFiles(file);
  await page
    .getByRole('region', { name: 'Confirmar importación' })
    .getByRole('button', { name: 'Cancelar' })
    .click();
  await expect(page.locator('textarea')).toHaveValue(diagnosticSolutions[0][0]);
  await input.setInputFiles({
    name: 'incorrecto.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(page.getByRole('status')).toContainText('JSON válido');
  await input.setInputFiles(file);
  await page.getByRole('button', { name: 'Importar los ocho borradores' }).click();
  await expect(page.getByText('1/8 misiones resueltas', { exact: true })).toBeVisible();
  let game = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(game.completed).toEqual([1]);
  expect(game.events.filter((event: { type: string }) => event.type === 'run')).toHaveLength(1);
  await page
    .getByRole('navigation', { name: 'Misiones del diagnóstico' })
    .getByRole('button')
    .nth(7)
    .click();
  await expect(page.locator('textarea').first()).toHaveValue(diagnosticSolutions[7][0]);
  await page.getByRole('button', { name: 'Ejecutar y comprobar' }).click();
  await expect(page.getByRole('heading', { name: '✓ Objetivo cumplido' })).toBeVisible();
  game = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(game.completed).toEqual([1, 8]);
});
