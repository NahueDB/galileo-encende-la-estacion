'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from './Brand';
import type { consolidate } from '@/lib/consolidate';
type Summary = ReturnType<typeof consolidate>[number];
const date = (s: string) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(s));
export default function Teacher({ authenticated }: { authenticated: boolean }) {
  const router = useRouter();
  const [games, setGames] = useState<Summary[]>([]),
    [error, setError] = useState(''),
    [at, setAt] = useState(''),
    [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    try {
      const r = await fetch('/api/teacher', {
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setGames(d.games);
      setAt(d.at);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!authenticated) return;
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [authenticated]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = e.currentTarget;
    try {
      const secret = String(new FormData(form).get('secret'));
      const r = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      form.reset();
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ingresar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="pair-tag">SEGUIMIENTO DOCENTE</span>
      </header>
      <main className="teacher-main">
        {!authenticated ? (
          <section className="panel login-panel">
            <span className="eyebrow">ACCESO PROTEGIDO</span>
            <h1>El taller, de un vistazo.</h1>
            <p className="muted">Ingresá la clave docente configurada en el servidor.</p>
            <form onSubmit={login}>
              <label htmlFor="secret">Clave docente</label>
              <input
                id="secret"
                name="secret"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
              <button className="primary" disabled={busy}>
                Ingresar
              </button>
            </form>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        ) : (
          <>
            <div className="game-title">
              <div>
                <span className="eyebrow">GALILEO / PRÁCTICA FORMATIVA</span>
                <h1>Parejas en el taller</h1>
              </div>
              <div className="teacher-actions">
                <button onClick={refresh} disabled={busy}>
                  {busy ? 'Actualizando…' : 'Actualizar ahora'}
                </button>
                <button
                  className="text-button"
                  onClick={async () => {
                    await fetch('/api/teacher/logout', { method: 'POST' });
                    router.refresh();
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
            <p className="muted">
              Actualización cada 15 segundos. El último evento recibido indica actividad registrada,
              no conexión actual. Horarios de Argentina.
            </p>
            {error && (
              <p role="alert" className="error">
                {error} {at ? 'Los datos visibles pueden estar desactualizados.' : ''}
              </p>
            )}
            <div className="table-wrap panel">
              <table>
                <thead>
                  <tr>
                    {[
                      'Pareja',
                      'Curso',
                      'Nivel',
                      'Aprobados',
                      'Intentos',
                      'Pistas',
                      'Último registro',
                      'Estado',
                    ].map((t) => (
                      <th key={t}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.pair.join(' + ')}</strong>
                        <small>{g.id.slice(0, 8)} · En pareja</small>
                      </td>
                      <td>{g.course}</td>
                      <td>{g.level}/6</td>
                      <td>{g.completed.length}/6</td>
                      <td>{g.attempts}</td>
                      <td>{g.hints}</td>
                      <td>{date(g.last)}</td>
                      <td>
                        <span className={g.finished ? 'badge-done' : 'badge-progress'}>
                          {g.finished ? 'Finalizada' : 'En curso'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!games.length && !error && (
                <p className="empty-table">
                  Todavía no hay partidas reales registradas. Las demos no aparecen aquí.
                </p>
              )}
            </div>
            <p className="footnote">
              {at
                ? 'Última consulta confirmada: ' + date(at)
                : 'Esperando una consulta confirmada.'}{' '}
              · Los intentos repetidos de envío se consolidan por identificador de evento.
            </p>
          </>
        )}
      </main>
    </>
  );
}
