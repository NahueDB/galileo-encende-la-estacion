'use client';
import { useEffect, useState } from 'react';
const KEY = 'galileo:gali-enabled:1';
const EVENT = 'galileo-gali-preference';
let enabledInMemory = true;
let memoryOnly = false;
export function useGaliPreferences() {
  const [enabled, setEnabledState] = useState(true);
  useEffect(() => {
    const read = () => {
      try {
        if (!memoryOnly) enabledInMemory = localStorage.getItem(KEY) !== 'false';
      } catch {}
      setEnabledState(enabledInMemory);
    };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);
  function setEnabled(value: boolean) {
    enabledInMemory = value;
    setEnabledState(value);
    try {
      localStorage.setItem(KEY, String(value));
      memoryOnly = false;
    } catch {
      memoryOnly = true;
    }
    window.dispatchEvent(new Event(EVENT));
  }
  return { enabled, setEnabled };
}
