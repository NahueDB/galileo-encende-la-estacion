import type { GameEvent } from './types';
import { diagnosticLevels } from './diagnostic-levels';

export function diagnosticProfile(events: GameEvent[]) {
  const unique = [...new Map(events.map((event) => [event.id, event])).values()];
  return diagnosticLevels.map((level) => {
    const history = unique.filter((event) => event.level === level.id);
    const runs = history.filter((event) => event.type === 'run');
    const passedIndex = history.findIndex((event) => event.type === 'run' && event.result?.pass);
    const hintsBeforePass = history
      .slice(0, passedIndex < 0 ? history.length : passedIndex)
      .filter((event) => event.type === 'hint');
    const solved = passedIndex >= 0;
    return {
      id: level.id,
      title: level.title,
      concept: level.concept,
      status: solved
        ? hintsBeforePass.length
          ? 'Resuelta con pistas'
          : 'Resuelta sin pistas registradas'
        : runs.length
          ? 'En revisión'
          : 'Sin intento',
      solved,
      attempts: runs.length,
      hints: new Set(history.filter((event) => event.type === 'hint').map((event) => event.hint))
        .size,
      first: runs[0]?.result,
      latest: runs.at(-1)?.result,
    };
  });
}
