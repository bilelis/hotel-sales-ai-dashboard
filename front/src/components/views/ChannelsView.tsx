import React, { useEffect, useState } from 'react';
import type { ChannelStat } from '../../types';
import { getChannels } from '../../api';
import { eur } from '../../format';
import { IconChannels, IconRefresh } from '../icons';

export const ChannelsView: React.FC<{ asOf?: string }> = ({ asOf }) => {
  const [channels, setChannels] = useState<ChannelStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = () => {
    setLoading(true);
    getChannels(asOf)
      .then((res) => {
        setChannels(res.channels || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChannels();
  }, [asOf]);

  const totalRoomRevenue = channels.reduce((acc, c) => acc + (c.roomRevenue || 0), 0) || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Distribution Channels & OTA Analytics
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              {channels.length} Booking Channels
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate performance between direct website bookings and online travel agencies (OTAs).
          </p>
        </div>

        <button
          onClick={fetchChannels}
          className="p-2 self-start md:self-auto rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Refresh channel matrix"
        >
          <IconRefresh size={16} />
        </button>
      </div>

      {/* Main Channel Performance Matrix Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <IconChannels className="text-amber-400" size={16} />
            Channel Production & Cancellation Matrix
          </h3>
          <span className="text-xs text-slate-400">
            Total Channel Room Revenue: <strong className="text-amber-400 font-mono">{eur(totalRoomRevenue)}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            Fetching distribution metrics...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Channel Name</th>
                  <th className="py-3 px-4 text-center">Bookings</th>
                  <th className="py-3 px-4 text-center">Cancellation %</th>
                  <th className="py-3 px-4 text-center">Room Nights</th>
                  <th className="py-3 px-4 text-center" title="Average Daily Rate - Average price paid per booked night">
                    Average Daily Rate (ADR €)
                  </th>
                  <th className="py-3 px-4 text-right">Room Revenue</th>
                  <th className="py-3 px-4 text-right">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {channels.map((c) => {
                  const sharePct = ((c.roomRevenue / totalRoomRevenue) * 100).toFixed(1);
                  return (
                    <tr key={c.channel} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.channel === 'Direct Website' ? 'bg-amber-400' : 'bg-slate-500'}`}></span>
                        {c.channel}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-200">
                        {c.bookings?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                          c.cancellationRatePct > 15 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {c.cancellationRatePct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {c.roomNights?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {eur(c.adr)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {eur(c.roomRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-slate-300">{sharePct}%</span>
                          <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${sharePct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Channel Strategy Card */}
      <div className="glass-panel p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-bold text-white mb-2">Direct Booking Profitability Insight</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            The <strong>Direct Website</strong> channel delivers the highest average daily rate with an ultra-low cancellation rate compared to major OTAs like Booking.com. Maintaining a direct booking share above 25% significantly decreases merchant commission overheads.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white mb-2">OTA Commission Management</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Corporate and Travel Agency segments demonstrate strong off-season resilience and longer lengths of stay. Dynamic rate parity across channels ensures rate integrity and premium Mediterranean brand positioning.
          </p>
        </div>
      </div>
    </div>
  );
};
