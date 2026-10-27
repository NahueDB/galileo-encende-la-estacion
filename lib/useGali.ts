'use client';
import { useCallback, useEffect, useReducer, useState, useRef } from 'react';
import {
  entryMessage,
  guideMessage,
  type GaliTarget,
  galiReducer,
  initialGali,
  resultMessage,
  type GaliPose,
} from './gali-dialogue';
import type { Level, RunResult } from './types';
const KEY = 'galileo:less-interventions:1';
export function useGali(scope: string, level: Level, approved: boolean) {
  const [state, dispatch] = useReducer(galiReducer, initialGali);
  const visits = useRef(0);
  const [flight, setFlight] = useState<GaliPose | null>(null);
  useEffect(() => {
    try {
      dispatch({ type: 'less', value: localStorage.getItem(KEY) === 'true' });
    } catch {}
  }, []);
  useEffect(() => {
    dispatch({ type: 'station', scope, message: entryMessage(scope, level, approved) });
    setFlight(null);
  }, [scope]); // A completion does not replay the station greeting.
  const phase = useCallback((pose: GaliPose | null) => setFlight(pose), []);
  function less(value: boolean) {
    dispatch({ type: 'less', value });
    try {
      localStorage.setItem(KEY, String(value));
    } catch {}
  }
  function result(id: string, value: RunResult, fresh: boolean) {
    dispatch({
      type: 'message',
      scope,
      run: id,
      message: resultMessage(id + ':result', value, level.id, fresh),
    });
  }
  return {
    ...state,
    pose: flight ?? (state.open ? (state.message?.pose ?? 'idle') : 'idle'),
    phase,
    visit: (target: GaliTarget, tour = false) =>
      dispatch({
        type: 'message',
        scope,
        requested: true,
        message: guideMessage(`${scope}:visit:${++visits.current}`, target, tour),
      }),
    setLess: less,
    start: (id: string) => dispatch({ type: 'start', scope, id }),
    result,
    previewError: (id: string, error: string) =>
      dispatch({
        type: 'message',
        scope,
        message: resultMessage(
          id + ':preview:' + error,
          { pass: false, checks: [], error },
          level.id,
          false,
        ),
      }),
    hint: (n: number) =>
      dispatch({
        type: 'message',
        scope,
        requested: true,
        message: {
          id: `${scope}:hint:${n}`,
          kind: 'hint',
          text: level.hints[n - 1],
          pose: 'explain',
          target: 'help',
        },
      }),
    edit: () => dispatch({ type: 'edit' }),
    close: () => dispatch({ type: 'close' }),
    reopen: () => dispatch({ type: 'reopen' }),
  };
}
export type GaliController = ReturnType<typeof useGali>;
