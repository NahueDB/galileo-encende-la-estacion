import 'server-only';
import { GoogleAuth } from 'google-auth-library';
import type { GameEvent } from './types';
export const headers = {
  Estudiantes: ['Código individual', 'Nombre', 'Curso', 'Estado activo'],
  Partidas: [
    'Identificador de partida',
    'Código de actividad',
    'Versión',
    'Integrante 1',
    'Integrante 2',
    'Curso',
    'Inicio',
    'Modalidad',
  ],
  Eventos: [
    'Identificador de evento',
    'Identificador de partida',
    'Nivel',
    'Versión',
    'Tipo',
    'Fecha',
    'Intento',
    'Pista',
    'Resultado',
    'Código',
  ],
};
export function configured() {
  return (
    [
      'GOOGLE_SHEETS_SPREADSHEET_ID',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
      'SESSION_SIGNING_SECRET',
      'TEACHER_ACCESS_SECRET',
      'ACTIVITY_CODE',
    ].every((k) => !!process.env[k]) &&
    (process.env.SESSION_SIGNING_SECRET?.length ?? 0) >= 32 &&
    (process.env.TEACHER_ACCESS_SECRET?.length ?? 0) >= 16
  );
}
async function api(path: string, method = 'GET', body?: unknown) {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const token = await auth.getAccessToken();
  const response = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets/' +
      encodeURIComponent(process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '') +
      path,
    {
      method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    },
  );
  if (!response.ok)
    throw new Error(
      'Google Sheets no pudo completar la operación. Revisá permisos y configuración.',
    );
  return response.json();
}
export async function rows(tab: keyof typeof headers): Promise<string[][]> {
  const data = await api('/values/' + encodeURIComponent(tab + '!A2:J50001'));
  if (data.values?.length >= 50000)
    throw new Error(
      'La planilla llegó al límite de lectura de esta versión. Archivá los eventos anteriores.',
    );
  return data.values ?? [];
}
export async function append(tab: keyof typeof headers, values: unknown[][]) {
  return api(
    '/values/' +
      encodeURIComponent(tab + '!A1') +
      ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
    'POST',
    { values },
  );
}
export async function saveEvents(events: GameEvent[]) {
  await append(
    'Eventos',
    events.map((e) => [
      e.id,
      e.gameId,
      e.level,
      e.version,
      e.type,
      e.at,
      e.attempt,
      e.hint ?? '',
      e.result ? JSON.stringify(e.result) : '',
      e.code ?? '',
    ]),
  );
}
export async function initSheets() {
  const metadata = await api('?fields=sheets.properties.title');
  const titles = metadata.sheets.map((s: { properties: { title: string } }) => s.properties.title);
  const missing = Object.keys(headers).filter((t) => !titles.includes(t));
  if (missing.length)
    await api(':batchUpdate', 'POST', {
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    });
  for (const [tab, h] of Object.entries(headers)) {
    const existing = await api('/values/' + encodeURIComponent(tab + '!A1:J1'));
    if (existing.values?.length) {
      if (JSON.stringify(existing.values[0]) !== JSON.stringify(h))
        throw new Error('Encabezados existentes diferentes en ' + tab + '. No se sobrescribieron.');
    } else
      await api('/values/' + encodeURIComponent(tab + '!A1') + '?valueInputOption=RAW', 'PUT', {
        values: [h],
      });
  }
}
