import React, { useEffect, useState } from 'react';
import type { ReservationDetail } from '../../types';
import { getReservations, updateReservationStatus } from '../../api';
import { eur } from '../../format';
import { IconSearch, IconPlus, IconRefresh, IconBed, IconCheck, IconX } from '../icons';

interface ReservationsViewProps {
  onSelectReservation: (res: ReservationDetail) => void;
  onOpenNewModal: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onReservationUpdated?: () => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  onSelectReservation,
  onOpenNewModal,
  onToast,
  onReservationUpdated,
}) => {
  const [status, setStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    items: ReservationDetail[];
    total: number;
    totalPages: number;
  }>({ items: [], total: 0, totalPages: 1 });

  const fetchList = () => {
    setLoading(true);
    getReservations({
      page,
      limit,
      status,
      search,
      sortBy: 'checkIn',
      sortOrder: 'desc',
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        onToast(err.message || 'Error fetching reservations', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchList();
  }, [page, limit, status]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchList();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleQuickStatus = async (
    e: React.MouseEvent,
    id: number,
    newStatus: 'In-house' | 'Checked-out' | 'Cancelled'
  ) => {
    e.stopPropagation();
    try {
      await updateReservationStatus(id, newStatus);
      onToast(`Reservation updated to ${newStatus}`, 'success');
      fetchList();
      if (onReservationUpdated) onReservationUpdated();
    } catch (err: any) {
      onToast(err.message || 'Failed to update', 'error');
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'In-house': return 'badge-inhouse';
      case 'Checked-out': case 'Completed': return 'badge-completed';
      case 'Confirmed': return 'badge-confirmed';
      default: return 'badge-cancelled';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Reservations & Front Desk
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              {data.total.toLocaleString()} Bookings
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time hotel inventory, guest check-in, folio management, and booking logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchList}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh list"
          >
            <IconRefresh size={16} />
          </button>
          <button
            onClick={onOpenNewModal}
            className="btn-gold"
          >
            <IconPlus size={16} /> New Reservation
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'In-house', 'Confirmed', 'Checked-out', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatus(tab);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                status === tab
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search code, guest name, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Main Reservations Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Room</th>
                <th className="py-3.5 px-4">Stay Dates</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    Loading reservation inventory from database...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    No reservations found matching the current filters.
                  </td>
                </tr>
              ) : (
                data.items.map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => onSelectReservation(r)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 group-hover:text-amber-300">
                      {r.confirmationCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-amber-100">{r.guestName}</div>
                      <div className="text-[10px] text-slate-400">{r.guestNationality || 'Guest'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <IconBed size={14} className="text-amber-400/80" />
                        Room {r.room?.number}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{r.room?.type}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{String(r.checkIn).slice(0, 10)} → {String(r.checkOut).slice(0, 10)}</div>
                      <div className="text-[10px] text-slate-400">{r.nights} {r.nights === 1 ? 'night' : 'nights'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {r.channel?.name || 'Direct'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {eur(r.totalCharges || (r.nights * (r.ratePerNight || 0)))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={getStatusBadge(r.status)}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {r.status === 'Confirmed' && (
                          <button
                            onClick={(e) => handleQuickStatus(e, r._id, 'In-house')}
                            className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold border border-amber-500/30 transition flex items-center gap-1"
                            title="Check-in guest"
                          >
                            <IconCheck size={11} /> Check In
                          </button>
                        )}
                        {r.status === 'In-house' && (
                          <button
                            onClick={(e) => handleQuickStatus(e, r._id, 'Checked-out')}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold border border-emerald-500/30 transition flex items-center gap-1"
                            title="Check-out & settle"
                          >
                            <IconCheck size={11} /> Check Out
                          </button>
                        )}
                        {r.status !== 'Cancelled' && r.status !== 'Checked-out' && (
                          <button
                            onClick={(e) => handleQuickStatus(e, r._id, 'Cancelled')}
                            className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[10px] font-bold border border-rose-500/20 transition flex items-center gap-1"
                            title="Cancel booking"
                          >
                            <IconX size={11} /> Cancel
                          </button>
                        )}
                        <button
                          onClick={() => onSelectReservation(r)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] font-semibold transition"
                        >
                          Folio →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>entries (Showing page {page} of {data.totalPages})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition font-medium"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-slate-300 font-mono font-bold">
              {page} / {data.totalPages}
            </span>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
