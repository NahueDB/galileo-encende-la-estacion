'use client';
import Link from 'next/link';
import Brand from './Brand';
import Workshop from './Workshop';
import { useGame } from '@/lib/useGame';
import { DIAGNOSTIC_VERSION } from '@/lib/types';
import { diagnosticProfile } from '@/lib/diagnostic-profile';
import { diagnosticWorkshopModules } from '@/lib/diagnostic-levels';
import { downloadResults } from '@/lib/local';
export default function DiagnosticResults() {
  const { game, loaded, storageError, sync } = useGame(DIAGNOSTIC_VERSION);
  if (!loaded) return <main className="loading">Preparando el perfil…</main>;
  if (!game)
    return (
      <main className="loading">
        <p>No hay un diagnóstico en este equipo.</p>
        <Link href="/diagnostico">Ir al ingreso</Link>
      </main>
    );
  const profile = diagnosticProfile(game.events);
  const solved = profile.filter((mission) => mission.solved).length;
  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="pair-tag">
          {game.mode === 'demo' ? 'DEMO · ' : ''}Trabajo en pareja · {game.pair.join(' + ')}
        </span>
      </header>
      <main className="results panel diagnostic-results">
        <span className="eyebrow">
          {game.finished ? 'DIAGNÓSTICO CERRADO' : 'DIAGNÓSTICO EN CURSO'}
        </span>
        <h1>Lo que resolvieron en la estación.</h1>
        <p className="lead">
          {solved} de 8 misiones resueltas. Este perfil ayuda a reconocer qué afianzar y qué seguir
          practicando.
        </p>
        <Workshop mode="summary" completed={diagnosticWorkshopModules(game.completed)} />
        <p className="muted">
          El registro corresponde a la pareja. Resolver sin pistas registradas no acredita por sí
          solo dominio individual.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Misión y tema</th>
                <th>Resultado</th>
                <th>Intentos</th>
                <th>Pistas</th>
              </tr>
            </thead>
            <tbody>
              {profile.map((mission) => (
                <tr key={mission.id}>
                  <td>
                    <strong>
                      {mission.id}. {mission.title}
                    </strong>
                    <small>{mission.concept}</small>
                  </td>
                  <td>{mission.status}</td>
                  <td>{mission.attempts}</td>
                  <td>{mission.hints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Comprobaciones por misión</h2>
        <p className="muted">
          El historial conserva el primer intento y las ejecuciones posteriores. Los logros se
          mantienen al experimentar.
        </p>
        {profile
          .filter((mission) => mission.attempts > 0)
          .map((mission) => (
            <details key={mission.id} className="diagnostic-evidence">
              <summary>
                {mission.id}. {mission.title}
              </summary>
              {[
                ['Primer intento', mission.first],
                ['Última ejecución', mission.latest],
              ].map(([label, raw]) => {
                const value = typeof raw === 'object' ? raw : undefined;
                return (
                  <div key={String(label)}>
                    <h3>{String(label)}</h3>
                    <p>
                      {value?.pass
                        ? 'Respondió a todos los casos de prueba.'
                        : 'Quedaron aspectos por revisar.'}
                    </p>
                    {value?.error && <p className="error">{value.error}</p>}
                    <ul className="checks">
                      {value?.checks.map((check, i) => (
                        <li className={check.pass ? 'pass' : 'fail'} key={i}>
                          {check.pass ? '✓' : '○'} {check.label}
                          {check.detail && <small>{check.detail}</small>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </details>
          ))}
        <h2>Registro y guardado</h2>
        <p>
          {game.mode === 'demo'
            ? 'Modo demo: los resultados se guardan únicamente en este navegador y no se envían a Google Sheets.'
            : game.pending.length
              ? `Quedan ${game.pending.length} eventos pendientes de envío. Mantené esta página abierta para reintentar o descargá una copia.`
              : 'Todos los eventos locales recibieron confirmación del servidor.'}
        </p>
        {sync && <p className="muted">{sync}</p>}
        {storageError && (
          <p className="error" role="alert">
            El guardado local falló. Descargá una copia antes de cerrar.
          </p>
        )}
        <div className="result-actions">
          <button className="primary" onClick={() => downloadResults(game)}>
            Descargar resultados JSON ↓
          </button>
          <Link className="button" href="/diagnostico/jugar">
            Volver a las misiones
          </Link>
          <Link href="/diagnostico">Ir al ingreso</Link>
        </div>
        <p className="footnote">
          Volver a las misiones conserva el cierre y permite seguir explorando. La recuperación
          local funciona solo en este navegador y equipo.
        </p>
      </main>
    </>
  );
}
