import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { diagnosticLevels } from '../lib/diagnostic-levels';
import { diagnosticSolutions } from './diagnostic-solutions';
import { parseDiagnosticImport } from '../lib/diagnostic-import';

const repo = resolve(process.cwd()),
  kit = join(repo, 'diagnostico-vscode');
test('Las 24 pistas del diagnóstico son preguntas sin fragmentos de solución', () => {
  for (const level of diagnosticLevels)
    for (const question of level.hints) {
      assert.ok(question.includes('¿') && question.endsWith('?'), question);
      assert.doesNotMatch(question, /this\.|return\s|querySelector\(|getElementById\(|;|=>|&&/);
    }
});
test('El proyecto de VS Code conserva consignas y entrega ocho bloques sin resolver', async () => {
  const support = await import(pathToFileURL(join(kit, 'soporte', 'archivos.mjs')).href);
  assert.deepEqual(support.diagnosticLevels, diagnosticLevels);
  for (const level of diagnosticLevels) {
    const source = await readFile(
      join(kit, 'ejercicios', String(level.id).padStart(2, '0') + '.js'),
      'utf8',
    );
    assert.deepEqual(
      support.extractZones(source, level),
      level.zones.map((zone) => zone.initial),
    );
  }
});
test('Proyecto independiente: prueba soluciones, exporta bloques e importa sin confiar en logros', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'galileo-vscode-qa-'));
  await cp(kit, temp, {
    recursive: true,
    filter: (source) =>
      !source.includes('node_modules') &&
      !source.includes('resultados') &&
      !source.endsWith('respuestas-galileo.json'),
  });
  await symlink(
    join(repo, 'node_modules'),
    join(temp, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.throws(() =>
    execFileSync(process.execPath, [join(temp, 'soporte', 'probar.mjs'), '1'], {
      cwd: temp,
      timeout: 15000,
      stdio: 'pipe',
    }),
  );
  for (const level of diagnosticLevels) {
    const source =
      level.prefix +
      diagnosticSolutions[level.id - 1]
        .map(
          (zone, index) =>
            `// INICIO BLOQUE ${index + 1}\n${zone}\n// FIN BLOQUE ${index + 1}` +
            (level.joins?.[index] ?? ''),
        )
        .join('') +
      level.suffix;
    await writeFile(join(temp, 'ejercicios', String(level.id).padStart(2, '0') + '.js'), source);
  }
  const output = execFileSync(process.execPath, [join(temp, 'soporte', 'probar.mjs')], {
    cwd: temp,
    encoding: 'utf8',
    timeout: 15000,
  });
  assert.match(output, /8\/8 misiones comprobadas correctamente/);
  execFileSync(process.execPath, [join(temp, 'soporte', 'entregar.mjs')], {
    cwd: temp,
    timeout: 15000,
    stdio: 'pipe',
  });
  const text = await readFile(join(temp, 'respuestas-galileo.json'), 'utf8');
  const imported = parseDiagnosticImport(text);
  for (const level of diagnosticLevels)
    assert.deepEqual(imported[level.id], diagnosticSolutions[level.id - 1]);
  const forged = JSON.parse(text);
  forged.completed = [1, 2, 3, 4, 5, 6, 7, 8];
  forged.token = 'not-a-token';
  assert.deepEqual(parseDiagnosticImport(JSON.stringify(forged)), imported);
  assert.equal(
    JSON.parse(await readFile(join(temp, 'resultados', 'ultimo.json'), 'utf8')).notice,
    'Prueba local. No se envió a Google Sheets.',
  );
});
test('La importación rechaza archivos incompletos, duplicados, otra versión y exceso de tamaño', () => {
  const data = {
    format: 'galileo-vscode',
    version: '2.0.0',
    missions: diagnosticLevels.map((level) => ({
      id: level.id,
      zones: diagnosticSolutions[level.id - 1],
    })),
  };
  assert.throws(() => parseDiagnosticImport('{'), /JSON válido/);
  assert.throws(() => parseDiagnosticImport(JSON.stringify({ ...data, version: '1.0.0' })));
  assert.throws(() =>
    parseDiagnosticImport(JSON.stringify({ ...data, missions: data.missions.slice(0, 7) })),
  );
  assert.throws(() =>
    parseDiagnosticImport(
      JSON.stringify({
        ...data,
        missions: data.missions.map((mission) => ({ ...mission, id: 1 })),
      }),
    ),
  );
  assert.throws(() =>
    parseDiagnosticImport(
      JSON.stringify({
        ...data,
        missions: data.missions.map((mission) => ({ ...mission, zones: ['x'.repeat(5001)] })),
      }),
    ),
  );
  assert.throws(() => parseDiagnosticImport(' '.repeat(100001)));
});
