import React from 'react';
import { GrandAzurLogo } from './GrandAzurLogo';
import { IconSearch, IconBell, IconMenu } from './icons';

interface TopbarProps {
  activeTab: string;
  onAsk: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
  currentAsOf: string;
  onSelectPeriod: (asOf: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onAsk,
  onOpenSearch,
  onOpenMobileMenu,
  currentAsOf,
  onSelectPeriod,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left side: Mobile menu toggle & page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Open navigation menu"
        >
          <IconMenu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block">
            <GrandAzurLogo size="sm" iconOnly={true} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {activeTab}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live hotel_db
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block -mt-0.5">
              Grand Azur Palace Management Console • Analyse de Données
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Global search, period filter, Ask AI */}
      <div className="flex items-center gap-2.5">
        {/* Global Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600 transition text-xs font-medium cursor-pointer"
          title="Search hotel records"
        >
          <IconSearch size={15} />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            Ctrl K
          </kbd>
        </button>

        {/* Period Selector Dropdown */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          <select
            value={currentAsOf}
            onChange={(e) => onSelectPeriod(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="2026-10-17">YTD 2026 (Oct 17)</option>
            <option value="2026-08-31">Summer Peak 2026</option>
            <option value="2026-06-30">Mid-Year 2026</option>
            <option value="2025-12-31">Full Year 2025</option>
          </select>
        </div>

        {/* Concierge Assistant Button */}
        <button
          onClick={onAsk}
          className="btn-gold text-xs"
          title="Open Front Desk Concierge Assistant"
        >
          <IconBell size={14} />
          <span className="hidden sm:inline">Concierge</span>
        </button>
      </div>
    </header>
  );
};
