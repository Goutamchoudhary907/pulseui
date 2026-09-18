import { useState } from 'react';

// Dependency-free code block with a copy button. No syntax highlighting on
// purpose — keeps the site light, matching the library's own philosophy.
export default function CodeBlock({ code, filename }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silently ignore
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/70 px-4 py-2">
        <span className="font-mono text-[11px] text-stone-500">{filename}</span>
        <button
          onClick={handleCopy}
          className={
            'copy-btn rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ' +
            (copied
              ? 'is-stamped border-ink bg-ink text-white'
              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-ink')
          }
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[520px] overflow-auto px-5 py-4 font-mono text-[13px] leading-6 text-stone-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}
