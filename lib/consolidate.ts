import type { GameEvent } from './types';
export function consolidate(partidas: string[][], rows: string[][]) {
  const events = new Map<string, string[]>();
  for (const row of rows) if (row[0] && !events.has(row[0])) events.set(row[0], row);
  const games = new Map<string, string[]>();
  for (const p of partidas) if (p[0] && !games.has(p[0])) games.set(p[0], p);
  return Array.from(games.values()).map((p) => {
    const ev = Array.from(events.values())
      .filter((e) => e[1] === p[0])
      .sort((a, b) => a[5].localeCompare(b[5]));
    const done = [...new Set(ev.filter((e) => e[4] === 'complete').map((e) => Number(e[2])))];
    const hints = [...new Set(ev.filter((e) => e[4] === 'hint').map((e) => e[2] + ':' + e[7]))];
    return {
      id: p[0],
      pair: [p[3], p[4]],
      course: p[5],
      started: p[6],
      last: ev.at(-1)?.[5] ?? p[6],
      level: Math.min(6, Math.max(1, ...ev.map((e) => Number(e[2])))),
      completed: done,
      attempts: ev.filter((e) => e[4] === 'run').length,
      hints: hints.length,
      finished: done.length === 6 && ev.some((e) => e[4] === 'finish'),
      mode: p[7],
    };
  });
}
