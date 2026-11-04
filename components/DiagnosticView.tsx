'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Brand from './Brand';
import DiagnosticImport from './DiagnosticImport';
import Workshop from './Workshop';
import GaliCompanion from './GaliCompanion';
import { useGali } from '@/lib/useGali';
import { useMotionPreferences } from '@/lib/useMotionPreferences';
import { diagnosticLevels, diagnosticWorkshopModules } from '@/lib/diagnostic-levels';
import { assemble } from '@/lib/levels';
import { parseCode } from '@/lib/parser';
import { frameSource } from '@/lib/frame';
import { useGame } from '@/lib/useGame';
import { addEvent, downloadResults } from '@/lib/local';
import { createId } from '@/lib/id';
import { DIAGNOSTIC_VERSION, type RunResult, type Snapshot } from '@/lib/types';
import type { ModuleRecovery } from '@/lib/workshop-recovery';

const blank: Snapshot = {
  text: 'Completá el código y ejecutá para ver el resultado.',
  value: '',
  selected: false,
  running: false,
};
type Frame = { id: string; src: string };
type Pending = { id: string; level: number; code: string; ast?: unknown; attempt: number };
export default function DiagnosticView() {
  const { game, loaded, update, storageError, sync } = useGame(DIAGNOSTIC_VERSION);
  const router = useRouter();
  const motion = useMotionPreferences();
  const level = diagnosticLevels.find((level) => level.id === game?.level) ?? diagnosticLevels[0];
  const zones = game?.codes[level.id] ?? level.zones.map((zone) => zone.initial);
  const approved = !!game?.completed.includes(level.id);
  const gali = useGali(game ? game.id + ':' + level.id : '', level, approved);
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<RunResult | null>(null);
  const [test, setTest] = useState<Frame | null>(null),
    [preview, setPreview] = useState<Frame | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(blank);
  const [recovery, setRecovery] = useState<ModuleRecovery | null>(null);
  const [companionActive, setCompanionActive] = useState(false);
  const [resetting, setResetting] = useState(false),
    [closing, setClosing] = useState(false);
  const [testedCode, setTestedCode] = useState<string | null>(null);
  const testRef = useRef<HTMLIFrameElement>(null),
    previewRef = useRef<HTMLIFrameElement>(null);
  const pending = useRef<Pending | null>(null),
    previewId = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const main = useRef<HTMLElement>(null),
    map = useRef<HTMLDivElement>(null),
    editor = useRef<HTMLDivElement>(null);
  const executeAnchor = useRef<HTMLButtonElement>(null),
    workshop = useRef<HTMLDivElement>(null);
  const objective = useRef<HTMLDivElement>(null),
    html = useRef<HTMLDetailsElement>(null),
    help = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null),
    navigated = useRef(false);
  const anchors = useMemo(
    () => ({ main, map, editor, execute: executeAnchor, workshop, objective, html, help }),
    [],
  );
  const hints = game?.hints[level.id] ?? [];
  function cancelRun() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    previewId.current = null;
  }
  useEffect(() => {
    if (loaded && !game) router.replace('/diagnostico');
  }, [loaded, game, router]);
  useEffect(() => {
    cancelRun();
    setBusy(false);
    setResult(null);
    setTest(null);
    setPreview(null);
    setSnapshot(blank);
    setRecovery(null);
    setResetting(false);
    setClosing(false);
    setTestedCode(null);
    if (navigated.current) {
      heading.current?.focus();
      navigated.current = false;
    }
    return cancelRun;
  }, [level.id]);
  useEffect(() => {
    if (motion.reduced) setRecovery((cue) => (cue ? { ...cue, animate: false } : null));
  }, [motion.reduced]);
  function finishRun(value: RunResult, id: string) {
    const run = pending.current;
    if (!run || run.id !== id) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    setBusy(false);
    setTest(null);
    setResult(value);
    setTestedCode(run.code);
    gali.result(id, value, value.pass && !approved);
    if (value.pass && game && !approved) {
      const before = diagnosticWorkshopModules(game.completed);
      const added = diagnosticWorkshopModules([...game.completed, run.level]).find(
        (id) => !before.includes(id),
      );
      if (added)
        setRecovery({
          id: added,
          token: id,
          startedAt: performance.now(),
          animate: !motion.reduced && !document.hidden,
        });
    }
    update((g) => {
      if (g.level !== run.level) return g;
      let v = addEvent(g, 'run', {
        level: run.level,
        attempt: run.attempt,
        result: value,
        code: run.code,
      });
      if (value.pass && !v.completed.includes(run.level))
        v = addEvent({ ...v, completed: [...v.completed, run.level] }, 'complete');
      return v;
    });
    if (run.ast) {
      const id = createId();
      previewId.current = id;
      setPreview({
        id,
        src: frameSource(
          {
            id,
            html: diagnosticLevels[run.level - 1].html,
            ast: run.ast,
            level: run.level,
            testing: false,
            version: DIAGNOSTIC_VERSION,
          },
          createId(),
        ),
      });
    }
  }
  useEffect(() => {
    function receive(event: MessageEvent) {
      const data = event.data;
      if (event.origin !== 'null' || data?.channel !== 'galileo' || typeof data.id !== 'string')
        return;
      if (
        data.id === pending.current?.id &&
        event.source === testRef.current?.contentWindow &&
        data.kind === 'result'
      ) {
        if (
          typeof data.result?.pass !== 'boolean' ||
          !Array.isArray(data.result.checks) ||
          data.result.checks.length > 30
        )
          return;
        finishRun(data.result, data.id);
      }
      if (data.id === previewId.current && event.source === previewRef.current?.contentWindow) {
        if (
          data.kind === 'snapshot' &&
          typeof data.snapshot?.text === 'string' &&
          typeof data.snapshot.running === 'boolean'
        )
          setSnapshot({
            text: data.snapshot.text.slice(0, 4000),
            value: String(data.snapshot.value ?? '').slice(0, 4000),
            selected: false,
            running: data.snapshot.running,
          });
        if (data.kind === 'error' && typeof data.error === 'string')
          gali.previewError(data.id, data.error.slice(0, 1000));
      }
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  });
  function execute() {
    if (!game || pending.current) return;
    const id = createId(),
      code = assemble(level, zones),
      attempt = (game.attempts[level.id] ?? 0) + 1;
    pending.current = { id, code, level: level.id, attempt };
    previewId.current = null;
    setBusy(true);
    setResult(null);
    setPreview(null);
    setSnapshot(blank);
    setRecovery(null);
    update((g) => ({ ...g, attempts: { ...g.attempts, [level.id]: attempt } }));
    gali.start(id);
    try {
      const ast = parseCode(code, level);
      pending.current.ast = ast;
      setTest({
        id,
        src: frameSource(
          {
            id,
            html: level.html,
            ast,
            level: level.id,
            testing: true,
            version: DIAGNOSTIC_VERSION,
          },
          createId(),
        ),
      });
      timer.current = setTimeout(
        () =>
          finishRun(
            {
              pass: false,
              checks: [],
              error: 'La ejecución no respondió. Revisá el código y volvé a probar.',
            },
            id,
          ),
        6000,
      );
    } catch (error) {
      finishRun(
        {
          pass: false,
          checks: [],
          error: error instanceof Error ? error.message : 'Revisá la sintaxis.',
        },
        id,
      );
    }
  }
  function edit(index: number, value: string) {
    gali.edit();
    update((g) => {
      const values = [...(g.codes[level.id] ?? level.zones.map((zone) => zone.initial))];
      values[index] = value;
      return { ...g, codes: { ...g.codes, [level.id]: values } };
    });
  }
  function navigate(id: number) {
    if (pending.current || id === level.id || !diagnosticLevels.some((level) => level.id === id))
      return;
    cancelRun();
    navigated.current = true;
    update((g) => addEvent({ ...g, level: id }, 'enter'));
  }
  function hint() {
    const n = hints.length + 1;
    if (n > 3) return;
    gali.hint(n);
    update((g) =>
      addEvent(
        { ...g, hints: { ...g.hints, [level.id]: [...(g.hints[level.id] ?? []), n] } },
        'hint',
        { hint: n },
      ),
    );
  }
  function closeDiagnostic() {
    if (pending.current) return;
    update((g) => (g.finished ? g : addEvent({ ...g, finished: true }, 'finish')));
    router.push('/diagnostico/resultado');
  }
  if (!game) return <main className="loading">Preparando el diagnóstico…</main>;
  const count = diagnosticLevels.filter((level) => game.completed.includes(level.id)).length;
  const changed = testedCode !== null && testedCode !== assemble(level, zones);
  return (
    <>
      <header className="topbar game-topbar">
        <Brand />
        <span className="pair-tag">
          {game.mode === 'demo' ? 'DEMO · ' : ''}
          {game.pair.join(' + ')}
        </span>
      </header>
      <main ref={main} className="game-main diagnostic-main" data-level={level.id}>
        <div className="game-title">
          <div>
            <span className="eyebrow">
              DIAGNÓSTICO / MISIÓN {level.id} DE 8 · {level.concept}
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {level.title}
            </h1>
          </div>
          <button className="text-button" onClick={() => downloadResults(game)}>
            Descargar resultados ↓
          </button>
        </div>
        <DiagnosticImport
          disabled={busy}
          onImport={(codes) => {
            if (pending.current) return;
            update((g) => ({ ...g, codes: { ...g.codes, ...codes } }));
            setResult(null);
            setTestedCode(null);
            setPreview(null);
            previewId.current = null;
            setSnapshot(blank);
            setRecovery(null);
            gali.edit();
          }}
        />
        <div ref={map} className="panel diagnostic-map">
          <div className="diagnostic-map-heading">
            <strong>{count}/8 misiones resueltas</strong>
            <span>Hasta 90 min · {level.minutes} min orientativos en esta misión</span>
          </div>
          <nav aria-label="Misiones del diagnóstico">
            {diagnosticLevels.map((item) => (
              <button
                key={item.id}
                disabled={busy}
                aria-current={item.id === level.id ? 'step' : undefined}
                onClick={() => navigate(item.id)}
              >
                <span>
                  {game.completed.includes(item.id) ? '✓' : String(item.id).padStart(2, '0')}
                </span>
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
          <p className="footnote">
            Todas las misiones están disponibles. Podés dejar una pendiente y volver; tu código se
            conserva.
          </p>
        </div>
        <p className="diagnostic-roles">
          <strong>Intercambien roles cada dos misiones.</strong> En este bloque:{' '}
          {Math.floor((level.id - 1) / 2) % 2 === 0 ? game.pair[0] : game.pair[1]} escribe y{' '}
          {Math.floor((level.id - 1) / 2) % 2 === 0 ? game.pair[1] : game.pair[0]} revisa.
        </p>
        <div className="game-grid">
          <section className="panel code-panel">
            <div className="objective" ref={objective}>
              <span className="section-index">01</span>
              <div>
                <h2>Tu objetivo</h2>
                <p>{level.objective}</p>
              </div>
            </div>
            <details ref={html} className="html-reference" key={level.id} open={level.id <= 2}>
              <summary>HTML de referencia</summary>
              <pre>
                <code>{level.html}</code>
              </pre>
            </details>
            <div className="editor-workspace">
              <div className="editor-header">
                <strong>app.js</strong>
                <span>Completá los bloques resaltados</span>
              </div>
              <div className="diagnostic-editor-actions">
                <button ref={executeAnchor} className="primary" disabled={busy} onClick={execute}>
                  {busy ? 'Probando…' : '▷ Ejecutar y comprobar'}
                </button>
                <button className="text-button" disabled={busy} onClick={() => setResetting(true)}>
                  Reiniciar código
                </button>
                <a href="#diagnostic-feedback">Ver devolución ↓</a>
              </div>
              <div ref={editor} className="code-editor">
                <pre className="fixed-code">
                  <code>{level.prefix}</code>
                </pre>
                {level.zones.map((zone, i) => (
                  <div key={i}>
                    <label className="zone-label" htmlFor={'diagnostic-zone-' + i}>
                      {zone.label}
                    </label>
                    <textarea
                      id={'diagnostic-zone-' + i}
                      aria-label={zone.label}
                      rows={zone.rows}
                      value={zones[i]}
                      disabled={busy}
                      maxLength={5000}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      onFocus={gali.edit}
                      onChange={(event) => edit(i, event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Tab' &&
                          !event.shiftKey &&
                          !event.ctrlKey &&
                          !event.altKey
                        ) {
                          event.preventDefault();
                          const target = event.currentTarget,
                            start = target.selectionStart;
                          edit(
                            i,
                            target.value.slice(0, start) +
                              '  ' +
                              target.value.slice(target.selectionEnd),
                          );
                          requestAnimationFrame(() =>
                            target.setSelectionRange(start + 2, start + 2),
                          );
                        }
                        if (event.key === 'Escape') event.currentTarget.blur();
                      }}
                    />
                    {level.joins?.[i] && (
                      <pre className="fixed-code">
                        <code>{level.joins[i]}</code>
                      </pre>
                    )}
                  </div>
                ))}
                <pre className="fixed-code">
                  <code>{level.suffix}</code>
                </pre>
              </div>
            </div>
            {resetting && (
              <div className="confirm" role="alert">
                <p>
                  Se descartará el código editado de esta misión. El historial y el logro se
                  conservan.
                </p>
                <button
                  disabled={busy}
                  onClick={() => {
                    update((g) => ({
                      ...g,
                      codes: { ...g.codes, [level.id]: level.zones.map((zone) => zone.initial) },
                    }));
                    setResetting(false);
                    setResult(null);
                    setTestedCode(null);
                    setPreview(null);
                    previewId.current = null;
                    setSnapshot(blank);
                    gali.edit();
                  }}
                >
                  Sí, reiniciar
                </button>
                <button onClick={() => setResetting(false)}>Cancelar</button>
              </div>
            )}
          </section>
          <section className="preview-column">
            <div ref={workshop} className="panel world-panel">
              <div className="panel-heading">
                <span className="section-index">02</span>
                <div>
                  <h2>El taller de Gali</h2>
                  <p>Tu programa se prueba con distintos datos.</p>
                </div>
              </div>
              <Workshop
                mode="campaign"
                completed={diagnosticWorkshopModules(game.completed)}
                snapshot={snapshot}
                galiPose={gali.pose}
                hideGali={companionActive}
                recovery={recovery}
                fitToPanel
                mood={result?.pass ? 'celebrate' : result ? 'help' : busy ? 'attention' : 'wait'}
              />
              <div className="preview-header">
                <strong>Vista previa del programa</strong>
                <span>{preview ? 'Lista para explorar' : 'Esperando ejecución'}</span>
              </div>
              {preview ? (
                <iframe
                  key={preview.id}
                  ref={previewRef}
                  title="Vista previa del diagnóstico"
                  sandbox="allow-scripts"
                  srcDoc={preview.src}
                  className="exercise-frame"
                />
              ) : (
                <div className="preview-empty">
                  Completá el código y ejecutá para activar esta vista.
                </div>
              )}
            </div>
            <div
              id="diagnostic-feedback"
              className={'panel feedback ' + (result?.pass ? 'success' : '')}
            >
              <GaliCompanion gali={gali} anchors={anchors} onAvailability={setCompanionActive} />
              <h2>
                {busy
                  ? 'Comprobando…'
                  : result?.pass
                    ? '✓ Objetivo cumplido'
                    : result
                      ? 'Revisemos el programa'
                      : 'Un paso a la vez'}
              </h2>
              {result?.error && (
                <p className="error" role="alert">
                  {result.error}
                </p>
              )}
              {!!result?.checks.length && (
                <ul className="checks" aria-label="Comprobaciones">
                  {result.checks.map((check, i) => (
                    <li key={i} className={check.pass ? 'pass' : 'fail'}>
                      {check.pass ? '✓' : '○'} {check.label}
                      {check.detail && <small>{check.detail}</small>}
                    </li>
                  ))}
                </ul>
              )}
              {changed && (
                <p className="config-notice">
                  Tenés cambios sin comprobar. La devolución corresponde a la ejecución anterior.
                </p>
              )}
              {approved && (
                <p className="achievement">
                  Misión resuelta y logro conservado.
                  {result && !result.pass
                    ? ' Los cambios de esta ejecución todavía necesitan revisión.'
                    : ''}
                </p>
              )}
              <div className="result-actions">
                {level.id < 8 && (
                  <button
                    disabled={busy}
                    className="primary"
                    onClick={() => navigate(level.id + 1)}
                  >
                    {approved ? 'Siguiente misión →' : 'Dejar pendiente y seguir →'}
                  </button>
                )}
                <button disabled={busy} onClick={() => setClosing(true)}>
                  Revisar y cerrar diagnóstico
                </button>
              </div>
            </div>
            <section className="panel diagnostic-help" ref={help}>
              <div className="diagnostic-help-heading">
                <h2>Preguntas para pensar</h2>
                <span
                  className="diagnostic-help-count"
                  aria-label={`${hints.length} de 3 preguntas consultadas`}
                >
                  {hints.length}/3
                </span>
              </div>
              <p className="muted">
                Una pregunta a la vez, para construir su propia solución. Se registran sin descontar
                puntos.
              </p>
              <ol className="diagnostic-questions">
                {hints.map((n) => (
                  <li key={n}>
                    <span className="diagnostic-question-number" aria-hidden="true">
                      {String(n).padStart(2, '0')}
                    </span>
                    <p>{level.hints[n - 1]}</p>
                  </li>
                ))}
              </ol>
              {hints.length < 3 ? (
                <button className="diagnostic-hint-button" disabled={busy} onClick={hint}>
                  <span aria-hidden="true">＋</span> Ver pista {hints.length + 1}
                </button>
              ) : (
                <p className="diagnostic-help-complete" role="status">
                  <span aria-hidden="true">✓</span> Ya tienen las tres preguntas para seguir
                  pensando.
                </p>
              )}
            </section>
          </section>
        </div>
        {closing && (
          <section className="panel diagnostic-close" role="alert">
            <h2>Revisión y cierre</h2>
            <p>
              Tienen {count} de 8 misiones resueltas. Pueden cerrar con pendientes; el perfil
              mostrará qué quedó por revisar.
            </p>
            <p>
              Antes de terminar, expliquen entre los dos una solución y una dificultad que
              encontraron.
            </p>
            <button className="primary" disabled={busy} onClick={closeDiagnostic}>
              Confirmar cierre y ver perfil
            </button>
            <button onClick={() => setClosing(false)}>Seguir trabajando</button>
          </section>
        )}
        <footer className="diagnostic-footer">
          <p>
            {game.mode === 'demo'
              ? 'Modo demo · Guardado solo en este navegador. No se envían resultados.'
              : game.pending.length
                ? `${game.pending.length} eventos pendientes de envío. Mantené abierta esta página o descargá una copia.`
                : 'Eventos locales confirmados por el servidor.'}
          </p>
          {sync && <p>{sync}</p>}
          {storageError && (
            <p className="error" role="alert">
              No se pudo guardar en este equipo. Descargá una copia.
            </p>
          )}
          <Link href="/diagnostico">Volver al ingreso</Link>
        </footer>
        {test && (
          <iframe
            key={test.id}
            ref={testRef}
            title="Comprobación aislada del diagnóstico"
            sandbox="allow-scripts"
            srcDoc={test.src}
            hidden
          />
        )}
      </main>
    </>
  );
}
