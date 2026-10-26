import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { GoogleAuth } from 'google-auth-library';
import { POST as start } from '../app/api/session/route';
import { POST as events } from '../app/api/events/route';
import { verify } from '../lib/auth';
import { consolidate } from '../lib/consolidate';
const base = 'http://localhost:3000';
function request(path: string, data: unknown, token?: string, origin = base) {
  return new Request(base + path, {
    method: 'POST',
    headers: {
      host: 'localhost:3000',
      origin,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(data),
  });
}
test('API real con Sheets simulado: valida nómina, cinco parejas, RAW, reenvíos y fallas', async () => {
  const env = { ...process.env };
  Object.assign(process.env, {
    GOOGLE_SHEETS_SPREADSHEET_ID: 'test-only',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'fake@example.invalid',
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'fake-not-a-key',
    SESSION_SIGNING_SECRET: 'test-only-signing-secret-at-least-32-characters',
    TEACHER_ACCESS_SECRET: 'test-only-teacher-secret',
    ACTIVITY_CODE: 'GALILEO7',
  });
  const tokenMock = mock.method(
    GoogleAuth.prototype,
    'getAccessToken',
    async () => 'simulated-token',
  );
  const writes: { tab: string; values: string[][]; url: string }[] = [];
  let fail = false;
  const fetchMock = mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      if (fail) return new Response('{}', { status: 503 });
      const url = String(input);
      if (url.includes('Estudiantes'))
        return Response.json({
          values: [
            ['001', 'Ana', '7A', 'sí'],
            ['002', 'Bruno', '7A', 'true'],
            ['003', 'Sol', '7A', 'false'],
            ['004', 'Luz', '7B', 'sí'],
          ],
        });
      if (init?.method === 'POST') {
        const tab = decodeURIComponent(url).includes('Partidas!') ? 'Partidas' : 'Eventos';
        writes.push({ tab, values: JSON.parse(init.body as string).values, url });
        return Response.json({ updates: { updatedRows: 1 } });
      }
      throw new Error('Lectura inesperada');
    },
  );
  try {
    for (const pair of [
      ['001', '003'],
      ['001', '004'],
      ['001', '999'],
      ['001', '001'],
    ])
      assert.equal(
        (await start(request('/api/session', { activity: 'GALILEO7', pair }))).status,
        400,
      );
    assert.equal(
      (await start(request('/api/session', { activity: 'BAD', pair: ['001', '002'] }))).status,
      400,
    );
    assert.equal(
      (
        await start(
          request(
            '/api/session',
            { activity: 'GALILEO7', pair: ['001', '002'] },
            undefined,
            'https://evil.invalid',
          ),
        )
      ).status,
      403,
    );
    const sessions = await Promise.all(
      Array.from({ length: 5 }, () =>
        start(request('/api/session', { activity: 'GALILEO7', pair: ['001', '002'] })),
      ),
    );
    const games = await Promise.all(sessions.map((r) => r.json()));
    assert.equal(new Set(games.map((g) => g.id)).size, 5);
    assert.equal(writes.filter((w) => w.tab === 'Partidas').length, 5);
    for (const game of games) {
      assert.equal(verify(game.token, 'pair')?.gameId, game.id);
      assert.equal('roster' in game, false);
      assert.equal('name' in game, false);
    }
    const game = games[0];
    const event = {
      id: crypto.randomUUID(),
      gameId: game.id,
      level: 1,
      version: '1.0.0',
      type: 'run',
      at: new Date().toISOString(),
      attempt: 1,
      code: '=IMPORTXML("x")',
      result: { pass: false, checks: [] },
    };
    for (let i = 0; i < 2; i++) {
      const r = await events(request('/api/events', { events: [event] }, game.token));
      assert.equal(r.status, 200);
      assert.deepEqual((await r.json()).accepted, [event.id]);
    }
    assert.ok(writes.every((w) => w.url.includes('valueInputOption=RAW')));
    assert.equal(writes.filter((w) => w.tab === 'Eventos')[0].values[0][9], event.code);
    assert.equal(
      consolidate(
        writes.filter((w) => w.tab === 'Partidas').flatMap((w) => w.values),
        writes.filter((w) => w.tab === 'Eventos').flatMap((w) => w.values),
      )[0].attempts,
      1,
    );
    assert.equal(
      (
        await events(
          request('/api/events', { events: [{ ...event, gameId: games[1].id }] }, game.token),
        )
      ).status,
      403,
    );
    assert.equal((await events(request('/api/events', { events: [event] }, 'fake'))).status, 401);
    fail = true;
    assert.equal(
      (await events(request('/api/events', { events: [event] }, game.token))).status,
      503,
    );
  } finally {
    fetchMock.mock.restore();
    tokenMock.mock.restore();
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});
