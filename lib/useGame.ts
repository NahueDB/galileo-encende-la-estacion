'use client';
import { useEffect, useRef, useState } from 'react';
import { loadGame, storeGame } from './local';
import type { Game } from './types';
export function useGame() {
  const [game, setGame] = useState<Game | null>(null),
    [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState(false),
    [sync, setSync] = useState('');
  const latest = useRef<Game | null>(null);
  const syncing = useRef(false);
  const delay = useRef(2000);
  const next = useRef(0);
  function update(fn: (g: Game) => Game) {
    setGame((g) => {
      if (!g) return g;
      const v = fn(g);
      latest.current = v;
      storeGame(v);
      return v;
    });
  }
  useEffect(() => {
    const g = loadGame();
    latest.current = g;
    setGame(g);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (game) {
      latest.current = game;
      setStorageError(!storeGame(game));
    }
  }, [game]);
  useEffect(() => {
    async function send() {
      const g = latest.current;
      if (
        !g ||
        g.mode !== 'real' ||
        !g.pending.length ||
        syncing.current ||
        Date.now() < next.current
      )
        return;
      syncing.current = true;
      setSync('Enviando resultados…');
      const batch = g.pending.slice(0, 20);
      try {
        const r = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + g.token },
          body: JSON.stringify({ events: batch }),
          signal: AbortSignal.timeout(20000),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        const accepted = new Set(d.accepted as string[]);
        update((v) => ({ ...v, pending: v.pending.filter((e) => !accepted.has(e.id)) }));
        delay.current = 2000;
        next.current = Date.now() + 500;
        setSync('Último envío confirmado por el servidor.');
      } catch (e) {
        next.current = Date.now() + delay.current;
        delay.current = Math.min(60000, delay.current * 2);
        setSync(
          e instanceof Error ? e.message : 'Sin confirmación. Los resultados siguen pendientes.',
        );
      } finally {
        syncing.current = false;
      }
    }
    const timer = setInterval(send, 1500);
    const online = () => {
      next.current = 0;
      void send();
    };
    window.addEventListener('online', online);
    void send();
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', online);
    };
  }, []);
  return { game, update, loaded, storageError, sync };
}
