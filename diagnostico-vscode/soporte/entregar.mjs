import { writeFile } from 'node:fs/promises';
import { diagnosticLevels, readMission } from './archivos.mjs';
try {
  const missions = [];
  for (const level of diagnosticLevels) {
    const { zones } = await readMission(level);
    missions.push({ id: level.id, zones });
  }
  await writeFile(
    new URL('../respuestas-galileo.json', import.meta.url),
    JSON.stringify({ format: 'galileo-vscode', version: '2.0.0', missions }, null, 2) + '\n',
  );
  console.log(
    'Se creó respuestas-galileo.json con los ocho borradores, incluidos los pendientes.\nIngresá con tu pareja en la web, elegí «Importar desde VS Code» y ejecutá cada misión para registrar sus respuestas.\nLa exportación local no envía datos a Google Sheets.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
