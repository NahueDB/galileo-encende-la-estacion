import { NextResponse } from 'next/server';
import { sign, equalSecret, sameOrigin } from '@/lib/auth';
import { readBody } from '@/lib/validation';
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
  try {
    const data = await readBody(req, 2000);
    const secret = process.env.TEACHER_ACCESS_SECRET;
    if (
      !secret ||
      secret.length < 16 ||
      typeof data.secret !== 'string' ||
      !equalSecret(data.secret, secret)
    )
      return NextResponse.json({ error: 'Acceso no válido o sin configurar.' }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set('galileo_teacher', sign({ role: 'teacher' }, 8), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 3600,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'No se pudo iniciar la sesión docente.' }, { status: 400 });
  }
}
