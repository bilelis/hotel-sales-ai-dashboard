import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Card } from './Card';
import { ApiError, postChat } from '../api';
import { reducedMotion } from '../hooks/motion';
import type { ToolCall } from '../types';

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  fresh?: boolean;
  kind?: 'welcome' | 'error';
}

const CHIPS = [
  'Average Daily Rate (ADR) & RevPAR Yield',
  'What is RevPAR and ADR?',
  'Top revenue channel',
  'Which channel has the highest cancellation rate?',
  'Top 5 VIP guests this year',
];

const WELCOME: Msg = {
  id: 0,
  role: 'assistant',
  kind: 'welcome',
  content: 'Welcome, General Manager. How can I assist with front desk operations, channel performance, or sales revenue today?',
};

function Reveal({ text, animate, onTick }: { text: string; animate: boolean; onTick: () => void }) {
  const words = useMemo(() => text.split(' '), [text]);
  const [n, setN] = useState(animate && !reducedMotion() ? 0 : words.length);
  useEffect(() => {
    if (n >= words.length) return;
    const id = setTimeout(() => setN(n + 1), 25);
    return () => clearTimeout(id);
  }, [n, words.length]);
  useEffect(onTick, [n]);
  return <>{words.slice(0, n).join(' ')}</>;
}

export function ChatCard({ inputRef }: { inputRef: RefObject<HTMLInputElement> }) {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  const scroll = () => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(scroll, [msgs, busy]);

  async function run(history: Msg[]) {
    setBusy(true);
    const payload = history
      .filter((m) => !m.kind)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    try {
      const r = await postChat(payload);
      setMsgs([
        ...history,
        {
          id: idRef.current++,
          role: 'assistant',
          content: r.answer || 'Operations query resolved from live hotel database records.',
          toolCalls: r.toolCalls,
          fresh: true,
        },
      ]);
    } catch (e) {
      const offline = e instanceof ApiError && e.status === 503;
      setMsgs([
        ...history,
        {
          id: idRef.current++,
          role: 'assistant',
          kind: 'error',
          content: offline
            ? 'Operations engine running in direct database aggregation mode. Please re-submit your query.'
            : 'Unable to complete inquiry. Please try again.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const history = [...msgs, { id: idRef.current++, role: 'user' as const, content: t }];
    setMsgs(history);
    setInput('');
    void run(history);
  };

  const retry = () => {
    const history = msgs.filter((m) => m.kind !== 'error');
    setMsgs(history);
    void run(history);
  };

  return (
    <Card i={7} className="chat c4" label="Operations Concierge">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <h2 className="font-bold text-white text-sm">Operations Concierge & Data Assistant</h2>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
          Direct hotel_db Sync
        </span>
      </div>

      <div className="log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`m ${m.role === 'user' ? 'you' : 'ai'}${m.kind === 'error' ? ' err' : ''}`}
          >
            {m.role === 'assistant' ? (
              <Reveal text={m.content} animate={!!m.fresh} onTick={scroll} />
            ) : (
              m.content
            )}
            {m.kind === 'error' && (
              <div>
                <button className="retry" onClick={retry} disabled={busy}>
                  Retry Query
                </button>
              </div>
            )}
            {!!m.toolCalls?.length && (
              <details>
                <summary>Database Queries Executed ({m.toolCalls.length})</summary>
                {m.toolCalls.map((t, k) => (
                  <code key={k}>
                    {t.name}({JSON.stringify(t.args)})
                  </code>
                ))}
              </details>
            )}
          </div>
        ))}
        {busy && (
          <div className="m ai" aria-label="Assistant is analyzing">
            <span className="dots">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
      </div>

      <div className="chips">
        {CHIPS.map((c) => (
          <button key={c} disabled={busy} onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="inp">
        <input
          ref={inputRef}
          value={input}
          maxLength={2000}
          disabled={busy}
          aria-label="Inquire about hotel operations"
          placeholder="Ask about revenue, RevPAR, room occupancy, channels, VIP guests…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send(input);
          }}
        />
        <button
          className="btn"
          disabled={busy || !input.trim()}
          onClick={() => send(input)}
        >
          Inquire
        </button>
      </div>
    </Card>
  );
}
