'use client';
import { useEffect, useState } from 'react';
const KEY = 'galileo:reduced-motion:1';
const EVENT = 'galileo-motion-change';
let memoryReduced = false;
let memoryOnly = false;
export function useMotionPreferences() {
  const [systemReduced, setSystemReduced] = useState(true);
  const [userReduced, setUserReducedState] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => {
      setSystemReduced(media.matches);
      try {
        if (!memoryOnly) memoryReduced = localStorage.getItem(KEY) === 'true';
      } catch {
        /* Preference remains usable without storage. */
      }
      setUserReducedState(memoryReduced);
    };
    read();
    media.addEventListener('change', read);
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      media.removeEventListener('change', read);
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);
  const reduced = systemReduced || userReduced;
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
  }, [reduced]);
  function setUserReduced(value: boolean) {
    memoryReduced = value;
    setUserReducedState(value);
    try {
      localStorage.setItem(KEY, String(value));
      memoryOnly = false;
    } catch {
      memoryOnly = true;
    }
    window.dispatchEvent(new Event(EVENT));
  }
  return { reduced, systemReduced, userReduced, setUserReduced };
}
