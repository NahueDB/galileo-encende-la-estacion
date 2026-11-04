import { mkdir, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { diagnosticLevels, readMission } from './archivos.mjs';
import { parseCode } from './parser.mjs';
import { createDiagnosticRuntime } from './diagnostic-runtime.mjs';
import { diagnosticRunner } from './diagnostic-runner.mjs';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
if (args.length > 1 || (args.length && !/^[1-8]$/.test(args[0]))) {
  console.error('Elegí una misión entre 1 y 8: pnpm test 3. Sin número se prueban todas.');
  process.exitCode = 2;
} else {
  const selected = args.length
    ? diagnosticLevels.filter((level) => level.id === Number(args[0]))
    : diagnosticLevels;
  const results = [];
  console.log(
    '\nGALILEO · Pruebas del diagnóstico\nSe evalúan únicamente los bloques marcados, con las mismas pruebas de la web.\n',
  );
  for (const level of selected) {
    const dom = new JSDOM('<div id="exercise"></div>');
    let result,
      code = '';
    try {
      ({ code } = await readMission(level));
      const ast = parseCode(code, level);
      diagnosticRunner(
        { id: `local-${level.id}`, html: level.html, ast, level: level.id, testing: true },
        createDiagnosticRuntime,
        {
          document: dom.window.document,
          parent: {
            postMessage(data) {
              if (data.result) result = data.result;
            },
          },
        },
      );
      if (!result) throw new Error('No se recibió el resultado de las comprobaciones.');
    } catch (error) {
      result = { pass: false, checks: [], error: error.message };
    } finally {
      dom.window.close();
    }
    console.log(`${result.pass ? '✓' : '○'} ${level.id}. ${level.title}`);
    if (result.error) console.log('  ' + result.error);
    for (const check of result.checks) {
      console.log(`  ${check.pass ? '✓' : '○'} ${check.label}`);
      if (check.detail) console.log('    ' + check.detail);
    }
    results.push({ id: level.id, title: level.title, code, result });
  }
  const solved = results.filter((item) => item.result.pass).length;
  await mkdir(new URL('../resultados/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../resultados/ultimo.json', import.meta.url),
    JSON.stringify(
      {
        version: '2.0.0',
        at: new Date().toISOString(),
        notice: 'Prueba local. No se envió a Google Sheets.',
        missions: results,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `\n${solved}/${results.length} misiones comprobadas correctamente. Guardado local: resultados/ultimo.json\nPara exportar los ocho borradores: pnpm entrega\n`,
  );
  process.exitCode = solved === results.length ? 0 : 1;
}
