/** Permanent construction progress. Independent from the current DOM snapshot. */
export const workshopModules = [
  { id: 1, key: 'station', label: 'Puesto y conexión' },
  { id: 2, key: 'panel', label: 'Panel de mensajes' },
  { id: 3, key: 'power', label: 'Módulo de encendido' },
  { id: 4, key: 'controls', label: 'Consola de marcha' },
  { id: 5, key: 'operator', label: 'Terminal de operador' },
  { id: 6, key: 'validation', label: 'Puesto de validación' },
] as const;
export type WorkshopModule = (typeof workshopModules)[number]['key'];
export type WorkshopMode = 'preview' | 'campaign' | 'summary';
export type WorkshopModuleState = Record<WorkshopModule, boolean>;

export function getWorkshopProgress(completed: readonly number[]) {
  const approved = new Set(completed);
  const completedIds = workshopModules
    .filter((module) => approved.has(module.id))
    .map((module) => module.id);
  const modules = Object.fromEntries(
    workshopModules.map((module) => [module.key, approved.has(module.id)]),
  ) as WorkshopModuleState;
  return { completedIds, modules, recoveredCount: completedIds.length };
}

export function getWorkshopView(mode: WorkshopMode, completed: readonly number[]) {
  const progress = getWorkshopProgress(completed);
  // The entry illustration shows the workshop without awarding any game achievement.
  const visibleModules =
    mode === 'preview'
      ? (Object.fromEntries(
          workshopModules.map((module) => [module.key, true]),
        ) as WorkshopModuleState)
      : progress.modules;
  return { ...progress, visibleModules };
}
