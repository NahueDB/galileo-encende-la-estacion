import type { Game } from './types';
export function displayPairNames(
  game: Pick<Game, 'pair' | 'pairNames' | 'mode'>,
): [string, string] {
  if (game.pairNames) return game.pairNames;
  if (game.mode === 'demo') return ['Estudiante demo 1', 'Estudiante demo 2'];
  return game.pair;
}
