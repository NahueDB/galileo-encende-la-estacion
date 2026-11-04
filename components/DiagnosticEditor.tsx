'use client';
import { useRef } from 'react';

export default function DiagnosticEditor({
  value,
  disabled,
  onChange,
  onFocus,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
}) {
  const numbers = useRef<HTMLPreElement>(null);
  return (
    <div className="diagnostic-source-editor">
      <pre ref={numbers} className="diagnostic-line-numbers" aria-hidden="true">
        {Array.from({ length: value.split('\n').length }, (_, i) => i + 1).join('\n')}
      </pre>
      <textarea
        aria-label="Código completo de app.js"
        value={value}
        disabled={disabled}
        maxLength={12000}
        rows={Math.min(30, Math.max(14, value.split('\n').length + 2))}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (numbers.current) numbers.current.scrollTop = event.currentTarget.scrollTop;
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.blur();
          const target = event.currentTarget;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          let insertion: string | undefined;
          if (
            event.key === 'Tab' &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          )
            insertion = '  ';
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            const line = target.value.slice(0, start).split('\n').pop() ?? '';
            insertion =
              '\n' + (line.match(/^\s*/)?.[0] ?? '') + (line.trimEnd().endsWith('{') ? '  ' : '');
          }
          if (insertion !== undefined) {
            event.preventDefault();
            onChange(target.value.slice(0, start) + insertion + target.value.slice(end));
            const position = start + insertion.length;
            requestAnimationFrame(() => target.setSelectionRange(position, position));
          }
        }}
      />
    </div>
  );
}
