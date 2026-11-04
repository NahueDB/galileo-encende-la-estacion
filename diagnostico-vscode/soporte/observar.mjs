import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
let running = false,
  again = false,
  timer;
function run() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  const child = spawn(process.execPath, [fileURLToPath(new URL('./probar.mjs', import.meta.url))], {
    stdio: 'inherit',
  });
  child.on('error', (error) => {
    console.error(error.message);
    running = false;
  });
  child.on('exit', () => {
    running = false;
    if (again) {
      again = false;
      run();
    }
  });
}
watch(new URL('../ejercicios/', import.meta.url), () => {
  clearTimeout(timer);
  timer = setTimeout(run, 250);
});
console.log('Pruebas al guardar activadas. Ctrl+C para salir.');
run();
