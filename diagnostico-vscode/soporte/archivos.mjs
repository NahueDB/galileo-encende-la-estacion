import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { diagnosticLevels } from './diagnostic-levels.mjs';

export const project = fileURLToPath(new URL('../', import.meta.url));
export { diagnosticLevels };
export function extractZones(source, level) {
  const normalized = source.replace(/\r\n/g, '\n');
  return level.zones.map((_, index) => {
    const start = `// INICIO BLOQUE ${index + 1}\n`,
      end = `// FIN BLOQUE ${index + 1}`;
    const begin = normalized.indexOf(start),
      finish = normalized.indexOf(end, begin + start.length);
    if (
      begin < 0 ||
      finish < 0 ||
      normalized.indexOf(start, begin + 1) >= 0 ||
      normalized.indexOf(end, finish + 1) >= 0
    )
      throw new Error(`Misión ${level.id}: conservá los marcadores del bloque ${index + 1}.`);
    const zone = normalized.slice(begin + start.length, finish).replace(/\n$/, '');
    if (zone.length > 5000)
      throw new Error(`Misión ${level.id}: el bloque ${index + 1} supera el tamaño permitido.`);
    return zone;
  });
}
export async function readMission(level) {
  const file = new URL(`../ejercicios/${String(level.id).padStart(2, '0')}.js`, import.meta.url);
  const source = await readFile(file, 'utf8');
  if (source.length > 50000) throw new Error(`Misión ${level.id}: el archivo es demasiado grande.`);
  const zones = extractZones(source, level);
  // Rebuild the prepared context exactly as the website does.
  const code =
    level.prefix +
    zones.map((zone, index) => zone + (level.joins?.[index] ?? '')).join('') +
    level.suffix;
  return { zones, code };
}
