import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from '@/lib/auth';
import { rows, configured } from '@/lib/sheets';
import { consolidate } from '@/lib/consolidate';
export const runtime = 'nodejs';
export async function GET() {
  if (!verify((await cookies()).get('galileo_teacher')?.value, 'teacher'))
    return NextResponse.json({ error: 'Acceso docente requerido.' }, { status: 401 });
  if (!configured())
    return NextResponse.json(
      { error: 'Google Sheets todavía no está configurado.' },
      { status: 503 },
    );
  try {
    const [games, events] = await Promise.all([rows('Partidas'), rows('Eventos')]);
    return NextResponse.json(
      { games: consolidate(games, events), at: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          'No se pudieron actualizar los datos. La información anterior puede estar desactualizada.',
      },
      { status: 503 },
    );
  }
}
