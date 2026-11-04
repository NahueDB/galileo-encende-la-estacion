import type { GameEvent } from './types';
import { isDiagnostic } from './types';
import { diagnosticProfile } from './diagnostic-profile';
export function consolidate(partidas: string[][], rows: string[][]) {
  const events = new Map<string, string[]>();
  for (const row of rows) if (row[0] && !events.has(row[0])) events.set(row[0], row);
  const games = new Map<string, string[]>();
  for (const p of partidas) if (p[0] && !games.has(p[0])) games.set(p[0], p);
  return Array.from(games.values()).map((p) => {
    const diagnostic = isDiagnostic(p[2]);
    const total = diagnostic ? 8 : 6;
    const ev = Array.from(events.values())
      .filter((e) => e[1] === p[0] && e[3] === p[2] && Number(e[2]) >= 1 && Number(e[2]) <= total)
      .sort((a, b) => a[5].localeCompare(b[5]));
    const done = [...new Set(ev.filter((e) => e[4] === 'complete').map((e) => Number(e[2])))];
    const hints = [...new Set(ev.filter((e) => e[4] === 'hint').map((e) => e[2] + ':' + e[7]))];
    return {
      id: p[0],
      version: p[2],
      total,
      pair: [p[3], p[4]],
      course: p[5],
      started: p[6],
      last: ev.at(-1)?.[5] ?? p[6],
      level: Math.min(total, Math.max(1, ...ev.map((e) => Number(e[2])))),
      completed: done,
      attempts: ev.filter((e) => e[4] === 'run').length,
      hints: hints.length,
      finished: (diagnostic || done.length === total) && ev.some((e) => e[4] === 'finish'),
      profile: diagnostic
        ? diagnosticProfile(
            ev.map((row) => {
              let result: GameEvent['result'];
              try {
                const parsed = JSON.parse(row[8] || 'null');
                if (typeof parsed?.pass === 'boolean' && Array.isArray(parsed.checks))
                  result = parsed;
              } catch {}
              return {
                id: row[0],
                gameId: row[1],
                level: Number(row[2]),
                version: row[3],
                type: row[4] as GameEvent['type'],
                at: row[5],
                attempt: Number(row[6]),
                hint: row[7] ? Number(row[7]) : undefined,
                result,
              };
            }),
          )
        : undefined,
      mode: p[7],
    };
  });
}
