'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Brand from './Brand';
import Workshop from './Workshop';
import CampaignMap from './CampaignMap';
import { levels, assemble } from '@/lib/levels';
import { parseCode } from '@/lib/parser';
import { frameSource } from '@/lib/frame';
import { addEvent, downloadResults } from '@/lib/local';
import { useGame } from '@/lib/useGame';
import { createId } from '@/lib/id';
import type { RunResult, Snapshot } from '@/lib/types';
const blank: Snapshot = {
  text: 'Ejecutá tu código para probar los controles.',
  value: '',
  selected: false,
  running: false,
};
export default function GameView() {
  const { game, update, loaded, storageError, sync } = useGame();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<RunResult | null>(null),
    [snapshot, setSnapshot] = useState<Snapshot>(blank),
    [preview, setPreview] = useState<{ id: string; src: string } | null>(null),
    [test, setTest] = useState<{ id: string; src: string } | null>(null),
    [feedback, setFeedback] = useState(''),
    [resetting, setResetting] = useState(false);
  const previewColumn = useRef<HTMLElement>(null);
  const [stickyPreview, setStickyPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null),
    testRef = useRef<HTMLIFrameElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRun = useRef<{ code: string; zones: string[]; level: number; ast: unknown } | null>(
    null,
  );
  const level = levels[(game?.level ?? 1) - 1];
  const zones = game?.codes[level.id] ?? level.zones.map((z) => z.initial);
  const approved = game?.completed.includes(level.id);
  const hints = game?.hints[level.id] ?? [];
  const modified = !!pendingRun.current && pendingRun.current.code !== assemble(level, zones);
  useEffect(() => {
    if (loaded && !game) router.replace('/');
  }, [loaded, game, router]);
  useEffect(() => {
    setResult(null);
    setPreview(null);
    setTest(null);
    setSnapshot(blank);
    setFeedback('');
    setResetting(false);
    pendingRun.current = null;
  }, [level.id]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const column = previewColumn.current;
    if (!column) return;
    const measure = () =>
      setStickyPreview(
        window.innerWidth >= 1100 &&
          window.innerHeight >= 700 &&
          column.getBoundingClientRect().height <= window.innerHeight - 24,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [!!game]);
  function finishRun(r: RunResult) {
    const run = pendingRun.current;
    if (!run) return;
    if (timer.current) clearTimeout(timer.current);
    setBusy(false);
    setTest(null);
    setResult(r);
    update((g) => {
      let v = addEvent(g, 'run', { result: r, code: run.code });
      if (r.pass && !v.completed.includes(run.level)) {
        v = { ...v, completed: [...v.completed, run.level] };
        v = addEvent(v, 'complete');
      }
      return v;
    });
    const id = createId();
    setPreview({
      id,
      src: frameSource(
        { id, html: levels[run.level - 1].html, ast: run.ast, level: run.level, testing: false },
        createId(),
      ),
    });
    setFeedback(
      r.pass
        ? 'Objetivo cumplido. La vista previa se reinició: probá los controles y observá el taller.'
        : r.error ||
            r.checks.find((c) => !c.pass)?.detail ||
            'Revisá las comprobaciones e intentá de nuevo.',
    );
  }
  useEffect(() => {
    function receive(event: MessageEvent) {
      const d = event.data;
      if (!d || d.channel !== 'galileo' || typeof d.id !== 'string' || event.origin !== 'null')
        return;
      if (
        test &&
        event.source === testRef.current?.contentWindow &&
        d.id === test.id &&
        d.kind === 'result'
      ) {
        if (
          !d.result ||
          typeof d.result.pass !== 'boolean' ||
          !Array.isArray(d.result.checks) ||
          d.result.checks.length > 30
        )
          return;
        finishRun(d.result);
      }
      if (preview && event.source === previewRef.current?.contentWindow && d.id === preview.id) {
        if (
          d.kind === 'snapshot' &&
          d.snapshot &&
          typeof d.snapshot.text === 'string' &&
          typeof d.snapshot.running === 'boolean' &&
          typeof d.snapshot.selected === 'boolean'
        )
          setSnapshot({
            ...d.snapshot,
            text: d.snapshot.text.slice(0, 4000),
            value: String(d.snapshot.value ?? '').slice(0, 4000),
          });
        if (d.kind === 'error' && typeof d.error === 'string')
          setFeedback('Error en la vista previa: ' + d.error.slice(0, 1000));
      }
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  });
  function execute() {
    if (busy) return;
    setResult(null);
    setPreview(null);
    setSnapshot(blank);
    setFeedback('');
    update((g) => ({
      ...g,
      attempts: { ...g.attempts, [level.id]: (g.attempts[level.id] ?? 0) + 1 },
    }));
    const code = assemble(level, zones);
    try {
      const ast = parseCode(code, level);
      pendingRun.current = { code, zones, level: level.id, ast };
      setBusy(true);
      const id = createId();
      setTest({
        id,
        src: frameSource({ id, html: level.html, ast, level: level.id, testing: true }, createId()),
      });
      timer.current = setTimeout(
        () =>
          finishRun({
            pass: false,
            checks: [],
            error:
              'La ejecución no respondió a tiempo. Volvé a intentar; revisá las restricciones del código.',
          }),
        6000,
      );
    } catch (e) {
      const error = e instanceof Error ? e.message : 'No se pudo interpretar el código.';
      const r = { pass: false, checks: [], error };
      setResult(r);
      setFeedback(error);
      pendingRun.current = null;
      update((g) => addEvent(g, 'run', { result: r, code }));
    }
  }
  function edit(i: number, value: string) {
    update((g) => {
      const codes = [...(g.codes[level.id] ?? level.zones.map((z) => z.initial))];
      codes[i] = value;
      return { ...g, codes: { ...g.codes, [level.id]: codes } };
    });
  }
  function hint() {
    const n = hints.length + 1;
    if (n > 3) return;
    update((g) =>
      addEvent({ ...g, hints: { ...g.hints, [level.id]: [...hints, n] } }, 'hint', { hint: n }),
    );
  }
  function next() {
    if (!approved) return;
    if (level.id === 6) {
      update((g) => (g.finished ? g : addEvent({ ...g, finished: true }, 'finish')));
      router.push('/resultado');
    } else update((g) => addEvent({ ...g, level: g.level + 1 }, 'enter'));
  }
  const editorActions = (placement: 'desktop' | 'mobile') => (
    <div className={`editor-actions ${placement}`}>
      <button
        className="primary"
        onClick={execute}
        aria-disabled={busy}
        aria-controls="run-feedback"
      >
        {busy ? 'Probando…' : '▷ Ejecutar y comprobar'}
      </button>
      <button
        className="text-button"
        onClick={() => {
          if (zones.some((z, i) => z !== level.zones[i].initial)) setResetting(true);
        }}
      >
        Reiniciar código
      </button>
      <span className="feedback-location">
        Resultado en <a href="#run-feedback">Devolución ↓</a> ·{' '}
        <a href="#station-help">Consultar pistas ↓</a>
      </span>
    </div>
  );
  if (!game) return <main className="loading">Preparando el puesto…</main>;
  return (
    <>
      <header className="topbar game-topbar">
        <Brand />
        <span className="pair-tag">
          {game.mode === 'demo' ? 'DEMO · ' : ''}
          {game.pair.join(' + ')}
        </span>
      </header>
      <main className="game-main" data-level={level.id}>
        <div className="game-title">
          <div>
            <span className="eyebrow">
              MISIÓN {String(level.id).padStart(2, '0')} / {level.concept}
            </span>
            <h1>{level.title}</h1>
          </div>
          <button className="text-button" onClick={() => downloadResults(game)}>
            Descargar resultados ↓
          </button>
        </div>
        <CampaignMap game={game} />
        <div className="game-grid">
          <section className="panel code-panel">
            <div className="objective">
              <span className="section-index">01</span>
              <div>
                <h2>Tu objetivo</h2>
                <p>{level.objective}</p>
              </div>
            </div>
            <details className="html-reference" key={level.id} open={level.id === 1}>
              <summary>
                index.html <span>HTML de referencia</span>
              </summary>
              <pre>
                <code>{level.html}</code>
              </pre>
            </details>
            <div className="editor-workspace">
              <div className="editor-header">
                <strong>app.js</strong>
                <span>JavaScript vanilla</span>
              </div>
              {editorActions('desktop')}
              <div className="code-editor" id="station-editor">
                {level.prefix && (
                  <pre className="fixed-code">
                    <code>{level.prefix}</code>
                  </pre>
                )}
                {level.zones.map((zone, i) => (
                  <div key={i}>
                    <label className="zone-label" htmlFor={'zone-' + i}>
                      {zone.label}
                    </label>
                    <textarea
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      id={'zone-' + i}
                      aria-label={zone.label}
                      rows={zone.rows}
                      value={zones[i]}
                      maxLength={10000}
                      onChange={(e) => edit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                          e.preventDefault();
                          const el = e.currentTarget;
                          const start = el.selectionStart;
                          edit(
                            i,
                            el.value.slice(0, start) + '  ' + el.value.slice(el.selectionEnd),
                          );
                          requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
                        }
                        if (e.key === 'Escape') e.currentTarget.blur();
                      }}
                    />
                    {level.joins?.[i] && (
                      <pre className="fixed-code">
                        <code>{level.joins[i]}</code>
                      </pre>
                    )}
                  </div>
                ))}
                {level.suffix && (
                  <pre className="fixed-code">
                    <code>{level.suffix}</code>
                  </pre>
                )}
              </div>
              {editorActions('mobile')}
            </div>
            {resetting && (
              <div className="confirm" role="alert">
                <p>Se descartarán los cambios de este nivel. El logro aprobado se conserva.</p>
                <button
                  onClick={() => {
                    update((g) => ({
                      ...g,
                      codes: { ...g.codes, [level.id]: level.zones.map((z) => z.initial) },
                    }));
                    setResetting(false);
                    setResult(null);
                    setPreview(null);
                    setSnapshot(blank);
                    pendingRun.current = null;
                  }}
                >
                  Sí, reiniciar
                </button>
                <button onClick={() => setResetting(false)}>Cancelar</button>
              </div>
            )}
          </section>
          <section className="preview-column" ref={previewColumn} data-sticky={stickyPreview}>
            <div className="panel world-panel">
              <div className="panel-heading">
                <span className="section-index">02</span>
                <div>
                  <h2>Probá tu programa</h2>
                  <p>El HTML responde. El taller lo representa.</p>
                </div>
              </div>
              <Workshop
                fitToPanel
                snapshot={snapshot}
                mood={
                  result?.pass ? 'celebrate' : hints.length ? 'help' : busy ? 'attention' : 'wait'
                }
              />
              {snapshot.text.startsWith('Estación asignada a ') && (
                <div className="operator-badge">
                  <span>PERSONA RESPONSABLE</span>
                  <strong>{snapshot.text.slice('Estación asignada a '.length)}</strong>
                </div>
              )}
              <div className="preview-header">
                <strong>Vista previa · DOM real</strong>
                <span>{preview ? 'Lista para probar' : 'Esperando ejecución'}</span>
              </div>
              {preview ? (
                <iframe
                  key={preview.id}
                  ref={previewRef}
                  title="Controles HTML de la estación"
                  sandbox="allow-scripts"
                  srcDoc={preview.src}
                  className="exercise-frame"
                />
              ) : (
                <div className="preview-empty">
                  Completá el código y elegí «Ejecutar y comprobar» para activar esta vista.
                </div>
              )}
              <div className="observed" aria-live="polite">
                <span className="status-dot" />
                <span>
                  {snapshot.text}
                  {snapshot.selected ? ' · Estación localizada' : ''}
                </span>
              </div>
            </div>
            <div
              id="run-feedback"
              className={'panel feedback ' + (result?.pass ? 'success' : busy ? 'checking' : '')}
              aria-live="polite"
            >
              <span className="feedback-label">DEVOLUCIÓN</span>
              <h2>
                {result?.pass
                  ? '✓ Objetivo cumplido'
                  : result
                    ? 'Revisemos el programa'
                    : busy
                      ? 'Comprobando el programa…'
                      : 'Un paso a la vez'}
              </h2>
              <p>
                {feedback ||
                  'Leé el objetivo, completá el código y ejecutá. Vamos a probar el comportamiento con distintas acciones.'}
              </p>
              {result?.checks?.length ? (
                <details
                  className="check-details"
                  key={game.attempts[level.id]}
                  open={!result.pass}
                >
                  <summary>Ver {result.checks.length} comprobaciones</summary>
                  <ul className="checks">
                    {result.checks.map((c, i) => (
                      <li key={i} className={c.pass ? 'pass' : 'fail'}>
                        {c.pass ? '✓' : '○'} {c.label}
                        {!c.pass && c.detail && <small>{c.detail}</small>}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {approved && (
                <>
                  <p className="achievement">
                    Nivel aprobado y conservado.
                    {modified
                      ? ' Tenés cambios sin ejecutar.'
                      : result && !result.pass
                        ? ' Esta nueva prueba todavía necesita ajustes.'
                        : ' Podés seguir experimentando.'}
                  </p>
                  {[2, 4].includes(level.id) && (
                    <p className="role-swap">
                      ⇄ Antes de continuar, intercambien roles: quien revisaba ahora escribe.
                    </p>
                  )}
                  <button className="primary full" disabled={busy} onClick={next}>
                    {level.id === 6 ? 'Finalizar misión →' : 'Continuar al siguiente nivel →'}
                  </button>
                </>
              )}
            </div>
          </section>
          <section className="panel learning-support" id="station-help" aria-label="Pistas y ayuda">
            <details className="restrictions">
              <summary>Cómo funciona el editor y el entorno</summary>
              <p>
                Escribís JavaScript para elementos HTML reales. Esta campaña interpreta variables,
                funciones, condicionales, cadenas y las APIs de DOM indicadas. No admite bucles,
                importaciones, red ni otras APIs. Cada ejecución tiene un límite de operaciones. El
                entorno se reconstruye al ejecutar.
              </p>
              <p>
                Tab agrega dos espacios. Shift + Tab permite salir hacia atrás; Escape quita el
                foco. En un proyecto propio, guardarías este código en app.js y lo cargarías con
                &lt;script src="app.js" defer&gt;.
              </p>
            </details>
            <div className="help-area">
              <div>
                <strong>¿Necesitás una pista?</strong>
                <span className="muted"> Sin penalización</span>
              </div>
              {hints.map((n) => (
                <p className="hint" key={n}>
                  <strong>{n}/3</strong> {level.hints[n - 1]}
                </p>
              ))}
              <button className="secondary" onClick={hint} disabled={hints.length === 3}>
                {hints.length === 3
                  ? 'Ya consultaste las tres pistas'
                  : `Ver pista ${hints.length + 1} de 3`}
              </button>
            </div>
            <a className="help-return" href="#station-editor">
              Volver al código ↑
            </a>
          </section>
        </div>
        <footer className="game-footer">
          <Link href="/">← Volver al ingreso</Link>
          <span role="status">
            {storageError
              ? 'No pudimos guardar en este equipo. Descargá los resultados ahora.'
              : game.mode === 'demo'
                ? 'DEMO · Guardado solo en este equipo'
                : game.pending.length
                  ? `${game.pending.length} eventos pendientes · ${sync}`
                  : 'Sin eventos pendientes de envío · ' + sync}
          </span>
        </footer>
      </main>
      {test && (
        <iframe
          key={test.id}
          ref={testRef}
          title="Comprobaciones automáticas aisladas"
          sandbox="allow-scripts"
          srcDoc={test.src}
          className="test-frame"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </>
  );
}
