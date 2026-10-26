import { NextResponse } from 'next/server';
import { verify, sameOrigin } from '@/lib/auth';
import { eventsSchema, readBody } from '@/lib/validation';
import { configured, saveEvents } from '@/lib/sheets';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
  const claims = verify(req.headers.get('authorization')?.replace(/^Bearer /, ''), 'pair');
  if (!claims)
    return NextResponse.json(
      { error: 'La sesión venció. Descargá los resultados para conservarlos.' },
      { status: 401 },
    );
  if (!configured())
    return NextResponse.json({ error: 'Registro remoto no disponible.' }, { status: 503 });
  try {
    const { events } = eventsSchema.parse(await readBody(req, 300000));
    if (events.some((e) => e.gameId !== claims.gameId))
      return NextResponse.json({ error: 'Partida incorrecta.' }, { status: 403 });
    await saveEvents(events);
    return NextResponse.json({ accepted: events.map((e) => e.id) });
  } catch {
    return NextResponse.json(
      { error: 'No se confirmó el envío. Los eventos siguen pendientes.' },
      { status: 503 },
    );
  }
}
