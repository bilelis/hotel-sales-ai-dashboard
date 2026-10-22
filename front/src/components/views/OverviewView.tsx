import React, { useRef } from 'react';
import type { Dashboard } from '../../types';
import { UpdateCard } from '../UpdateCard';
import { KpiCard } from '../KpiCard';
import { DepartmentDonut } from '../DepartmentDonut';
import { ReservationsList } from '../ReservationsList';
import { RevenueBars } from '../RevenueBars';
import { OccupancyGauge } from '../OccupancyGauge';
import { ChatCard } from '../ChatCard';
import { eur } from '../../format';
import { IconPlus, IconBell } from '../icons';

interface OverviewViewProps {
  data: Dashboard;
  onNavigate: (view: string) => void;
  onOpenNewModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data: d,
  onNavigate,
  onOpenNewModal,
}) => {
  const chatInput = useRef<HTMLInputElement>(null);

  const askAi = () => {
    chatInput.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => chatInput.current?.focus({ preventScroll: true }), 400);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Quick Actions Sub-bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Executive Summary for:</span>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
            {d.period}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={askAi}
            className="btn-secondary text-xs"
          >
            <IconBell size={14} className="text-amber-400" /> Concierge Assistant
          </button>
          <button
            onClick={onOpenNewModal}
            className="btn-gold"
          >
            <IconPlus size={15} /> Book Reservation
          </button>
        </div>
      </div>

      {/* Main Grid of Dashboard Cards */}
      <div className="overview-grid">
        <UpdateCard asof={d.asof} yoy={d.yoy} />
        <KpiCard
          i={1}
          label="Total Revenue"
          subtitle="Cumulative sales across all 6 departments"
          value={d.rev}
          delta={d.yoy}
          format={eur}
        />
        <KpiCard
          i={2}
          label="RevPAR (Revenue Per Available Room)"
          subtitle="Total room sales ÷ 60 resort suites (€ / room)"
          value={d.revpar}
          delta={d.revparYoy}
          format={(v) => eur(v, 2)}
        />
        <DepartmentDonut
          dept={d.dept}
          onViewDetails={() => onNavigate('Revenue')}
        />
        <ReservationsList
          res={d.res}
          onViewAll={() => onNavigate('Reservations')}
        />
        <RevenueBars last={d.last} months={d.months} />
        <OccupancyGauge occ={d.occ} />
        <ChatCard inputRef={chatInput} />
      </div>
    </div>
  );
};
