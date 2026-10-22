import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { OverviewView } from './components/views/OverviewView';
import { ReservationsView } from './components/views/ReservationsView';
import { GuestsView } from './components/views/GuestsView';
import { StatisticsView } from './components/views/StatisticsView';
import { RevenueView } from './components/views/RevenueView';
import { ChannelsView } from './components/views/ChannelsView';
import { SettingsView } from './components/views/SettingsView';
import { DatabaseExplorerView } from './components/views/DatabaseExplorerView';
import { FolioModal } from './components/FolioModal';
import { NewReservationModal } from './components/NewReservationModal';
import { GuestModal } from './components/GuestModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ConciergeDrawer } from './components/ConciergeDrawer';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { DashboardSkeleton, ErrorCard } from './components/Skeletons';
import { LoginPage } from './components/auth/LoginPage';
import { useDashboard } from './hooks/useDashboard';
import { logoutAuth, type AuthUser } from './api';
import type { ReservationDetail } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('grand_azur_auth_user');
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [currentAsOf, setCurrentAsOf] = useState<string>('2026-10-17');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState<boolean>(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState<boolean>(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetail | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const q = useDashboard(currentAsOf);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAskConcierge = () => {
    setIsConciergeOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logoutAuth();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('grand_azur_auth_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    addToast('You have been signed out successfully.', 'info');
  };

  // Render full-screen luxury Login page if user is not authenticated
  if (!currentUser) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#090d16] text-white font-sans">
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            try {
              localStorage.setItem('grand_azur_auth_user', JSON.stringify(user));
            } catch {
              // ignore
            }
          }}
          onToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#090d16] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Topbar
          activeTab={activeTab}
          onAsk={handleAskConcierge}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentAsOf={currentAsOf}
          onSelectPeriod={(period) => {
            setCurrentAsOf(period);
            addToast(`Reference period changed to ${period}`, 'info');
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === 'Overview' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-2 border-b border-slate-800/80 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    Executive Dashboard
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Grand Azur Palace Mediterranean Resort • Live Sales, Inventory & Guest Intelligence
                  </p>
                </div>
                {q.data && (
                  <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono font-bold text-amber-400">
                    Period: {q.data.period}
                  </div>
                )}
              </div>

              {q.isPending ? (
                <DashboardSkeleton />
              ) : !q.data ? (
                <ErrorCard
                  message={q.error instanceof Error ? q.error.message : 'Unknown error loading dashboard'}
                  onRetry={() => void q.refetch()}
                  busy={q.isFetching}
                />
              ) : (
                <OverviewView
                  data={q.data}
                  onNavigate={setActiveTab}
                  onOpenNewModal={() => setIsNewReservationOpen(true)}
                />
              )}
            </div>
          )}

          {activeTab === 'Reservations' && (
            <ReservationsView
              onSelectReservation={(r) => setSelectedReservation(r)}
              onOpenNewModal={() => setIsNewReservationOpen(true)}
              onToast={addToast}
              onReservationUpdated={() => void q.refetch()}
            />
          )}

          {activeTab === 'Guests' && (
            <GuestsView
              onSelectGuest={(id) => setSelectedGuestId(id)}
              onToast={addToast}
            />
          )}

          {activeTab === 'Tables' && (
            <DatabaseExplorerView onToast={addToast} />
          )}

          {activeTab === 'Statistics' && (
            <StatisticsView asOf={currentAsOf} />
          )}

          {activeTab === 'Revenue' && (
            <RevenueView
              asOf={currentAsOf}
              onToast={addToast}
              onRevenuePosted={() => void q.refetch()}
            />
          )}

          {activeTab === 'Channels' && (
            <ChannelsView asOf={currentAsOf} />
          )}

          {activeTab === 'Settings' && (
            <SettingsView
              currentAsOf={currentAsOf}
              onUpdateAsOf={(newDate) => setCurrentAsOf(newDate)}
              onToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Operations Concierge Slide-over Drawer */}
      <ConciergeDrawer
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
      />

      {/* Global Interactive Modals & Drawers */}
      <FolioModal
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onStatusUpdated={(updated) => {
          setSelectedReservation(updated);
          void q.refetch();
        }}
        onToast={addToast}
      />

      {isNewReservationOpen && (
        <NewReservationModal
          onClose={() => setIsNewReservationOpen(false)}
          onCreated={(newRes) => {
            void q.refetch();
            setSelectedReservation(newRes);
          }}
          onToast={addToast}
        />
      )}

      {selectedGuestId && (
        <GuestModal
          guestId={selectedGuestId}
          onClose={() => setSelectedGuestId(null)}
          onOpenReservation={(r) => setSelectedReservation(r)}
        />
      )}

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectReservation={(r) => setSelectedReservation(r)}
        onSelectGuest={(id) => setSelectedGuestId(id)}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
}
