import { useEffect, useState } from 'react';
import type { GuestItem } from '../../types';
import { getGuests } from '../../api';
import { eur } from '../../format';
import { IconSearch, IconRefresh } from '../icons';

interface GuestsViewProps {
  onSelectGuest: (id: number) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const GuestsView: React.FC<GuestsViewProps> = ({
  onSelectGuest,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [vipLevel, setVipLevel] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 12;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    items: GuestItem[];
    total: number;
    totalPages: number;
  }>({ items: [], total: 0, totalPages: 1 });

  const fetchGuests = () => {
    setLoading(true);
    getGuests({
      page,
      limit,
      search,
      vipLevel,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        onToast(err.message || 'Error fetching guests', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGuests();
  }, [page, limit, vipLevel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchGuests();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const getVipBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'platinum':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'gold':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'silver':
        return 'bg-slate-300/20 text-slate-200 border-slate-400/40';
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Guest Directory & VIP CRM
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              {data.total.toLocaleString()} Profiles
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse guest loyalty, contact details, total lifetime spend, and reservation histories.
          </p>
        </div>

        <button
          onClick={fetchGuests}
          className="p-2 self-start md:self-auto rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Refresh guests"
        >
          <IconRefresh size={16} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1">VIP Tier:</span>
          {['All', 'Platinum', 'Gold', 'Silver', 'Standard'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setVipLevel(lvl);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                vipLevel === lvl
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, nationality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Guests Cards Grid */}
      {loading ? (
        <div className="glass-panel py-24 text-center text-slate-400 text-sm">
          Loading guest profiles from database...
        </div>
      ) : data.items.length === 0 ? (
        <div className="glass-panel py-24 text-center text-slate-500 text-sm">
          No guests matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((g) => (
            <div
              key={g.id}
              onClick={() => onSelectGuest(g.id)}
              className="glass-panel p-5 hover:border-amber-500/50 transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 text-amber-300 font-bold flex items-center justify-center text-sm shadow-inner group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-slate-950 transition">
                      {g.name?.slice(0, 2).toUpperCase() || 'GT'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                        {g.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {g.nationality || 'International'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getVipBadge(g.vipLevel)}`}>
                    {g.vipLevel || 'Standard'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Spend</span>
                    <span className="font-mono font-bold text-amber-400 mt-0.5 block">
                      {eur(g.spend)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Stays</span>
                    <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                      {g.stays} {g.stays === 1 ? 'Stay' : 'Stays'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <p className="truncate" title={g.email}>✉ {g.email || 'No email'}</p>
                  <p className="truncate">☏ {g.phone || 'No phone'}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Last stay: {g.lastStay || 'Active'}</span>
                <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition inline-flex items-center gap-1">
                  View Profile →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="glass-panel p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{data.totalPages}</span> ({data.total.toLocaleString()} total guests)
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition font-medium"
          >
            Previous
          </button>
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
  );
};
