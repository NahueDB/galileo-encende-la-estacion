'use client';
import { useRef, useState } from 'react';
import { parseDiagnosticImport } from '@/lib/diagnostic-import';

export default function DiagnosticImport({
  disabled,
  onImport,
}: {
  disabled: boolean;
  onImport: (codes: Record<number, string[]>) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Record<number, string[]> | null>(null);
  const [message, setMessage] = useState('');
  return (
    <details className="diagnostic-import">
      <summary className="diagnostic-import-summary">Importar respuestas desde VS Code</summary>
      <div className="diagnostic-import-content">
      <div className="diagnostic-import-bar">
        <button className="text-button" disabled={disabled} onClick={() => input.current?.click()}>
          Importar desde VS Code ↑
        </button>
        <span>Elegí el archivo de respuestas que exportaste del proyecto local.</span>
      </div>
      <input
        ref={input}
        hidden
        type="file"
        accept=".json,application/json"
        aria-label="Archivo de respuestas de VS Code"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          setDraft(null);
          setMessage('');
          if (!file) return;
          try {
            if (file.size > 100000) throw new Error('El archivo supera el tamaño permitido.');
            setDraft(parseDiagnosticImport(await file.text()));
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo leer el archivo.');
          }
        }}
      />
      {draft && (
        <section className="panel diagnostic-import-confirm" aria-label="Confirmar importación">
          <h2>Revisá antes de importar</h2>
          <p>
            Se reemplazarán los borradores de las ocho misiones. El historial, las pistas y los
            logros se conservan.
          </p>
          <p>
            Después, ejecutá cada misión para comprobarla y registrar sus respuestas en la sesión de
            tu pareja.
          </p>
          <p className="muted">
            Las pruebas realizadas en VS Code no se suman al historial de intentos del juego.
          </p>
          <button
            className="primary"
            disabled={disabled}
            onClick={() => {
              onImport(draft);
              setDraft(null);
              setMessage(
                'Borradores importados. Ejecutá cada misión para comprobarla y registrar su respuesta.',
              );
            }}
          >
            Importar los ocho borradores
          </button>
          <button onClick={() => setDraft(null)}>Cancelar</button>
        </section>
      )}
      {message && (
        <p className="config-notice" role="status">
          {message}
        </p>
      )}
      </div>
    </details>
  );
}
