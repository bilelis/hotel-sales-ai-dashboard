import React from 'react';
import { GrandAzurLogo } from './GrandAzurLogo';
import {
  IconDashboard,
  IconCalendar,
  IconUsers,
  IconTrending,
  IconDollar,
  IconChannels,
  IconSettings,
  IconDatabase,
  IconX,
  IconLogout,
} from './icons';
import type { AuthUser } from '../api';

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { id: 'Overview', label: 'Executive Overview', icon: IconDashboard },
  { id: 'Reservations', label: 'Reservations & Front Desk', icon: IconCalendar },
  { id: 'Guests', label: 'Guests & VIPs', icon: IconUsers },
  { id: 'Tables', label: 'Database Hub (All Tables)', icon: IconDatabase },
  { id: 'Statistics', label: 'Hospitality Analytics', icon: IconTrending },
  { id: 'Revenue', label: 'Revenue Centers', icon: IconDollar },
  { id: 'Channels', label: 'Distribution Channels', icon: IconChannels },
  { id: 'Settings', label: 'Resort Settings', icon: IconSettings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  user,
  onLogout,
}) => {
  const content = (
    <aside className="w-64 flex-none bg-slate-950/95 border-r border-slate-800/80 p-5 flex flex-col justify-between h-full overflow-y-auto select-none">
      <div>
        {/* Brand Header with Grand Azur Custom Luxury Vector Logo */}
        <div className="pb-5 mb-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <GrandAzurLogo size="md" showSubtitle={false} />

            {/* Close button for mobile drawer */}
            {isOpenMobile && onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850"
              >
                <IconX size={18} />
              </button>
            )}
          </div>

          <div className="px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>CONSOLE DE GESTION</span>
            <span className="text-teal-400 font-bold tracking-wider">ANALYSE DE DONNÉES</span>
          </div>
        </div>

        {/* Section Label */}
        <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 mb-2">
          Management
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border-l-4 border-amber-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User / GM Profile Card at Bottom with Sign Out */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
            {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'GM')}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              {user?.name || 'General Manager'}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {user?.role || 'Admin'} • Online
            </span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
              title="Sign Out / Lock Screen"
              aria-label="Sign Out"
            >
              <IconLogout size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex animate-fade-in"
          onClick={onCloseMobile}
        >
          <div className="w-72 h-full" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
