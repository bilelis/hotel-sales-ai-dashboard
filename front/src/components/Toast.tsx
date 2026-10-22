import React from 'react';
import { IconCheck, IconX } from './icons';

export interface ToastMessage {
  id: number;
  text: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl border flex items-center justify-between gap-3 animate-fade-in text-xs font-semibold ${
            t.type === 'error'
              ? 'bg-rose-950/95 border-rose-600 text-rose-200'
              : 'bg-slate-900/95 border-amber-500/50 text-amber-200 shadow-amber-500/10'
          }`}
        >
          <div className="flex items-center gap-2">
            {t.type === 'error' ? (
              <span className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                <IconX size={14} />
              </span>
            ) : (
              <span className="p-1 rounded-full bg-amber-500/20 text-amber-400">
                <IconCheck size={14} />
              </span>
            )}
            <span>{t.text}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <IconX size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
