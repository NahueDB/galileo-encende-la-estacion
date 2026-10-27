import type { Level, RunResult } from './types';
import { recoveryMessages } from './workshop-recovery';
export type GaliPose =
  'idle' | 'greeting' | 'attention' | 'explain' | 'review' | 'celebrate' | 'takeoff' | 'landing';
export type GaliTarget = 'map' | 'objective' | 'html' | 'editor' | 'execute' | 'workshop' | 'help';
export type GaliMessage = {
  id: string;
  kind: 'entry' | 'checking' | 'error' | 'success' | 'hint' | 'guide';
  text: string;
  module?: { label: string; token: string };
  pose: GaliPose;
  target: GaliTarget;
  route?: GaliTarget[];
};
export const priority = { entry: 0, guide: 1, hint: 1, success: 2, checking: 3, error: 3 };
// Diagnostics come only from the validated interpreter result, never from the draft.
export function resultMessage(
  id: string,
  result: RunResult,
  level: number,
  fresh: boolean,
): GaliMessage {
  if (result.pass)
    return {
      id,
      kind: 'success',
      module: fresh
        ? { label: recoveryMessages[level], token: id.replace(/:result$/, '') }
        : undefined,
      text: fresh
        ? `${recoveryMessages[level]}. Probá los controles de la vista previa.`
        : 'El objetivo sigue cumplido y tu logro está conservado. Podés seguir experimentando.',
      pose: 'celebrate',
      target: 'workshop',
    };
  const detail =
    result.error ||
    result.checks.find((c) => !c.pass)?.detail ||
    'Revisá las comprobaciones y volvé a probar.';
  return { id, kind: 'error', text: detail.slice(0, 260), pose: 'review', target: 'editor' };
}
export function entryMessage(scope: string, level: Level, approved: boolean): GaliMessage {
  return {
    id: `${scope}:entry`,
    kind: 'entry',
    text: approved
      ? 'Este puesto ya está recuperado. Podés revisar tu programa y después retomar la misión desde el mapa.'
      : `En este puesto trabajamos con ${level.concept}. Leé el objetivo y probá tu idea en el editor.`,
    pose: approved ? 'explain' : 'greeting',
    target: approved ? 'map' : 'editor',
  };
}
export type GaliState = {
  scope: string;
  message: GaliMessage | null;
  open: boolean;
  less: boolean;
  typing: boolean;
  run: string | null;
  seen: string[];
};
export type GaliAction =
  | { type: 'station'; scope: string; message: GaliMessage }
  | { type: 'message'; scope: string; message: GaliMessage; requested?: boolean; run?: string }
  | { type: 'start'; scope: string; id: string }
  | { type: 'edit' }
  | { type: 'close' }
  | { type: 'reopen' }
  | { type: 'less'; value: boolean };
export const initialGali: GaliState = {
  scope: '',
  message: null,
  open: false,
  less: false,
  typing: false,
  run: null,
  seen: [],
};
export function galiReducer(state: GaliState, action: GaliAction): GaliState {
  if (action.type === 'station')
    return state.scope === action.scope
      ? state
      : {
          ...initialGali,
          less: state.less,
          scope: action.scope,
          message: action.message,
          open: !state.less,
          seen: [action.message.id],
        };
  if (action.type === 'less')
    return { ...state, less: action.value, open: action.value ? false : state.open };
  if (action.type === 'edit') return { ...state, typing: true, open: false };
  if (action.type === 'close') return { ...state, open: false };
  if (action.type === 'reopen') return { ...state, typing: false, open: !!state.message };
  if (action.scope !== state.scope) return state;
  if (action.type === 'start')
    return {
      ...state,
      run: action.id,
      typing: false,
      message: {
        id: action.id + ':checking',
        kind: 'checking',
        text: 'Estoy comprobando cómo responde el HTML a distintas acciones.',
        pose: 'attention',
        target: 'execute',
      },
      open: !state.less,
    };
  if (state.seen.includes(action.message.id) || (action.run && action.run !== state.run))
    return state;
  // A result replaces its own pending action; an explicit request starts a new intention.
  if (
    !action.run &&
    !action.requested &&
    state.message &&
    priority[action.message.kind] < priority[state.message.kind]
  )
    return state;
  return {
    ...state,
    message: action.message,
    open: !!action.requested || (!state.less && !state.typing),
    typing: action.requested ? false : state.typing,
    seen: [...state.seen.slice(-30), action.message.id],
  };
}

export const galiPlaces: Record<GaliTarget, { label: string; text: string }> = {
  map: {
    label: 'Mapa',
    text: 'Este mapa muestra qué puestos recuperaste y cuál podés abrir ahora. Elegí uno disponible para seguir.',
  },
  objective: {
    label: 'Objetivo',
    text: 'Acá está el comportamiento que buscamos. Pensá qué debería pasar antes y después de cada acción.',
  },
  html: {
    label: 'HTML',
    text: 'Este es el HTML con el que trabaja tu programa. Mirá los identificadores antes de escribir el selector.',
  },
  editor: {
    label: 'Código',
    text: 'Acá escribís tu idea en JavaScript. Cuando empieces a escribir, me aparto para dejarte trabajar.',
  },
  execute: {
    label: 'Probar',
    text: 'Este botón ejecuta tu programa y comprueba cómo responde. Después podés probar los controles HTML.',
  },
  workshop: {
    label: 'Taller',
    text: 'El taller representa lo que hace el HTML y conserva los módulos que recuperaste. Los controles reales están debajo.',
  },
  help: {
    label: 'Pistas',
    text: 'Acá podés pedir hasta tres pistas, sin penalización. Visitar esta parte de la página no consume ninguna.',
  },
};
export function guideMessage(id: string, target: GaliTarget, tour = false): GaliMessage {
  return {
    id,
    kind: 'guide',
    text: tour
      ? 'Vení, recorremos la estación: mapa, objetivo, HTML, código, controles, taller y pistas. Podés detenerme o empezar a escribir cuando quieras.'
      : galiPlaces[target].text,
    pose: 'explain',
    target,
    route: tour ? ['map', 'objective', 'html', 'editor', 'execute', 'workshop', 'help'] : undefined,
  };
}
