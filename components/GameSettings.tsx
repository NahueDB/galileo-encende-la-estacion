'use client';
import { useGaliPreferences } from '@/lib/useGaliPreferences';
export default function GameSettings() {
  const { enabled, setEnabled } = useGaliPreferences();
  return (
    <details className="game-settings">
      <summary><span className="game-settings-icon" aria-hidden="true">⚙</span> Configuración</summary>
      <div>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Activar a Gali
        </label>
        <p>
          Mostrá u ocultá el personaje, sus diálogos y sus recorridos. Podés seguir consultando las
          pistas.
        </p>
      </div>
    </details>
  );
}
