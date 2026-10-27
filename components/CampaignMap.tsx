'use client';
import { useEffect, useId, useState } from 'react';
import { getCampaignProgress } from '@/lib/campaign';
import type { Game } from '@/lib/types';

const labels = {
  approved: '✓ Aprobado',
  available: '○ Disponible',
  locked: '◇ Bloqueado',
} as const;
const shortNames = ['Localizador', 'Panel', 'Encendido', 'Marcha', 'Credencial', 'Validación'];

function StationIcon({ id }: { id: number }) {
  const drawings = [
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12V3M12 12l6-6" />
      <circle cx="8" cy="15" r="1" />
    </>,
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4M7 9h10M7 12h6" />
    </>,
    <>
      <path d="M12 3v8M7 5a8 8 0 1 0 10 0" />
    </>,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 8 5 4-5 4ZM16 8v8" />
    </>,
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M9 3h6v4H9zM14 11h4M14 15h4" />
      <circle cx="8" cy="12" r="2" />
      <path d="M5 17q3-4 6 0" />
    </>,
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
      <path d="m8 12 3 3 5-6" />
    </>,
  ];
  return (
    <svg
      className="station-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {drawings[id - 1]}
    </svg>
  );
}

export default function CampaignMap({ game }: { game: Game }) {
  const progress = getCampaignProgress(game);
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const preferenceKey = `galileo:map:${game.id}`;
  useEffect(() => {
    try {
      setExpanded(sessionStorage.getItem(preferenceKey) === 'expanded');
    } catch {
      /* La consulta sigue disponible sin almacenamiento. */
    }
  }, [preferenceKey]);
  function toggle() {
    const next = !expanded;
    setExpanded(next);
    try {
      sessionStorage.setItem(preferenceKey, next ? 'expanded' : 'compact');
    } catch {
      /* Se conserva la elección en memoria. */
    }
  }
  return (
    <section className="campaign-map" aria-label="Mapa de estaciones">
      <div className="campaign-heading">
        <h2>
          El recorrido de Gali <span>{progress.approvedCount} de 6 aprobadas</span>
        </h2>
        <button
          className="text-button campaign-toggle"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={toggle}
        >
          {expanded ? 'Contraer mapa' : 'Ver mapa completo'}{' '}
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
      </div>
      <ol className="campaign-stations" aria-label="Seis estaciones del taller">
        {progress.stations.map(({ level, state, isCurrent }, index) => (
          <li
            key={level.id}
            className={`campaign-station ${state}${isCurrent ? ' current' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {index < 5 && (
              <svg
                className={`campaign-connection${state === 'approved' ? ' energized' : ''}`}
                viewBox="0 0 100 2"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M0 1H100" />
              </svg>
            )}
            <div className="campaign-station-label">
              <span className="campaign-icon">
                <StationIcon id={level.id} />
              </span>
              <span className="campaign-station-name">
                <span className="campaign-number">{level.id}.</span> {shortNames[index]}
              </span>
            </div>
            <div className="campaign-station-status">
              {labels[state]}
              {isCurrent && <strong> · Estás acá</strong>}
            </div>
          </li>
        ))}
      </ol>
      <div id={detailsId} className="campaign-details" hidden={!expanded}>
        <p className="campaign-description">
          {progress.firstPending
            ? `Próximo objetivo: ${progress.firstPending.id} · ${progress.firstPending.title}. Aprobarlo habilita la siguiente estación.`
            : '¡Recorrido completo! Conservás los seis logros.'}{' '}
          Usá Continuar para avanzar.
        </p>
        <div className="campaign-objectives">
          {progress.stations.map(({ level }) => (
            <article key={level.id}>
              <h3>
                {level.id} · {level.title}
              </h3>
              <p className="campaign-concept">{level.concept}</p>
              <p>{level.objective}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
