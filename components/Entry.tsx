'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from './Brand';
import Workshop from './Workshop';
import { addEvent, createGame, loadGame, storeGame, downloadResults } from '@/lib/local';
import type { Game } from '@/lib/types';
export default function Entry() {
  const router = useRouter();
  const [saved, setSaved] = useState<Game | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newGame, setNewGame] = useState(false);
  useEffect(() => {
    setSaved(loadGame());
    fetch('/api/session')
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, []);
  function begin(game: Game) {
    if (!storeGame(addEvent(game, 'start'))) {
      setError(
        'No se pudo guardar en este navegador. Habilitá el almacenamiento local antes de comenzar.',
      );
      return;
    }
    router.push('/jugar');
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    const pair: [string, string] = [
      String(data.get('first')).trim(),
      String(data.get('second')).trim(),
    ];
    if (pair[0] === pair[1]) {
      setError('Los dos códigos de la pareja deben ser distintos.');
      setBusy(false);
      return;
    }
    try {
      const r = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: String(data.get('activity')).trim(), pair }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      begin(createGame(pair, 'real', d));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="topbar">
        <Brand />
      </header>
      <main className="entry-grid">
        <section className="entry-copy">
          <span className="eyebrow">MISIÓN DOM / 7.º AÑO</span>
          <h1>
            Encendé
            <br />
            la estación<span className="cyan">.</span>
          </h1>
          <p className="lead">El taller está listo. Solo falta tu código.</p>
          <p className="muted">
            Programen en pareja, prueben sus ideas y pongan en marcha el taller de Galileo. Seis
            desafíos para conectar JavaScript con el mundo de la página.
          </p>
          <div className="mission-tags">
            <span>01—06 desafíos</span>
            <span>En pareja</span>
            <span>A tu ritmo</span>
          </div>
          <Workshop large mood="attention" />
          <p className="footnote">
            E.E.S.T. N.º 5 «Galileo Galilei» · Práctica formativa de JavaScript
          </p>
        </section>
        <section className="entry-form panel">
          <span className="eyebrow">PREPAREN SU PUESTO</span>
          <h2>Ingresá con tu pareja</h2>
          <p className="muted">
            Una persona escribe y la otra revisa. Van a intercambiar roles durante la misión.
          </p>
          {saved && !newGame ? (
            <div className="resume">
              <h3>Hay una partida en este equipo</h3>
              <p>
                {saved.pair.join(' + ')} · {saved.mode === 'demo' ? 'Demo' : 'En pareja'} · Nivel{' '}
                {saved.level}
              </p>
              <button
                className="primary"
                onClick={() => router.push(saved.finished ? '/resultado' : '/jugar')}
              >
                Continuar partida →
              </button>
              <button onClick={() => downloadResults(saved)}>Descargar esa partida</button>
              <button className="text-button" onClick={() => setNewGame(true)}>
                Iniciar otra partida
              </button>
              <p className="footnote">Elegí continuar solo si esta partida les pertenece.</p>
            </div>
          ) : (
            <>
              <form onSubmit={submit}>
                <label htmlFor="activity">Código de actividad</label>
                <input
                  id="activity"
                  name="activity"
                  required
                  maxLength={32}
                  placeholder="Código que les dio el docente"
                  autoComplete="off"
                />
                <div className="pair-fields">
                  <div>
                    <label htmlFor="first">Tu código</label>
                    <input
                      id="first"
                      name="first"
                      required
                      maxLength={32}
                      placeholder="Estudiante 1"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="second">Código de tu pareja</label>
                    <input
                      id="second"
                      name="second"
                      required
                      maxLength={32}
                      placeholder="Estudiante 2"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <button className="primary full" disabled={busy || configured !== true}>
                  {busy ? 'Conectando…' : 'Comenzar misión →'}
                </button>
              </form>
              <p className="config-notice">
                {configured === null
                  ? 'Comprobando registro remoto…'
                  : configured
                    ? 'Los códigos se validan en el servidor. Los resultados se asocian a ambos integrantes.'
                    : 'Google Sheets no está configurado. Por ahora, podés explorar el modo demo con guardado solo en este equipo.'}
              </p>
              <div className="divider" />
              <button
                className="secondary full"
                onClick={() => begin(createGame(['DEMO-01', 'DEMO-02'], 'demo'))}
              >
                Explorar en modo demo ↗
              </button>
              <p className="footnote">Códigos ficticios · Sin envío de datos reales</p>
              {saved && newGame && (
                <button className="text-button" onClick={() => setNewGame(false)}>
                  Volver a la partida anterior
                </button>
              )}
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="form-bottom">
            <span className="status-dot on" /> Las pistas están para ayudar. Usalas sin
            penalización.
          </div>
        </section>
      </main>
    </>
  );
}
