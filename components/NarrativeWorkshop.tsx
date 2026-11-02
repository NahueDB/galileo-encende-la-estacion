'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Snapshot } from '@/lib/types';
import { getWorkshopProgress } from '@/lib/workshop-progress';

function Fan() {
  return (
    <g>
      <rect
        x="-29"
        y="-29"
        width="58"
        height="58"
        rx="8"
        fill="#bccdd2"
        stroke="#e7f6ed"
        strokeWidth="2"
      />
      <circle r="22" fill="#162f3d" />
      <g fill="#72bec6">
        {[0, 90, 180, 270].map((angle) => (
          <path key={angle} transform={`rotate(${angle})`} d="M0 -5 C-14 -25 17 -26 16 -13 L5 0Z" />
        ))}
      </g>
      <circle r="6" fill="#d9e9dd" />
      {[-22, 22].flatMap((x) =>
        [-22, 22].map((y) => <circle key={`${x}:${y}`} cx={x} cy={y} r="2" fill="#304b5b" />),
      )}
    </g>
  );
}

/** Presentation only: completed is the saved achievement; running comes from the live DOM. */
export default function NarrativeWorkshop({
  snapshot,
  completed,
}: {
  snapshot: Snapshot;
  completed: number[];
}) {
  const repaired = completed.includes(4);
  const modules = getWorkshopProgress(completed).completedIds.join(',');
  const previouslyRepaired = useRef(repaired);
  const [repairing, setRepairing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    if (!repaired || previouslyRepaired.current) return;
    previouslyRepaired.current = true;
    setRepairing(true);
    const timer = setTimeout(() => setRepairing(false), 6200);
    return () => clearTimeout(timer);
  }, [repaired]);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  const installed = repaired && !repairing;
  return (
    <div
      className="narrative-scene"
      data-mode="campaign"
      data-installed-modules={modules}
      data-visible-modules={modules}
      data-running={snapshot.running}
      data-repairing={repairing}
      data-installed={installed}
      data-paused={hidden}
    >
      <div className="scene-heading">
        <span>
          <i /> GALILEO / SECTOR 04
        </span>
        <span>BAHÍA DE MANTENIMIENTO</span>
      </div>
      <svg
        viewBox="0 0 900 440"
        role="img"
        aria-label={`Taller Galileo. Estación en ${snapshot.running ? 'funcionamiento. Cinta activa.' : 'espera. Cinta detenida.'}`}
      >
        <defs>
          <linearGradient id={`${id}-wall`} x2="0" y2="1">
            <stop stopColor="#142f40" />
            <stop offset="1" stopColor="#071925" />
          </linearGradient>
          <linearGradient id={`${id}-floor`} x2="0" y2="1">
            <stop stopColor="#28414b" />
            <stop offset="1" stopColor="#091d29" />
          </linearGradient>
          <linearGradient id={`${id}-metal`} x2=".7" y2="1">
            <stop stopColor="#e3ebe1" />
            <stop offset=".48" stopColor="#a7bcc1" />
            <stop offset="1" stopColor="#587682" />
          </linearGradient>
          <linearGradient id={`${id}-window`} x2="0" y2="1">
            <stop stopColor="#173b53" />
            <stop offset="1" stopColor="#4b7e87" />
          </linearGradient>
          <radialGradient id={`${id}-light`}>
            <stop stopColor="#93e5db" stopOpacity=".19" />
            <stop offset="1" stopColor="#93e5db" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-belt`}>
            <rect x="103" y="308" width="390" height="20" rx="10" />
          </clipPath>
        </defs>
        <rect width="900" height="440" fill={`url(#${id}-wall)`} />
        <g className="scene-camera">
          <circle cx="425" cy="160" r="300" fill={`url(#${id}-light)`} />
          <path d="M0 347H900V440H0Z" fill={`url(#${id}-floor)`} />
          <g stroke="#3d5963" opacity=".4">
            <path d="M0 390H900M0 427H900M200 347L115 440M400 347L375 440M600 347L640 440M800 347L895 440" />
          </g>
          <g stroke="#365663" strokeWidth="2">
            <rect x="42" y="57" width="345" height="161" rx="12" fill={`url(#${id}-window)`} />
            <path
              d="M55 199L144 151 205 184 277 132 373 194V207H55Z"
              fill="#2a5262"
              stroke="none"
            />
            <path d="M54 80H375M212 60V215" />
            <circle cx="308" cy="108" r="22" fill="#d5d8ba" stroke="none" opacity=".65" />
          </g>
          <path d="M0 41H900M0 252H900" stroke="#36505b" strokeWidth="5" />
          <path d="M415 38V113H528V246M827 40V245" fill="none" stroke="#213e4b" strokeWidth="12" />
          <path d="M415 38V113H528V246M827 40V245" fill="none" stroke="#5a747b" strokeWidth="2" />
          <rect x="70" y="34" width="240" height="5" rx="2" fill="#b4e9dd" />
          <rect x="578" y="34" width="205" height="5" rx="2" fill="#b4e9dd" />
          <text x="440" y="179" fill="#51727d" fontSize="50" fontWeight="800" letterSpacing="5">
            04
          </text>
          <text x="441" y="200" fill="#76949b" fontSize="11" letterSpacing="3">
            GALILEO TECHNICAL BAY
          </text>
          <g className="receiver">
            <ellipse cx="696" cy="372" rx="113" ry="16" fill="#061722" opacity=".6" />
            <path
              d="M604 213L631 193H787V346L762 367H604Z"
              fill="#2c4651"
              stroke="#78929a"
              strokeWidth="2"
            />
            <path d="M604 213H762V367H604Z" fill="#38535e" />
            <path d="M762 213L787 193V346L762 367Z" fill="#203b48" />
            <rect x="618" y="228" width="95" height="96" rx="5" fill="#0a202d" stroke="#597681" />
            <g stroke="#385866" strokeWidth="3">
              <path d="M625 240H704M625 251H704M625 262H704M625 306H704" />
            </g>
            <rect
              x="629"
              y="239"
              width="62"
              height="65"
              rx="6"
              fill="#102c3a"
              stroke="#9cb3b4"
              strokeDasharray="4 4"
            />
            <g className="installed-fan" transform="translate(660 275)">
              <Fan />
            </g>
            <rect x="726" y="232" width="20" height="6" rx="3" fill="#e6b872" />
            <text x="621" y="347" fill="#c4d5d5" fontSize="10" letterSpacing="1">
              SERVIDOR · SIN ALIMENTACIÓN
            </text>
            <path d="M781 343H813V367H833" fill="none" stroke="#71939d" strokeWidth="4" />
            <path d="M834 360V374M841 361V373" stroke="#e2c48a" strokeWidth="3" />
          </g>
          <ellipse cx="289" cy="375" rx="230" ry="19" fill="#061722" opacity=".6" />
          <path d="M104 323V373H123V333M465 323V373H484V333" fill="#6b858d" />
          <path d="M105 352H483" stroke="#314e5c" strokeWidth="8" />
          <rect
            x="91"
            y="300"
            width="414"
            height="37"
            rx="18"
            fill="#203b48"
            stroke="#77949a"
            strokeWidth="2"
          />
          <rect x="103" y="308" width="390" height="20" rx="10" fill="#071c28" />
          <g clipPath={`url(#${id}-belt)`}>
            <g className="belt-treads" stroke="#6c8d95" strokeWidth="4">
              {Array.from({ length: 24 }, (_, i) => (
                <path key={i} d={`M${70 + i * 20} 307l-8 22`} />
              ))}
            </g>
          </g>
          <circle cx="107" cy="319" r="5" fill="#b8cbc8" />
          <circle cx="488" cy="319" r="5" fill="#b8cbc8" />
          <path d="M136 341h30m12 0h30m12 0h30" stroke="#c8a668" strokeWidth="5" />
          <g className="source-fan" transform="translate(250 277)">
            <Fan />
          </g>
          <g transform="translate(76 267)">
            <rect width="59" height="26" rx="4" fill="#183a47" stroke="#557d86" />
            <circle cx="12" cy="13" r="4" className="belt-led" />
            <text x="23" y="17" fill="#b9d7dc" fontSize="10">
              DOM
            </text>
          </g>
          <g transform="translate(360 177)">
            <g className="gali-flight">
              <g className="gali-hover">
                <ellipse cy="114" rx="40" ry="7" fill="#071c29" opacity=".22" />
                <path
                  className="gali-thrust"
                  d="M-22 36L-10 75 0 42 11 75 23 36"
                  fill="#73d6de"
                  opacity=".55"
                />
                <path
                  d="M-38 18L-53 40 -45 58M38 18L53 40 45 58"
                  fill="none"
                  stroke="#87a6af"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M-48 57l8 5m83 -5l-8 5"
                  stroke="#e0e8df"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <rect x="-34" y="8" width="68" height="35" rx="15" fill={`url(#${id}-metal)`} />
                <path
                  d="M-43 -20Q-43 -42 -20 -42H20Q43 -42 43 -20V12Q43 26 25 26H-25Q-43 26 -43 12Z"
                  fill={`url(#${id}-metal)`}
                  stroke="#ddece5"
                  strokeWidth="2"
                />
                <rect
                  x="-36"
                  y="-31"
                  width="72"
                  height="43"
                  rx="15"
                  fill="#082938"
                  stroke="#6b929c"
                  strokeWidth="2"
                />
                <g className="gali-eyes" fill="#a7efea">
                  <rect x="-23" y="-19" width="11" height="18" rx="5" />
                  <rect x="12" y="-19" width="11" height="18" rx="5" />
                </g>
                <path
                  d="M-8 4Q0 10 8 4"
                  fill="none"
                  stroke="#a7efea"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M0 -42V-55" stroke="#a9c5c7" strokeWidth="3" />
                <circle cy="-58" r="5" fill="#e7c887" />
                <rect x="-10" y="30" width="20" height="4" rx="2" fill="#0d495b" />
                <text x="-14" y="22" fill="#234958" fontSize="8" fontWeight="700" letterSpacing="2">
                  GALI
                </text>
                <g className="held-fan" transform="translate(-10 65)">
                  <Fan />
                </g>
              </g>
            </g>
          </g>
          <path d="M0 0H20V440H0M880 0H900V440H880" fill="#071b27" />
          <path d="M20 0H27V440H20M873 0H880V440H873" fill="#36535f" />
          <path d="M0 423H900V440H0Z" fill="#061722" />
        </g>
      </svg>
      <div className="scene-caption" aria-live="polite">
        <span className="gali-tag">GALI</span>
        <span>
          {repairing
            ? 'Controles comprobados. Llevo el repuesto al servidor.'
            : installed
              ? 'Refrigeración reparada. Podés seguir probando los controles.'
              : 'El servidor está apagado. Necesito la cinta para trasladar su repuesto.'}
        </span>
      </div>
      <div className="scene-status">
        <span>{snapshot.running ? '● Cinta en marcha' : '○ Cinta detenida'}</span>
        <span>{repaired ? '✓ Reparación guardada' : 'Pendiente: controles de transporte'}</span>
      </div>
    </div>
  );
}
