import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import FileChunker from '../../components/FileChunker';
import DocPage, { PillButton } from '../../lib/DocPage';
import { usePhone } from '../../lib/useViewport';

const entry = getComponent('file-chunker');

const props = [
  { name: 'name', type: 'string', desc: 'The file name, e.g. "report.pdf".' },
  { name: 'stage', type: "'idle' | 'reading' | 'chunking' | 'embedding' | 'ready' | 'error'", def: "'idle'", desc: 'reading fills the page as pages turn; chunking peels strips off onto the deck; embedding lights an index mark on each strip; ready squares the deck up; error drops a strip.' },
  { name: 'page / pages', type: 'number', def: '0 / 0', desc: 'Reading progress. The page lines fill by page / pages and a page turns whenever page increases.' },
  { name: 'chunks', type: 'number', def: '0', desc: 'Chunks so far. That many strips land on the deck; feed it as your splitter reports.' },
  { name: 'tokens', type: 'number', def: '0', desc: 'Total tokens, shown in the status line once known.' },
  { name: 'detail', type: 'string', desc: 'Overrides the status line — use it for the error message.' },
  { name: 'size / width', type: 'number', def: '40 / 140', desc: 'Canvas height and width in px.' },
  { name: 'color / errorColor', type: 'hex', def: "'#059669' / '#ef4444'", desc: 'The "ready" colour and the failure colour.' },
];

const DOC = { name: 'quarterly-report.pdf', pages: 12, chunks: 48, tokens: 12400 };

export default function FileChunkerPage() {
  const phone = usePhone();
  const [auto, setAuto] = useState(true);
  const [run, setRun] = useState(0); // 0 idle, >0 a run in progress
  const [fail, setFail] = useState(false);
  const [st, setSt] = useState({ stage: 'idle', page: 0, chunks: 0, tokens: 0 });
  const timer = useRef(null);

  // a scripted pipeline: read 12 pages, cut 48 chunks, embed, ready
  useEffect(() => {
    if (!run) return;
    const at = (ms, fn) => { timer.current = setTimeout(fn, ms); };
    const s = st;
    if (s.stage === 'idle') at(300, () => setSt({ stage: 'reading', page: 1, chunks: 0, tokens: 0 }));
    if (s.stage === 'reading') {
      if (s.page < DOC.pages) at(180 + Math.random() * 160, () => setSt({ ...s, page: s.page + 1 }));
      else at(500, () => setSt({ ...s, stage: 'chunking' }));
    }
    if (s.stage === 'chunking') {
      if (fail && s.chunks >= 19) at(400, () => setSt({ ...s, stage: 'error' }));
      else if (s.chunks < DOC.chunks) at(120 + Math.random() * 120, () => setSt({ ...s, chunks: Math.min(DOC.chunks, s.chunks + 1 + Math.floor(Math.random() * 3)) }));
      else at(600, () => setSt({ ...s, stage: 'embedding', tokens: DOC.tokens }));
    }
    if (s.stage === 'embedding') at(2400, () => setSt({ ...s, stage: 'ready' }));
    return () => clearTimeout(timer.current);
  }, [run, st, fail]);

  // auto-play: one clean run, then one that fails, until the first click
  useEffect(() => {
    if (!auto) return;
    if (st.stage === 'idle' && !run) {
      const id = setTimeout(() => setRun((r) => r + 1), 600);
      return () => clearTimeout(id);
    }
    if (st.stage === 'ready' || st.stage === 'error') {
      const id = setTimeout(() => {
        setFail(st.stage === 'ready');
        setSt({ stage: 'idle', page: 0, chunks: 0, tokens: 0 });
        setRun(0);
      }, 3600);
      return () => clearTimeout(id);
    }
  }, [auto, st.stage, run]);

  const start = (withFail) => {
    setAuto(false);
    clearTimeout(timer.current);
    setFail(withFail);
    setSt({ stage: 'idle', page: 0, chunks: 0, tokens: 0 });
    setRun((r) => r + 1);
  };
  const reset = () => {
    setAuto(false);
    clearTimeout(timer.current);
    setSt({ stage: 'idle', page: 0, chunks: 0, tokens: 0 });
    setRun(0);
  };

  const done = st.stage === 'ready';
  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[380px]"
      preview={
        <div className="flex w-full max-w-md flex-col gap-3 px-4 pb-6 pt-6 sm:px-6 sm:pb-12 sm:pt-2">
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tr-md bg-stone-100 px-4 py-2.5 text-[13.5px] text-stone-700">
              summarise the risks section
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white sm:flex">
              P
            </span>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <FileChunker
                name={DOC.name}
                stage={st.stage}
                page={st.page}
                pages={DOC.pages}
                chunks={st.chunks}
                tokens={st.tokens}
                width={phone ? 110 : 140}
                detail={st.stage === 'error' ? 'failed · page 6 could not be parsed' : undefined}
              />
              {done && (
                <p className="mt-3 text-[13.5px] leading-relaxed text-stone-700">
                  Three risks stand out: FX exposure in EMEA, a single-supplier dependency, and the pending litigation on page 9.
                </p>
              )}
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <PillButton active={!!run && !fail} onClick={() => start(false)}>▶ chunk</PillButton>
          <PillButton active={!!run && fail} onClick={() => start(true)}>▶ chunk, fails</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton onClick={reset}>reset</PillButton>
        </>
      }
      usage={`import FileChunker from './components/FileChunker';

<FileChunker
  name="report.pdf"
  stage="chunking"        // 'reading' | 'chunking' | 'embedding' | 'ready' | 'error'
  page={6} pages={6}
  chunks={8}
  tokens={3100}
/>

// wire it to a real ingestion job:
// <FileChunker
//   name={file.name}
//   stage={job.stage}
//   page={job.page} pages={job.pages}
//   chunks={job.chunks}
//   tokens={job.tokens}
//   detail={job.error}
// />`}
      props={props}
    />
  );
}
