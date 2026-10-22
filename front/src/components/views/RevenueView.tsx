import React, { useEffect, useState, useMemo } from 'react';
import type { AnalyticsResponse } from '../../types';
import { getAnalytics, postRevenue } from '../../api';
import { eur } from '../../format';
import { IconDollar, IconRefresh, IconPlus, IconX } from '../icons';

interface RevenueViewProps {
  asOf?: string;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
  onRevenuePosted?: () => void;
}

export const RevenueView: React.FC<RevenueViewProps> = ({ asOf, onToast, onRevenuePosted }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postDept, setPostDept] = useState('Food & Beverage');
  const [postAmount, setPostAmount] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postDate, setPostDate] = useState(asOf || '2026-10-17');
  const [postResRef, setPostResRef] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchRevenue = () => {
    setLoading(true);
    getAnalytics(asOf)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (asOf) setPostDate(asOf);
    fetchRevenue();
  }, [asOf]);

  const handlePostRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(postAmount);
    if (isNaN(amt) || amt <= 0) {
      if (onToast) onToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      setIsPosting(true);
      const res = await postRevenue({
        department: postDept,
        amount: amt,
        description: postDesc.trim() || `${postDept} direct sale`,
        date: postDate || asOf || new Date().toISOString().slice(0, 10),
        reservationId: postResRef.trim() || undefined,
      });

      if (onToast) {
        onToast(`Posted ${eur(amt)} to ${postDept} (${res.yearMonth}) in MongoDB!`, 'success');
      }
      setPostAmount('');
      setPostDesc('');
      setPostResRef('');
      setShowPostModal(false);
      fetchRevenue();
      if (onRevenuePosted) onRevenuePosted();
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Failed to post revenue', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const departmentMeta: Record<string, { color: string; desc: string }> = {
    'Rooms': { color: '#f59e0b', desc: 'Luxury Suites & Deluxe Rooms accommodation revenue' },
    'Food & Beverage': { color: '#10b981', desc: 'Fine dining restaurant, poolside bar, lounge & room service' },
    'Events & Meetings': { color: '#38bdf8', desc: 'Banqueting, wedding galas, and corporate conferences' },
    'Spa & Wellness': { color: '#a855f7', desc: 'Thalassotherapy, hydro-massage, and beauty treatments' },
    'Transport': { color: '#ec4899', desc: 'Airport luxury chauffeur, yacht transfers & private rentals' },
    'Minibar & Extras': { color: '#f97316', desc: 'In-room gourmet treats, laundry & boutique purchases' },
  };

  // Compute live department breakdown from MongoDB departmentMonthly records
  const departments = useMemo(() => {
    const totals: Record<string, number> = {
      'Rooms': 0,
      'Food & Beverage': 0,
      'Events & Meetings': 0,
      'Spa & Wellness': 0,
      'Transport': 0,
      'Minibar & Extras': 0,
    };

    if (data?.departmentMonthly) {
      for (const item of data.departmentMonthly) {
        if (totals[item.department] !== undefined) {
          totals[item.department] += item.revenue || 0;
        } else {
          totals[item.department] = item.revenue || 0;
        }
      }
    }

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(totals).map(([name, amount]) => {
      const meta = departmentMeta[name] || { color: '#64748b', desc: 'Ancillary services & hotel operations' };
      const share = Number(((amount / grandTotal) * 100).toFixed(1));
      return {
        name,
        amount,
        share,
        color: meta.color,
        desc: meta.desc,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Revenue Centers & Department Yield
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              6 Core Departments
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze live revenue streams across accommodations, culinary dining, banqueting, and luxury spa services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPostModal(true)}
            className="btn-gold text-xs"
          >
            <IconPlus size={14} /> Post Revenue
          </button>
          <button
            onClick={fetchRevenue}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh revenue analysis"
          >
            <IconRefresh size={16} />
          </button>
        </div>
      </div>

      {/* Post Revenue Modal */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-fade-in text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconDollar className="text-amber-400" size={18} />
                Post Department Revenue Transaction
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handlePostRevenue} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Select Revenue Center / Department</label>
                <select
                  value={postDept}
                  onChange={(e) => setPostDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="Food & Beverage">Food & Beverage (Culinary & Bars)</option>
                  <option value="Spa & Wellness">Spa & Wellness (Therapies & Hydro)</option>
                  <option value="Events & Meetings">Events & Meetings (Conferences & Galas)</option>
                  <option value="Transport">Transport (Yacht & Chauffeur Services)</option>
                  <option value="Minibar & Extras">Minibar & Boutique Extras</option>
                  <option value="Rooms">Rooms (Direct Suite Accommodation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Gross Revenue (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 1250.00"
                    value={postAmount}
                    onChange={(e) => setPostAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Transaction Date</label>
                  <input
                    type="date"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Reservation Code / Folio ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GAP2026-06453 or blank for House Account"
                  value={postResRef}
                  onChange={(e) => setPostResRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description / Reference Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate Banquet Reception Room B"
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="btn-gold text-xs px-4"
                >
                  {isPosting ? 'Posting to MongoDB...' : 'Commit to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.name} className="glass-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dept.color }}
                ></span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {dept.share}% Share
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mt-3">{dept.name}</h3>
              <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{dept.desc}</p>
              <div className="mt-2 text-sm font-bold font-mono text-amber-400">
                {eur(dept.amount)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${dept.share}%`, backgroundColor: dept.color }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department monthly stream table */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <IconDollar className="text-amber-400" size={18} />
          Department Monthly Revenue Ledger
        </h3>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Compiling revenue ledger...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(data?.departmentMonthly || []).slice(-18).reverse().map((d, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-300">{d.yearMonth}</td>
                    <td className="py-2.5 px-4 font-semibold text-white">{d.department}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-400 text-right">
                      {eur(d.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
