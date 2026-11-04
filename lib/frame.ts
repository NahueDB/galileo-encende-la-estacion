import { createRuntime, runnerMain } from './runtime';
import { createDiagnosticRuntime } from './diagnostic-runtime';
import { diagnosticRunner } from './diagnostic-runner';
import { isDiagnostic } from './types';
export function frameSource(config: Record<string, unknown> & { version?: string }, nonce: string) {
  const runner = isDiagnostic(config.version) ? diagnosticRunner : runnerMain;
  const runtime = isDiagnostic(config.version) ? createDiagnosticRuntime : createRuntime;
  const data = JSON.stringify(config).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>body{font:14px system-ui;color:#e8f1ff;background:#0c2035;margin:0;padding:16px}h2{font-size:16px}p{padding:12px;background:#132e47;border-radius:8px}label{display:block;margin-bottom:8px}input,button{font:inherit;padding:9px;border-radius:6px;border:1px solid #46708b;margin:0 6px 8px 0}input{background:#071426;color:white;max-width:180px}button{background:#b4edff;color:#071426;cursor:pointer}:focus-visible{outline:3px solid #fbd773;outline-offset:2px}</style></head><body><div id="exercise"></div><script nonce="${nonce}">(${runner.toString()})(${data},${runtime.toString()});</script></body></html>`;
}
