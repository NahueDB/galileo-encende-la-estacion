'use client';
import { galiPlaces, type GaliTarget } from '@/lib/gali-dialogue';
import type { GaliController } from '@/lib/useGali';
import { useMotionPreferences } from '@/lib/useMotionPreferences';
export default function GaliDialogue({
  gali,
  touring = false,
}: {
  gali: GaliController;
  touring?: boolean;
}) {
  const motion = useMotionPreferences();
  return (
    <div className="gali-dialogue" data-message-kind={gali.message?.kind} data-open={gali.open}>
      <div className="gali-toolbar">
        <strong>
          <span aria-hidden="true">◉</span> GALI
        </strong>
        <button className="text-button" onClick={gali.open ? gali.close : gali.reopen}>
          {gali.open ? 'Cerrar ayuda de Gali' : 'Hablar con Gali'}
        </button>
        <button
          className="text-button gali-tour"
          onClick={() => (touring ? gali.close() : gali.visit('map', true))}
        >
          {touring ? 'Detener recorrido' : 'Recorrer la estación'}
        </button>
        <details className="gali-places">
          <summary>Ir a…</summary>
          <nav aria-label="Lugares para visitar con Gali">
            {Object.entries(galiPlaces).map(([key, place]) => (
              <button
                key={key}
                className="text-button"
                onClick={(e) => {
                  e.currentTarget.closest('details')?.removeAttribute('open');
                  gali.visit(key as GaliTarget);
                }}
              >
                {place.label}
              </button>
            ))}
          </nav>
        </details>
        <details className="gali-settings">
          <summary aria-label="Preferencias de Gali">⚙</summary>
          <div>
            <label>
              <input
                type="checkbox"
                checked={gali.less}
                onChange={(e) => gali.setLess(e.target.checked)}
              />{' '}
              Menos intervenciones
            </label>
            <label>
              <input
                type="checkbox"
                checked={motion.userReduced}
                onChange={(e) => motion.setUserReduced(e.target.checked)}
              />{' '}
              Animaciones reducidas
            </label>
            {motion.systemReduced && (
              <small>El sistema tiene el movimiento reducido activado.</small>
            )}
          </div>
        </details>
      </div>
      {gali.open && (
        <p className="gali-bubble" aria-live="polite" aria-atomic="true" key={gali.message?.id}>
          {gali.message?.module ? (
            <>
              <strong className="module-recovery" data-recovery-token={gali.message.module.token}>
                {gali.message.module.label}
              </strong>
              {gali.message.text.slice(gali.message.module.label.length)}
            </>
          ) : (
            gali.message?.text
          )}
        </p>
      )}
    </div>
  );
}
