import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, postChat } from '../api';
import { reducedMotion } from '../hooks/motion';
import type { ToolCall } from '../types';
import { IconX, IconBell } from './icons';

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
  'Occupancy trend for October',
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

export const ConciergeDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

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
          content: r.answer || 'Query completed using live hotel database metrics.',
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
            ? 'Operations engine is operating in direct database aggregation mode.'
            : 'Unable to process inquiry. Please try again.',
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

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 border-l border-slate-700 h-full p-6 flex flex-col justify-between shadow-2xl animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <IconBell size={16} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Operations Concierge</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live hotel_db Assistant
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <IconX size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Ask any question regarding room sales, reservation records, channel comparisons, or guest billing.
          </p>
        </div>

        {/* Conversation Log */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3" ref={logRef}>
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                m.role === 'user'
                  ? 'ml-auto bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-none font-medium'
                  : 'mr-auto bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none'
              }`}
            >
              {m.role === 'assistant' ? (
                <Reveal text={m.content} animate={!!m.fresh} onTick={scroll} />
              ) : (
                m.content
              )}
            </div>
          ))}
          {busy && (
            <div className="mr-auto bg-slate-800 p-3 rounded-xl text-xs text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Consulting hotel database...
            </div>
          )}
        </div>

        {/* Suggestion Chips & Input */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((c) => (
              <button
                key={c}
                disabled={busy}
                onClick={() => send(c)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              disabled={busy}
              placeholder="Ask the operations concierge..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(input);
              }}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="btn-gold text-xs"
            >
              Inquire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
