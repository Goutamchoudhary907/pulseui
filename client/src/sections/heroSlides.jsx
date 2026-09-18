import { useEffect, useState } from 'react';
import ThinkingIndicator from '../components/ThinkingIndicator';
import AgentStatus from '../components/AgentStatus';
import FileChunker from '../components/FileChunker';

// The hero well rotates through three demos
function Chip({ live, children }) {
  return (
    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-2.5 py-1 font-mono text-[11px] text-stone-600 backdrop-blur">
      <span
        className={
          'h-1.5 w-1.5 rounded-full transition-colors ' +
          (live ? 'bg-violet-500 animate-pulse' : 'bg-emerald-500')
        }
      />
      {children}
    </div>
  );
}

// 1. Thinking: drift → click → settle.
export function ThinkingSlide({ w, onDone }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setSettled(true), 3600);
    const b = setTimeout(onDone, 7200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [onDone]);
  const size = Math.min(272, Math.round(w * 0.62));
  return (
    <>
      <ThinkingIndicator settled={settled} size={size} color="#7c3aed" />
      <Chip live={!settled}>{settled ? 'settled' : 'thinking…'}</Chip>
    </>
  );
}

// 2. Agents: three flocks dispatched, work, and fly home.
const AGENTS = ['search docs', 'read files', 'run tests'];
const RATES = [0.016, 0.022, 0.013];
export function AgentsSlide({ w, h, onDone }) {
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    const ids = AGENTS.map((label, i) =>
      setTimeout(
        () => setAgents((l) => [...l, { id: label, label, status: 'running', progress: 0 }]),
        400 + i * 500,
      ),
    );
    const tick = setInterval(() => {
      setAgents((l) =>
        l.map((a, i) => {
          if (a.status !== 'running') return a;
          const p = Math.min(1, (a.progress ?? 0) + RATES[i] * (0.6 + Math.random() * 0.8));
          return p >= 1 ? { ...a, progress: 1, status: 'done' } : { ...a, progress: p };
        }),
      );
    }, 80);
    ids.push(setTimeout(onDone, 9800));
    return () => {
      ids.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, [onDone]);

  const running = agents.filter((a) => a.status === 'running').length;
  const done = agents.length === AGENTS.length && running === 0;
  return (
    <>
      <AgentStatus
        agents={agents}
        width={Math.round(w - 32)}
        height={Math.round(h - 96)}
        boidsPerAgent={7}
        showLabels={w > 380}
      />
      <Chip live={!done}>
        {done ? 'all done' : agents.length === 0 ? 'dispatching…' : `${running} agent${running === 1 ? '' : 's'} running`}
      </Chip>
    </>
  );
}

// 3. File chunker: a document read, cut, embedded, ready — inside a chat turn.
const INGEST = [];
for (let p = 1; p <= 6; p++) INGEST.push({ stage: 'reading', page: p, chunks: 0 });
for (let c = 2; c <= 14; c += 2) INGEST.push({ stage: 'chunking', page: 6, chunks: c });
INGEST.push({ stage: 'embedding', page: 6, chunks: 14, tokens: 3100 });
INGEST.push({ stage: 'embedding', page: 6, chunks: 14, tokens: 3100 });
INGEST.push({ stage: 'ready', page: 6, chunks: 14, tokens: 3100 });
const STEP_MS = 480;
const STAGE_LABEL = { reading: 'reading…', chunking: 'chunking…', embedding: 'embedding…', ready: 'ready' };

export function ChunkerSlide({ onDone }) {
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK((n) => Math.min(INGEST.length - 1, n + 1)), STEP_MS);
    const t = setTimeout(onDone, INGEST.length * STEP_MS + 2200);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [onDone]);
  const s = INGEST[k];
  const ready = s.stage === 'ready';
  return (
    <>
      <div className="flex w-[calc(100%-2.5rem)] max-w-[380px] flex-col gap-3 pt-6">
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-tr-md bg-stone-100 px-3.5 py-2 text-[13px] text-stone-700">
            summarise the risks section
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[13px] text-white">
            P
          </span>
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-stone-200 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <FileChunker
              name="handbook.pdf"
              stage={s.stage}
              page={s.page}
              pages={6}
              chunks={s.chunks}
              tokens={s.tokens ?? 0}
              width={150}
              size={44}
            />
            {ready && (
              <p className="mt-2.5 text-[13px] leading-relaxed text-stone-700">
                Three risks stand out — FX exposure, a single supplier, and the pending litigation on page 9.
              </p>
            )}
          </div>
        </div>
      </div>
      <Chip live={!ready}>{STAGE_LABEL[s.stage]}</Chip>
    </>
  );
}
