import { test, expect } from '@playwright/test';

test('El taller se anima y se detiene al activar movimiento reducido', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const canvas = page.locator('.canvas-host canvas');
  await expect(canvas).toBeVisible();
  const before = await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Allow the media change and the next throttled frame to reset the pose.
  await page.waitForTimeout(150);
  const still = await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(still)).toBe(true);
  expect(
    await page.locator('.entry-form').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  expect(errors).toEqual([]);
});
