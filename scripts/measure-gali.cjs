// Run against an isolated production server without real credentials.
// TEST_BASE_URL=http://localhost:3101 node scripts/measure-gali.cjs
const { chromium } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const width of [1366, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 768 }, deviceScaleFactor: 2 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      window.galiSamples = {};
      const kind = (canvas) =>
        canvas.closest?.('.gali-avatar')
          ? 'companion'
          : canvas.closest?.('[data-mode="campaign"]')
            ? 'workshop'
            : null;
      const clear = WebGL2RenderingContext.prototype.clear;
      WebGL2RenderingContext.prototype.clear = function (...args) {
        const key = kind(this.canvas);
        if (key)
          (window.galiSamples[key] ??= { frames: [], draws: 0 }).frames.push(performance.now());
        return clear.apply(this, args);
      };
      for (const method of [
        'drawElements',
        'drawArrays',
        'drawElementsInstanced',
        'drawArraysInstanced',
      ]) {
        const original = WebGL2RenderingContext.prototype[method];
        WebGL2RenderingContext.prototype[method] = function (...args) {
          const key = kind(this.canvas);
          if (key) (window.galiSamples[key] ??= { frames: [], draws: 0 }).draws++;
          return original.apply(this, args);
        };
      }
    });
    await page.goto(process.env.TEST_BASE_URL || 'http://localhost:3101');
    await page.getByRole('button', { name: /Explorar en modo demo/ }).click();
    await page.locator('textarea').waitFor();
    for (const completed of [[], [1, 2, 3, 4, 5, 6]]) {
      if (completed.length) {
        await page.evaluate((completed) => {
          const game = JSON.parse(localStorage.getItem('galileo:game:1'));
          game.completed = completed;
          game.level = 6;
          localStorage.setItem('galileo:game:1', JSON.stringify(game));
        }, completed);
        await page.reload();
      }
      await page.locator('.canvas-host canvas').waitFor();
      await page.locator('.workshop').scrollIntoViewIfNeeded();
      await page.waitForTimeout(7000);
      await page.evaluate(() => (window.galiSamples = {}));
      await page.waitForTimeout(2400);
      results.push(
        await page.evaluate((width) => {
          const renderers = Object.entries(window.galiSamples).map(([name, { frames, draws }]) => {
            const times = frames
              .slice(1)
              .map((t, i) => t - frames[i])
              .sort((a, b) => a - b);
            const canvas = document.querySelector(
              name === 'workshop' ? '.canvas-host canvas' : '.gali-avatar canvas',
            );
            const gl = canvas.getContext('webgl2');
            return {
              name,
              fps: +((1000 * (frames.length - 1)) / (frames.at(-1) - frames[0])).toFixed(1),
              p95ms: +times[Math.floor(times.length * 0.95)].toFixed(1),
              drawsPerFrame: +(draws / frames.length).toFixed(1),
              canvasCss: [canvas.clientWidth, canvas.clientHeight],
              drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
            };
          });
          const gl = document.querySelector('.canvas-host canvas').getContext('webgl2');
          const info = gl.getExtension('WEBGL_debug_renderer_info');
          return {
            width,
            height: innerHeight,
            installed: document.querySelector('.workshop').dataset.installedModules,
            gpu: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'no disponible',
            renderers,
          };
        }, width),
      );
    }
    await page.close();
  }
  const report = {
    at: new Date().toISOString(),
    browser: browser.version(),
    platform: process.platform,
    architecture: process.arch,
    deviceScaleFactor: 2,
    sampleMilliseconds: 2400,
    mode: 'Producción headless, demo, sin otras pruebas simultáneas; contadores de clear y cuatro métodos draw de WebGL2',
    results,
  };
  mkdirSync('tests/artifacts', { recursive: true });
  writeFileSync('tests/artifacts/gali-eva-rendimiento.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
