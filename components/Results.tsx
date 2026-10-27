'use client';
import Link from 'next/link';
import { useGame } from '@/lib/useGame';
import { downloadResults } from '@/lib/local';
import Brand from './Brand';
import Workshop from './Workshop';
import { getWorkshopProgress } from '@/lib/workshop-progress';
export default function Results() {
  const { game, loaded, storageError, sync } = useGame();
  if (!loaded) return <p className="loading">Cargando resultados…</p>;
  if (!game)
    return (
      <main className="loading">
        <p>No hay una partida en este equipo.</p>
        <Link href="/">Volver al ingreso</Link>
      </main>
    );
  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="pair-tag">Trabajo en pareja · {game.pair.join(' + ')}</span>
      </header>
      <main className="results panel">
        <span className="eyebrow">{game.finished ? 'MISIÓN COMPLETA' : 'MISIÓN EN CURSO'}</span>
        <h1>{game.finished ? 'El taller está en tus manos.' : 'Tu recorrido en Galileo'}</h1>
        <p className="lead">
          {getWorkshopProgress(game.completed).recoveredCount} de 6 objetivos aprobados. Cada prueba
          fue una oportunidad para aprender.
        </p>
        <Workshop mode="summary" completed={game.completed} />
        <div className="result-concepts">
          {[
            'Seleccionar elementos',
            'Modificar textContent',
            'Escuchar eventos',
            'Definir funciones',
            'Leer value en cada clic',
            'Validar con trim() y limpiar',
          ].map((t, i) => (
            <span key={t}>
              {game.completed.includes(i + 1) ? '✓' : '○'} {t}
            </span>
          ))}
        </div>
        <h2>Registro de la práctica</h2>
        <p>
          {game.mode === 'demo'
            ? 'Modo demo: estos resultados ficticios solo están guardados en este navegador. No se enviaron a Google Sheets.'
            : game.pending.length
              ? `Quedan ${game.pending.length} eventos pendientes. Mantené esta página abierta para reintentar o descargá una copia.`
              : 'Todos los eventos locales recibieron confirmación del servidor.'}
        </p>
        {sync && <p className="muted">{sync}</p>}
        {storageError && (
          <p className="error">El guardado local falló. Descargá una copia antes de cerrar.</p>
        )}
        <p className="muted">
          {game.events.filter((e) => e.type === 'run').length} ejecuciones ·{' '}
          {game.events.filter((e) => e.type === 'hint').length} pistas consultadas, sin
          penalización. El registro corresponde a ambos integrantes y no genera notas individuales.
        </p>
        <div className="result-actions">
          <button className="primary" onClick={() => downloadResults(game)}>
            Descargar resultados JSON ↓
          </button>
          <Link className="button" href="/jugar">
            Volver al taller
          </Link>
          <Link href="/">Ir al ingreso</Link>
        </div>
        <p className="footnote">
          La recuperación local funciona únicamente en este navegador y este equipo.
        </p>
      </main>
    </>
  );
}
