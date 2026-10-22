import React, { useEffect, useState } from 'react';
import type { GuestProfileDetail, ReservationDetail } from '../types';
import { getGuestById } from '../api';
import { eur } from '../format';
import { IconX, IconBed, IconCalendar } from './icons';

interface GuestModalProps {
  guestId: number | null;
  onClose: () => void;
  onOpenReservation?: (res: ReservationDetail) => void;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  guestId,
  onClose,
  onOpenReservation,
}) => {
  if (!guestId) return null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GuestProfileDetail | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getGuestById(guestId)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [guestId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-fade-in text-slate-100 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-lg shadow-md">
              {data?.guest.first_name?.[0] || 'G'}{data?.guest.last_name?.[0] || ''}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {data ? `${data.guest.first_name} ${data.guest.last_name}` : 'Loading guest...'}
              </h3>
              <p className="text-xs text-slate-400">
                {data?.guest.nationality} • VIP Tier: <span className="text-amber-400 font-semibold">{data?.guest.vip_level || 'Standard'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <IconX size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Fetching guest profile & history...
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-rose-400 text-sm">
            Guest records could not be loaded.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Contact & Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Lifetime Spend</span>
                <span className="text-base font-extrabold text-amber-400 font-mono mt-1 block">
                  {eur(data.totalSpend)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Stays</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono mt-1 block">
                  {data.totalStays} {data.totalStays === 1 ? 'Stay' : 'Stays'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact</span>
                <span className="text-xs text-slate-300 truncate mt-1 block" title={data.guest.email}>
                  {data.guest.email || 'No email'}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {data.guest.phone || 'No phone'}
                </span>
              </div>
            </div>

            {/* Stay History List */}
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-2">
                Stay History & Bookings ({data.reservations.length})
              </span>
              <div className="space-y-2">
                {data.reservations.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => {
                      if (onOpenReservation) {
                        onClose();
                        onOpenReservation(r);
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {r.confirmationCode}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          r.status === 'In-house' ? 'bg-amber-500/20 text-amber-300' :
                          r.status === 'Checked-out' || (r.status as string) === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          r.status === 'Confirmed' ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <IconBed size={12} /> Room {r.room?.number} ({r.room?.type})
                        </span>
                        <span className="flex items-center gap-1">
                          <IconCalendar size={12} /> {String(r.checkIn).slice(0, 10)} → {String(r.checkOut).slice(0, 10)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-slate-200 block">
                        {eur(r.totalCharges || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {r.channel?.name || 'Direct'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
