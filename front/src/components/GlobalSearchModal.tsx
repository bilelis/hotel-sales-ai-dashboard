import React, { useEffect, useState } from 'react';
import type { ReservationDetail, GuestItem } from '../types';
import { getReservations, getGuests } from '../api';
import { eur } from '../format';
import { IconSearch, IconX, IconBed } from './icons';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReservation: (res: ReservationDetail) => void;
  onSelectGuest: (id: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectReservation,
  onSelectGuest,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState<ReservationDetail[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setReservations([]);
      setGuests([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [resResp, guestResp] = await Promise.all([
          getReservations({ search: query, limit: 5 }),
          getGuests({ search: query, limit: 5 }),
        ]);
        setReservations(resResp.items || []);
        setGuests(guestResp.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl animate-fade-in text-slate-100 flex flex-col gap-4 max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="relative">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            autoFocus
            type="text"
            placeholder="Search reservations, guests, room numbers, codes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading && (
            <p className="text-center text-xs text-slate-400 py-8">
              Searching hotel database...
            </p>
          )}

          {!loading && !query.trim() && (
            <div className="text-center text-xs text-slate-500 py-8">
              Type guest name (e.g. &ldquo;Bernard&rdquo;), confirmation code (e.g. &ldquo;GAP2026&rdquo;), or room number (e.g. &ldquo;204&rdquo;)
            </div>
          )}

          {!loading && query.trim() && reservations.length === 0 && guests.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-8">
              No matching records found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Reservations matches */}
          {reservations.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                Reservations ({reservations.length})
              </span>
              <div className="space-y-1.5">
                {reservations.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => {
                      onClose();
                      onSelectReservation(r);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {r.confirmationCode}
                        </span>
                        <span className="text-xs font-semibold text-white">{r.guestName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <IconBed size={12} /> Room {r.room?.number} ({r.room?.type})
                        </span>
                        <span>• {String(r.checkIn).slice(0, 10)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {eur(r.totalCharges || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guests matches */}
          {guests.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                Guests ({guests.length})
              </span>
              <div className="space-y-1.5">
                {guests.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      onClose();
                      onSelectGuest(g.id);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-amber-300 font-bold flex items-center justify-center text-xs">
                        {g.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{g.name}</div>
                        <div className="text-[10px] text-slate-400">{g.nationality} • {g.email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {eur(g.spend)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
          <span>Press ESC or click outside to dismiss</span>
          <span>Tip: Global live search</span>
        </div>
      </div>
    </div>
  );
};
