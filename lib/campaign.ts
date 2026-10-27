import { levels } from './levels';
import type { Game } from './types';

// Los títulos, conceptos y objetivos pedagógicos siguen siendo los de cada nivel.
const stationNames: Record<number, string> = {
  1: 'Localizador',
  2: 'Panel de mensajes',
  3: 'Módulo de encendido',
  4: 'Control de marcha',
  5: 'Terminal de operador',
  6: 'Puesto de validación',
};

export const campaignStations = levels.map((level) => ({
  level,
  name: stationNames[level.id],
}));

export type StationState = 'approved' | 'available' | 'locked';

export function getCampaignProgress(game: Pick<Game, 'completed' | 'level'>) {
  const completed = new Set(game.completed);
  const firstPending = levels.find((level) => !completed.has(level.id)) ?? null;
  const stations = campaignStations.map((station) => {
    const { level } = station;
    const state: StationState = completed.has(level.id)
      ? 'approved'
      : level.id === firstPending?.id
        ? 'available'
        : 'locked';
    return {
      ...station,
      state,
      isCurrent: level.id === game.level,
      requirement: state === 'locked' ? firstPending : null,
    };
  });
  return {
    stations,
    firstPending,
    approvedCount: stations.filter((station) => station.state === 'approved').length,
  };
}
