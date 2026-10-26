import { createHmac, timingSafeEqual } from 'node:crypto';
export type Claims = {
  role: 'teacher' | 'pair';
  exp: number;
  gameId?: string;
  pair?: [string, string];
  course?: string;
};
function secret() {
  const s = process.env.SESSION_SIGNING_SECRET;
  if (!s || s.length < 32)
    throw new Error('Configurá SESSION_SIGNING_SECRET con al menos 32 caracteres.');
  return s;
}
export function sign(claims: Omit<Claims, 'exp'>, hours = 12) {
  const body = Buffer.from(
    JSON.stringify({ ...claims, exp: Date.now() + hours * 3600000 }),
  ).toString('base64url');
  return body + '.' + createHmac('sha256', secret()).update(body).digest('base64url');
}
export function verify(token: string | undefined, role: Claims['role']): Claims | null {
  try {
    if (!token || token.length > 2000) return null;
    const [body, sig, ...extra] = token.split('.');
    if (extra.length || !sig) return null;
    const expected = createHmac('sha256', secret()).update(body).digest();
    const actual = Buffer.from(sig, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const c = JSON.parse(Buffer.from(body, 'base64url').toString());
    return c.role === role && c.exp > Date.now() ? c : null;
  } catch {
    return null;
  }
}
export function equalSecret(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      parsed.host === (request.headers.get('host') || new URL(request.url).host)
    );
  } catch {
    return false;
  }
}
