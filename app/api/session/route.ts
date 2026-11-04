import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { configured, rows, append } from '@/lib/sheets';
import { sessionSchema, readBody } from '@/lib/validation';
import { sign, sameOrigin, verify } from '@/lib/auth';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  const authorization = req.headers.get('authorization');
  if (authorization) {
    const claims = verify(authorization.replace(/^Bearer /, ''), 'pair');
    if (!claims?.pair || claims.pair.length !== 2)
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    try {
      const roster = await rows('Estudiantes');
      const pairNames = claims.pair.map(
        (code) => roster.find((row) => row[0] === code)?.[1]?.trim() || code,
      );
      return NextResponse.json({ pairNames }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ error: 'No se pudieron consultar los nombres.' }, { status: 503 });
    }
  }
  return NextResponse.json(
    { configured: configured() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
  if (!configured())
    return NextResponse.json(
      { error: 'El registro remoto no está configurado. Podés usar el modo demo.' },
      { status: 503 },
    );
  try {
    const data = sessionSchema.parse(await readBody(req, 3000));
    if (data.activity !== process.env.ACTIVITY_CODE)
      return NextResponse.json(
        { error: 'Código de actividad o integrantes no válido.' },
        { status: 400 },
      );
    const roster = await rows('Estudiantes');
    const pair = data.pair.map((code) =>
      roster.find(
        (r) =>
          r[0] === code && ['true', 'sí', 'si', '1', 'activo'].includes(String(r[3]).toLowerCase()),
      ),
    );
    if (pair.some((p) => !p) || !pair[0]![2] || pair[0]![2] !== pair[1]![2])
      return NextResponse.json(
        {
          error:
            'Código de actividad o integrantes no válido. Revisá que ambos estén activos en el mismo curso.',
        },
        { status: 400 },
      );
    const id = randomUUID(),
      started = new Date().toISOString(),
      course = pair[0]![2];
    const token = sign({
      role: 'pair',
      gameId: id,
      pair: data.pair,
      course,
      version: data.version,
    });
    await append('Partidas', [
      [id, data.activity, data.version, ...data.pair, course, started, 'pareja'],
    ]);
    return NextResponse.json({
      id,
      started,
      course,
      token,
      pairNames: pair.map((student, i) => student![1]?.trim() || data.pair[i]),
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.name === 'ZodError'
            ? 'Revisá los códigos ingresados.'
            : 'No se pudo iniciar la partida remota. Revisá la configuración o intentá otra vez.',
      },
      { status: 400 },
    );
  }
}
