import React, { useEffect, useState } from 'react';
import type { SettingsResponse } from '../../types';
import { getSettings } from '../../api';
import { eur } from '../../format';
import { IconSettings, IconBed, IconRefresh } from '../icons';

interface SettingsViewProps {
  currentAsOf: string;
  onUpdateAsOf: (newDate: string) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentAsOf,
  onUpdateAsOf,
  onToast,
}) => {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [simDate, setSimDate] = useState(currentAsOf);

  const fetchSettings = () => {
    setLoading(true);
    getSettings()
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
    fetchSettings();
  }, []);

  const handleApplyDate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAsOf(simDate);
    onToast(`Operating system date simulated to: ${simDate}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Property Configuration & System Settings
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
              v1.2.0 Enterprise
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage hotel parameters, room inventory, database synchronization, and analytical engines.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2 self-start md:self-auto rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Refresh settings"
        >
          <IconRefresh size={16} />
        </button>
      </div>

      {/* Property Profile & System Status */}
      {loading ? (
        <div className="glass-panel py-20 text-center text-slate-400 text-sm">
          Loading system and property parameters...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <IconSettings className="text-amber-400" size={18} />
                Property Identity & Resort Profile
              </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Hotel Name</span>
              <span className="font-bold text-white">Grand Azur Palace</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Classification</span>
              <span className="font-bold text-amber-400">5-Star Luxury Mediterranean Resort</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Inventory</span>
              <span className="font-bold text-white">{data?.stats.totalRooms || 60} Rooms & Suites</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Total Guest Database</span>
              <span className="font-bold text-white">{data?.stats.totalGuests?.toLocaleString() || '5,133'} Profiles</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Total Historical Bookings</span>
              <span className="font-bold text-white">{data?.stats.totalReservations?.toLocaleString() || '6,453'} Reservations</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Database & Intelligence Engine Health
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Primary Database</span>
              <span className="font-mono font-bold text-emerald-400">MongoDB: {data?.system.database || 'hotel_db'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Database Connection</span>
              <span className="font-bold text-emerald-400">● Connected (Port 27017)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">REST API Backend</span>
              <span className="font-mono font-bold text-white">http://localhost:{data?.system.port || 3001}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">AI LLM Model</span>
              <span className="font-mono font-bold text-amber-400">{data?.system.ollamaModel || 'qwen2.5:7b'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">System Cutoff Date</span>
              <span className="font-mono font-bold text-sky-400">{data?.system.dataAsOf || currentAsOf}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Simulation Control */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white mb-2">
          Operational Date Simulator
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Change the operational reference date to recalculate all hotel revenue, RevPAR, and occupancy curves across historical seasons.
        </p>

        <form onSubmit={handleApplyDate} className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={simDate}
            onChange={(e) => setSimDate(e.target.value)}
            className="px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
          />
          <button type="submit" className="btn-gold">
            Apply Reference Date
          </button>
          <button
            type="button"
            onClick={() => {
              setSimDate('2026-10-17');
              onUpdateAsOf('2026-10-17');
              onToast('Reset to default system date: 2026-10-17', 'success');
            }}
            className="btn-secondary"
          >
            Reset to Default (2026-10-17)
          </button>
        </form>
      </div>

      {/* Room Inventory Categories */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <IconBed className="text-amber-400" size={18} />
          Room Category Hierarchy & Base Rates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.roomTypes || [
            { room_type_id: 1, name: 'Classic Deluxe', description: 'Garden view luxury room', base_rate: 210, max_occupancy: 3, size_sqm: 38 },
            { room_type_id: 2, name: 'Deluxe Sea View', description: 'Sea facing balcony room', base_rate: 270, max_occupancy: 3, size_sqm: 44 },
            { room_type_id: 3, name: 'Junior Suite', description: 'Spacious lounge & dressing suite', base_rate: 380, max_occupancy: 4, size_sqm: 62 },
            { room_type_id: 4, name: 'Executive Suite', description: 'Panoramic terrace, butler service', base_rate: 520, max_occupancy: 4, size_sqm: 85 },
            { room_type_id: 5, name: 'Presidential Suite', description: 'Signature 2-bedroom penthouse', base_rate: 1400, max_occupancy: 6, size_sqm: 180 },
          ]).map((rt) => (
            <div key={rt.room_type_id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{rt.name}</h4>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {eur(rt.base_rate)}/night
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rt.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400 font-medium">
                <span>Max: {rt.max_occupancy} Guests</span>
                <span>Size: {rt.size_sqm} m²</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )}
</div>
);
};
