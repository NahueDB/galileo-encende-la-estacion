import { z } from 'zod';
import { diagnosticLevels } from './diagnostic-levels';
import { DIAGNOSTIC_VERSION } from './types';

export const diagnosticImportSchema = z
  .object({
    format: z.literal('galileo-vscode'),
    version: z.literal(DIAGNOSTIC_VERSION),
    missions: z
      .array(
        z.object({
          id: z.number().int().min(1).max(8),
          zones: z.array(z.string().max(5000)).min(1).max(2),
        }),
      )
      .length(8),
  })
  .refine(
    (data) =>
      new Set(data.missions.map((mission) => mission.id)).size === 8 &&
      data.missions.every(
        (mission) => mission.zones.length === diagnosticLevels[mission.id - 1].zones.length,
      ),
    { message: 'El archivo debe contener los ocho ejercicios y sus bloques completos.' },
  );

export function parseDiagnosticImport(text: string) {
  if (text.length > 100000) throw new Error('El archivo supera el tamaño permitido.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      'El archivo no contiene un JSON válido. Volvé a exportarlo desde el proyecto de VS Code.',
    );
  }
  const data = diagnosticImportSchema.safeParse(parsed);
  if (!data.success)
    throw new Error('Usá el archivo respuestas-galileo.json generado por el proyecto de VS Code.');
  return Object.fromEntries(data.data.missions.map((mission) => [mission.id, mission.zones]));
}
