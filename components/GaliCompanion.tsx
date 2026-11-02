'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { createGali } from '@/lib/scene/gali';
import {
  findGaliBubble,
  findGaliLanding,
  flightKeyframes,
  isGaliSpotFree,
  type FlightPoint,
} from '@/lib/gali-flight';
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
  const [view, setView] = useState({ eligible: false, width: 72, height: 112 });
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0),
    [hasLanding, setHasLanding] = useState(false);
  const [flight, setFlight] = useState<'idle' | 'outbound' | 'arrived' | 'returning'>('idle');
  const [destination, setDestination] = useState<GaliTarget>('workshop');
  const [bubbleOffset, setBubbleOffset] = useState<{
    x: number;
    y: number;
    side: 'above' | 'below' | 'left' | 'right';
  } | null>(null);
  const canFly = view.eligible && ready && !failed,
    floating = canFly && hasLanding;
  const visible = useRef(floating);
  visible.current = floating;
  function anchor(target: GaliTarget) {
    const el = anchors[target].current;
    return target === 'workshop' ? (el?.querySelector<HTMLElement>('.workshop') ?? el) : el;
  }
  function obstacleRects() {
    return Array.from(document.querySelectorAll<HTMLElement>(protectedSelector))
      .filter((el) => {
        const closed = el.closest('details:not([open])');
        return (
          !flyer.current?.contains(el) &&
          (!closed || el === closed.querySelector(':scope > summary'))
        );
      })
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
  }
  function landingNear(
    rect: DOMRect | { left: number; top: number; right: number; bottom: number },
    preferInside = false,
  ) {
    return findGaliLanding(
      rect,
      obstacleRects(),
      { width: innerWidth, height: innerHeight },
      view,
      preferInside,
    );
  }
  function locate(target: GaliTarget) {
    const rect = anchor(target)?.getBoundingClientRect();
    return rect ? landingNear(rect, target === 'workshop') : null;
  }
  function safeCurrentOr(target: GaliTarget) {
    const current = position.current;
    if (
      current &&
      isGaliSpotFree(current, obstacleRects(), { width: innerWidth, height: innerHeight }, view)
    )
      return current;
    return (
      locate(target) ??
      (current &&
        landingNear(
          {
            left: current.x,
            right: current.x + view.width,
            top: current.y,
            bottom: current.y + view.height,
          },
          true,
        ))
    );
  }
  function freezeAnimation() {
    if (!animation.current) return;
    if (flyer.current) {
      const rect = flyer.current.getBoundingClientRect();
      position.current = { x: rect.left, y: rect.top };
      flyer.current.style.transform = `translate3d(${rect.left}px,${rect.top}px,0)`;
    }
    animation.current.cancel();
    animation.current = null;
  }
  function place(point: FlightPoint | null) {
    freezeAnimation();
    setHasLanding(!!point);
    if (point && flyer.current) {
      position.current = point;
      flyer.current.style.visibility = '';
      flyer.current.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
      window.dispatchEvent(new Event('gali-positioned'));
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
      freezeAnimation();
      unpoint();
      setFlight('idle');
      gali.phase(null);
    };
    let activeTarget = gali.message?.target ?? 'workshop';
    const dock = () => {
      activeTarget = 'workshop';
      place(safeCurrentOr('workshop'));
      setDestination('workshop');
    };
    let lastScrollX = window.scrollX;
    let lastScrollY = window.scrollY;
    const reposition = (event?: Event) => {
      if (event?.type === 'scroll' && event.target !== document && event.target !== window) return;
      if (!canFly) return;
      if (
        event?.type === 'scroll' &&
        lastScrollX === window.scrollX &&
        lastScrollY === window.scrollY
      )
        return;
      lastScrollX = window.scrollX;
      lastScrollY = window.scrollY;
      stop();
      const from = position.current;
      const to =
        locate(activeTarget) ??
        (from &&
          landingNear(
            { left: from.x, right: from.x + view.width, top: from.y, bottom: from.y + view.height },
            true,
          ));
      if (!to || !flyer.current) {
        if (flyer.current) flyer.current.style.visibility = 'hidden';
        return;
      }
      if (!from || motion.reduced) {
        place(to);
        return;
      }
      flyer.current.style.visibility = '';
      const movement = flyer.current.animate(
        [
          { transform: `translate3d(${from.x}px,${from.y}px,0)` },
          { transform: `translate3d(${to.x}px,${to.y}px,0)` },
        ],
        { duration: 240, easing: 'ease-out', fill: 'both' },
      );
      animation.current = movement;
      movement.onfinish = () => {
        if (animation.current !== movement || !flyer.current) return;
        flyer.current.style.transform = `translate3d(${to.x}px,${to.y}px,0)`;
        position.current = to;
        animation.current = null;
        movement.cancel();
        window.dispatchEvent(new Event('gali-positioned'));
      };
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
        place(pointed ? locate(activeTarget) : safeCurrentOr('workshop'));
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
    // Executing is an explicit request: keep Gali visible where the students
    // are working, and celebrate in place only after a successful result.
    if (gali.message?.kind === 'checking' || gali.message?.kind === 'success') {
      activeTarget = destination;
      played.current = gali.message.id;
      place(safeCurrentOr('workshop'));
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
          window.dispatchEvent(new Event('gali-positioned'));
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
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            lastScrollX = window.scrollX;
            lastScrollY = window.scrollY;
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
      activeTarget = 'workshop';
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
  useEffect(() => {
    if (!floating || !gali.open || gali.message?.kind !== 'success' || !gali.message.celebration) {
      setBubbleOffset(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = flyer.current;
        if (!el || animation.current || document.hidden || el.style.visibility === 'hidden') {
          setBubbleOffset(null);
          return;
        }
        const rect = el.getBoundingClientRect();
        const point = findGaliBubble(rect, obstacleRects(), {
          width: innerWidth,
          height: innerHeight,
        });
        const next = point
          ? {
              x: point.x - rect.left,
              y: point.y - rect.top,
              side:
                point.y < rect.top
                  ? ('above' as const)
                  : point.y >= rect.bottom
                    ? ('below' as const)
                    : point.x < rect.left
                      ? ('left' as const)
                      : ('right' as const),
            }
          : null;
        setBubbleOffset((old) =>
          old?.x === next?.x && old?.y === next?.y && old?.side === next?.side ? old : next,
        );
      });
    };
    const observer = new ResizeObserver(measure);
    if (anchors.main.current) observer.observe(anchors.main.current);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    window.addEventListener('gali-positioned', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      window.removeEventListener('gali-positioned', measure);
    };
  }, [floating, gali.open, gali.message?.id, anchors]);
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
        {bubbleOffset && gali.message?.celebration && (
          <div
            className="gali-celebration-bubble"
            data-side={bubbleOffset.side}
            style={{ left: bubbleOffset.x, top: bubbleOffset.y }}
          >
            <strong>{gali.message.celebration.title}</strong>
            <span>{gali.message.celebration.detail}</span>
          </div>
        )}
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
