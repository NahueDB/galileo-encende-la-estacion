export const RECOVERY_DURATION = 1200;
export type ModuleRecovery = { id: number; token: string; startedAt: number; animate: boolean };
export function getRecoveryPose(
  cue: ModuleRecovery | null | undefined,
  now: number,
  enabled = true,
) {
  const progress =
    !cue || !cue.animate || !enabled || !Number.isFinite(cue.startedAt)
      ? 1
      : Math.max(0, Math.min(1, (now - cue.startedAt) / RECOVERY_DURATION));
  const eased = 1 - Math.pow(1 - progress, 3);
  return { progress, offsetY: (1 - eased) * 0.4, scale: 0.9 + eased * 0.1 };
}
export const recoveryMessages: Record<number, string> = {
  1: 'Puesto y conexión recuperados',
  2: 'Panel recuperado',
  3: 'Módulo de encendido instalado',
  4: 'Consola de marcha recuperada',
  5: 'Terminal de operador instalada',
  6: 'Puesto de validación recuperado',
};
