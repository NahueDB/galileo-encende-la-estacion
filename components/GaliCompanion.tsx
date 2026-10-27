'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { createGali } from '@/lib/scene/gali';
import { findGaliLanding, flightKeyframes, type FlightPoint } from '@/lib/gali-flight';
import { galiPlaces, type GaliTarget } from '@/lib/gali-dialogue';
import type { GaliController } from '@/lib/useGali';
import { useMotionPreferences } from '@/lib/useMotionPreferences';
import GaliDialogue from './GaliDialogue';
export type GaliAnchors = Record<GaliTarget | 'main', RefObject<HTMLElement | null>>;
const protectedSelector =
  'textarea,input,select,button,summary,a,pre,iframe,h1,h2,h3,.objective p,.observed,.preview-header,.gali-dialogue,.zone-label,.campaign-station-name,.campaign-station-state,.editor-header strong,.editor-header span,.game-title .eyebrow,.help-area p,.help-area strong';
export default function GaliCompanion({
  gali,
  anchors,
  onAvailability,
}: {
  gali: GaliController;
  anchors: GaliAnchors;
  onAvailability: (active: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    flyer = useRef<HTMLDivElement>(null);
  const latest = useRef(gali);
  latest.current = gali;
  const motion = useMotionPreferences(),
    reduced = useRef(motion.reduced);
  reduced.current = motion.reduced;
  const played = useRef<string | null>(null),
    position = useRef<FlightPoint | null>(null),
    animation = useRef<Animation | null>(null);
  const ignoreScrollUntil = useRef(0);
  const [view, setView] = useState({ eligible: false, width: 72, height: 112 });
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0),
    [hasLanding, setHasLanding] = useState(false);
  const [flight, setFlight] = useState<'idle' | 'outbound' | 'arrived' | 'returning'>('idle');
  const [destination, setDestination] = useState<GaliTarget>('workshop');
  const canFly = view.eligible && ready && !failed,
    floating = canFly && hasLanding;
  const visible = useRef(floating);
  visible.current = floating;
  function anchor(target: GaliTarget) {
    const el = anchors[target].current;
    return target === 'workshop' ? (el?.querySelector<HTMLElement>('.workshop') ?? el) : el;
  }
  function locate(target: GaliTarget) {
    const rect = anchor(target)?.getBoundingClientRect();
    if (!rect) return null;
    const obstacles = Array.from(document.querySelectorAll<HTMLElement>(protectedSelector))
      .filter((el) => {
        const closed = el.closest('details:not([open])');
        return (
          !flyer.current?.contains(el) &&
          (!closed || el === closed.querySelector(':scope > summary'))
        );
      })
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
    return findGaliLanding(
      rect,
      obstacles,
      { width: innerWidth, height: innerHeight },
      view,
      target === 'workshop',
    );
  }
  function place(point: FlightPoint | null) {
    animation.current?.cancel();
    animation.current = null;
    setHasLanding(!!point);
    if (point && flyer.current) {
      position.current = point;
      flyer.current.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
    }
  }
  useEffect(() => {
    const measure = () =>
      setView((old) => {
        const next = {
          eligible: innerWidth >= 1100 && innerHeight >= 600,
          width: innerWidth >= 1500 ? 104 : 72,
          height: innerWidth >= 1500 ? 144 : 112,
        };
        return Object.keys(next).every(
          (k) => old[k as keyof typeof old] === next[k as keyof typeof next],
        )
          ? old
          : next;
      });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  useEffect(() => {
    if (!view.eligible || failed || !host.current) return;
    const canvas = document.createElement('canvas');
    let context: WebGL2RenderingContext | null = null;
    let renderer: THREE.WebGLRenderer;
    try {
      context = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        powerPreference: 'default',
      });
      if (!context || context.isContextLost()) throw new Error('WebGL no disponible');
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(view.width, view.height - 18);
      renderer.setClearColor(0, 0);
    } catch {
      context?.getExtension('WEBGL_lose_context')?.loseContext();
      setFailed(true);
      return;
    }
    canvas.setAttribute('aria-hidden', 'true');
    host.current.appendChild(canvas);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(30, view.width / (view.height - 18), 0.1, 30);
    camera.position.set(0.25, 1.5, 5.6);
    camera.lookAt(0, 1.18, 0);
    scene.add(new THREE.HemisphereLight(0xeaffff, 0x183442, 2.5));
    const sun = new THREE.DirectionalLight(0xffffff, 3.4);
    sun.position.set(3, 7, 4);
    scene.add(sun);
    const model = createGali();
    scene.add(model.root);
    let frame = 0,
      last = 0,
      time = 0,
      disposed = false;
    const render = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      if (document.hidden || !visible.current) return;
      time += dt;
      model.update(latest.current.pose, time, reduced.current);
      renderer.render(scene, camera);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setReady(false);
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', lost);
    frame = requestAnimationFrame(render);
    setReady(true);
    return () => {
      disposed = true;
      setReady(false);
      cancelAnimationFrame(frame);
      canvas.removeEventListener('webglcontextlost', lost);
      model.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [view.eligible, view.width, view.height, failed, attempt]);
  useEffect(() => {
    onAvailability(floating);
    return () => onAvailability(false);
  }, [floating, onAvailability]);
  useEffect(() => {
    let alive = true;
    const delays = new Map<ReturnType<typeof setTimeout>, (value: boolean) => void>();
    let pointed: HTMLElement | null = null;
    const delay = (ms: number) =>
      new Promise<boolean>((resolve) => {
        const id = setTimeout(() => {
          delays.delete(id);
          resolve(alive);
        }, ms);
        delays.set(id, resolve);
      });
    const unpoint = () => {
      pointed?.classList.remove('gali-pointed');
      pointed = null;
    };
    const stop = () => {
      alive = false;
      delays.forEach((resolve, id) => {
        clearTimeout(id);
        resolve(false);
      });
      delays.clear();
      animation.current?.cancel();
      animation.current = null;
      unpoint();
      setFlight('idle');
      gali.phase(null);
    };
    const dock = () => {
      place(locate('workshop'));
      setDestination('workshop');
    };
    let activeTarget = gali.message?.target ?? 'workshop';
    if (gali.message?.kind === 'guide') ignoreScrollUntil.current = performance.now() + 300;
    const reposition = (event?: Event) => {
      if (event?.type === 'scroll' && event.target !== document && event.target !== window) return;
      if (!canFly || performance.now() < ignoreScrollUntil.current) return;
      stop();
      dock();
    };
    const visibility = () => {
      if (document.hidden) {
        stop();
        dock();
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('visibilitychange', visibility);
    const observer = new ResizeObserver(() => {
      if (canFly && !animation.current && alive && position.current) {
        place(locate(pointed ? activeTarget : 'workshop'));
      }
    });
    if (anchors.main.current) observer.observe(anchors.main.current);
    const cleanup = () => {
      stop();
      observer.disconnect();
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('visibilitychange', visibility);
    };
    if (!canFly) {
      place(null);
      setFlight('idle');
      gali.phase(null);
      return cleanup;
    }
    if (!gali.open || gali.typing) {
      played.current = null;
      dock();
      setFlight('idle');
      gali.phase(null);
      return cleanup;
    }
    const target = gali.message?.target ?? 'workshop';
    if (motion.reduced || document.hidden || played.current === gali.message?.id) {
      played.current = gali.message?.id ?? null;
      place(locate(motion.reduced ? target : 'workshop'));
      setDestination(motion.reduced ? target : 'workshop');
      setFlight('idle');
      gali.phase(null);
      return cleanup;
    }
    played.current = gali.message?.id ?? null;
    const move = (to: FlightPoint | null) =>
      new Promise<boolean>((resolve) => {
        if (!alive || !to || !flyer.current) {
          resolve(false);
          return;
        }
        const from = position.current ?? locate('workshop') ?? to;
        place(from);
        const trip = flyer.current.animate(flightKeyframes(from, to), {
          duration: 1100,
          easing: 'cubic-bezier(.4,0,.2,1)',
          fill: 'both',
        });
        animation.current = trip;
        trip.onfinish = () => {
          if (!alive) {
            resolve(false);
            return;
          }
          flyer.current!.style.transform = `translate3d(${to.x}px,${to.y}px,0)`;
          position.current = to;
          animation.current = null;
          trip.cancel();
          resolve(true);
        };
        trip.oncancel = () => resolve(false);
      });
    const run = async () => {
      const route = gali.message?.route ?? [target];
      for (const next of route) {
        if (!alive) return;
        const el = anchor(next);
        if (gali.message?.kind === 'guide' && el) {
          if (next === 'html' && el instanceof HTMLDetailsElement) el.open = true;
          const r = el.getBoundingClientRect();
          if (r.top < 64 || r.top > innerHeight - 180) {
            ignoreScrollUntil.current = performance.now() + 200;
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            if (!(await delay(40))) return;
          }
        }
        activeTarget = next;
        setDestination(next);
        setFlight('outbound');
        gali.phase('takeoff');
        if (!(await move(locate(next)))) {
          if (alive) {
            dock();
            setFlight('idle');
            gali.phase(null);
          }
          return;
        }
        setFlight('arrived');
        gali.phase('landing');
        pointed = el ?? null;
        pointed?.classList.add('gali-pointed');
        if (!(await delay(220))) return;
        gali.phase(null);
        if (!(await delay(gali.message?.route ? 1400 : 4200))) return;
        unpoint();
      }
      if (!alive) return;
      setDestination('workshop');
      setFlight('returning');
      gali.phase('landing');
      await move(locate('workshop'));
      if (alive) {
        setFlight('idle');
        gali.phase(null);
      }
    };
    void run();
    return cleanup;
  }, [
    canFly,
    view.width,
    view.height,
    gali.message?.id,
    gali.open,
    gali.typing,
    gali.phase,
    motion.reduced,
  ]);
  return (
    <div
      className="gali-companion"
      data-floating={floating}
      data-flight={flight}
      data-destination={destination}
      data-pose={gali.pose}
    >
      <div
        ref={flyer}
        className="gali-flyer"
        aria-hidden="true"
        style={{ width: view.width, height: view.height }}
      >
        <div ref={host} className="gali-avatar" />
        <span className="gali-place-label">{galiPlaces[destination].label}</span>
      </div>
      <GaliDialogue gali={gali} touring={!!gali.message?.route && flight !== 'idle'} />
      {view.eligible && failed && (
        <button
          className="text-button gali-retry"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        >
          Reintentar acompañante
        </button>
      )}
    </div>
  );
}
