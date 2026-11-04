import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import ts from 'typescript';
import { diagnosticLevels } from '../lib/diagnostic-levels';

// Regenerates support files, never overwrites an existing student's exercise.
async function main() {
  const repo = resolve(process.cwd()),
    kit = join(repo, 'diagnostico-vscode');
  await mkdir(join(kit, 'soporte'), { recursive: true });
  await mkdir(join(kit, 'ejercicios'), { recursive: true });
  await mkdir(join(kit, '.vscode'), { recursive: true });
  for (const name of [
    'types',
    'parser',
    'diagnostic-levels',
    'diagnostic-runtime',
    'diagnostic-runner',
  ]) {
    const source = await readFile(join(repo, 'lib', name + '.ts'), 'utf8');
    const output = ts
      .transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      })
      .outputText.replace(/from '(\.\/[\w-]+)'/g, "from '$1.mjs'");
    await writeFile(join(kit, 'soporte', name + '.mjs'), output);
  }
  for (const level of diagnosticLevels) {
    const values = level.zones.map(
      (zone, index) => `// INICIO BLOQUE ${index + 1}\n${zone.initial}\n// FIN BLOQUE ${index + 1}`,
    );
    const source =
      `// GALILEO · MISIÓN ${level.id}: ${level.title}\n// Modificá solamente los bloques marcados.\n\n` +
      level.prefix +
      values.map((value, index) => value + (level.joins?.[index] ?? '')).join('') +
      level.suffix +
      '\n';
    try {
      await writeFile(join(kit, 'ejercicios', String(level.id).padStart(2, '0') + '.js'), source, {
        flag: 'wx',
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
  }
  const dependencies: Record<string, string> = {};
  for (const name of ['jsdom', 'acorn'])
    dependencies[name] = JSON.parse(
      await readFile(join(repo, 'node_modules', name, 'package.json'), 'utf8'),
    ).version;
  await writeFile(
    join(kit, 'package.json'),
    JSON.stringify(
      {
        name: 'galileo-diagnostico-vscode',
        version: '2.0.0',
        private: true,
        type: 'module',
        description: 'Ocho misiones de diagnóstico para completar en parejas.',
        scripts: {
          test: 'node soporte/probar.mjs',
          'test:watch': 'node soporte/observar.mjs',
          entrega: 'node soporte/entregar.mjs',
        },
        engines: { node: '^24.x' },
        packageManager: 'pnpm@11.25.0',
        dependencies,
      },
      null,
      2,
    ) + '\n',
  );
  await writeFile(join(kit, 'pnpm-workspace.yaml'), 'packages: []\n');
  await writeFile(join(kit, '.nvmrc'), '24\n');
  await writeFile(
    join(kit, 'jsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          moduleDetection: 'force',
          checkJs: false,
          lib: ['ES2022', 'DOM'],
        },
        include: ['ejercicios/**/*.js'],
        exclude: ['node_modules', 'soporte', 'resultados'],
      },
      null,
      2,
    ) + '\n',
  );
  await writeFile(join(kit, '.gitignore'), 'node_modules/\nresultados/\nrespuestas-galileo.json\n');
  await writeFile(
    join(kit, '.vscode', 'tasks.json'),
    JSON.stringify(
      {
        version: '2.0.0',
        tasks: [
          {
            label: 'Galileo: probar todas las misiones',
            type: 'process',
            command: 'node',
            args: ['soporte/probar.mjs'],
            group: { kind: 'test', isDefault: true },
            problemMatcher: [],
          },
          {
            label: 'Galileo: probar una misión',
            type: 'process',
            command: 'node',
            args: ['soporte/probar.mjs', '${input:mision}'],
            group: 'test',
            problemMatcher: [],
          },
          {
            label: 'Galileo: exportar respuestas',
            type: 'process',
            command: 'node',
            args: ['soporte/entregar.mjs'],
            problemMatcher: [],
          },
        ],
        inputs: [
          {
            id: 'mision',
            type: 'pickString',
            description: 'Elegí la misión',
            options: diagnosticLevels.map((level) => String(level.id)),
          },
        ],
      },
      null,
      2,
    ) + '\n',
  );
  await writeFile(
    join(kit, 'CONSIGNAS.md'),
    '# Misiones del diagnóstico\n\nTrabajen en pareja. Completen solamente los bloques marcados de cada archivo.\n\n' +
      diagnosticLevels
        .map(
          (level) =>
            `## ${level.id}. ${level.title}\n\nArchivo: \`ejercicios/${String(level.id).padStart(2, '0')}.js\` · ${level.minutes} minutos orientativos.\n\n${level.objective}\n\nComprobamos: ${level.tests.join('; ')}.\n`,
        )
        .join('\n'),
  );
  console.log('Proyecto de VS Code actualizado. Los ejercicios existentes se conservaron.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
