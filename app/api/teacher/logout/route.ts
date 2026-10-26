import { NextResponse } from 'next/server';
import { sameOrigin } from '@/lib/auth';
export async function POST(req: Request) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
  const r = NextResponse.json({ ok: true });
  r.cookies.set('galileo_teacher', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return r;
}
