'use client';
import type { Game, GameEvent } from './types';
import { VERSION } from './types';
export const STORAGE = 'galileo:game:1';
export function loadGame(): Game | null {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (
      !data ||
      data.version !== VERSION ||
      typeof data.id !== 'string' ||
      !Array.isArray(data.pair) ||
      !Array.isArray(data.events) ||
      !Array.isArray(data.pending) ||
      !Array.isArray(data.completed)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
export function storeGame(game: Game) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}
export function createGame(
  pair: [string, string],
  mode: 'demo' | 'real',
  remote?: { id: string; course: string; started: string; token: string },
): Game {
  return {
    id: remote?.id ?? crypto.randomUUID(),
    version: VERSION,
    pair,
    mode,
    course: remote?.course ?? 'Demostración',
    token: remote?.token,
    started: remote?.started ?? new Date().toISOString(),
    level: 1,
    completed: [],
    codes: {},
    hints: {},
    attempts: {},
    events: [],
    pending: [],
    finished: false,
  };
}
export function addEvent(
  game: Game,
  type: GameEvent['type'],
  extra: Partial<GameEvent> = {},
): Game {
  const e: GameEvent = {
    id: crypto.randomUUID(),
    gameId: game.id,
    version: VERSION,
    level: game.level,
    at: new Date().toISOString(),
    attempt: game.attempts[game.level] ?? 0,
    ...extra,
    type,
  };
  return {
    ...game,
    events: [...game.events, e],
    pending: game.mode === 'real' ? [...game.pending, e] : game.pending,
  };
}
export function downloadResults(game: Game) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          ...game,
          token: undefined,
          notice:
            game.mode === 'demo'
              ? 'DEMOSTRACIÓN: no son resultados reales'
              : 'Trabajo en pareja. Registro formativo; no acredita autoría individual.',
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'galileo-' + game.id + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
