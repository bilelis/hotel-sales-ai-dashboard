import React, { useState } from 'react';
import type { ReservationDetail } from '../types';
import { updateReservationStatus, addFolioCharge } from '../api';
import { eur } from '../format';
import { IconX, IconCheck, IconBed, IconPlus, IconDollar } from './icons';

interface FolioModalProps {
  reservation: ReservationDetail | null;
  onClose: () => void;
  onStatusUpdated?: (updated: ReservationDetail) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const FolioModal: React.FC<FolioModalProps> = ({
  reservation,
  onClose,
  onStatusUpdated,
  onToast,
}) => {
  if (!reservation) return null;

  const [busy, setBusy] = useState(false);
  const [currentRes, setCurrentRes] = useState<ReservationDetail>(reservation);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeDept, setChargeDept] = useState('Food & Beverage');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargePosting, setChargePosting] = useState(false);

  const handleStatusChange = async (newStatus: 'In-house' | 'Checked-out' | 'Cancelled' | 'Confirmed') => {
    try {
      setBusy(true);
      const res = await updateReservationStatus(currentRes._id, newStatus);
      setCurrentRes(res.reservation);
      if (onStatusUpdated) onStatusUpdated(res.reservation);
      onToast(`Reservation ${currentRes.confirmationCode} marked as ${newStatus}`, 'success');
    } catch (err: any) {
      onToast(err.message || 'Failed to update status', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt <= 0) {
      onToast('Please enter a valid charge amount', 'error');
      return;
    }
    if (!chargeDesc.trim()) {
      onToast('Please enter a description for this charge', 'error');
      return;
    }

    try {
      setChargePosting(true);
      const res = await addFolioCharge(currentRes._id, {
        department: chargeDept,
        amount: amt,
        description: chargeDesc.trim(),
        date: new Date().toISOString().slice(0, 10),
      });

      setCurrentRes(res.reservation);
      if (onStatusUpdated) onStatusUpdated(res.reservation);
      onToast(`Charge of ${eur(amt)} posted to ${chargeDept} in MongoDB!`, 'success');
      setChargeAmount('');
      setChargeDesc('');
      setShowAddCharge(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to post charge', 'error');
    } finally {
      setChargePosting(false);
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'In-house': return 'badge-inhouse';
      case 'Checked-out': case 'Completed': return 'badge-completed';
      case 'Confirmed': return 'badge-confirmed';
      default: return 'badge-cancelled';
    }
  };

  const totalCharges = currentRes.charges?.reduce((acc, c) => acc + (c.amount || 0), 0) || currentRes.totalCharges || 0;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-700 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono tracking-tight text-amber-400">
                {currentRes.confirmationCode}
              </span>
              <span className={getBadgeClass(currentRes.status)}>
                {currentRes.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Booked via {currentRes.channel?.name || 'Direct Website'} • {new Date(currentRes.bookingDate || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Guest & Room Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Guest Information
            </span>
            <h4 className="text-base font-bold text-white">{currentRes.guestName}</h4>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <p>Nationality: <span className="text-white font-medium">{currentRes.guestNationality || 'Not specified'}</span></p>
              <p>Guests: <span className="text-white font-medium">{currentRes.adults} Adults{currentRes.children ? `, ${currentRes.children} Children` : ''}</span></p>
              <p>Meal Plan: <span className="text-white font-medium">{currentRes.mealPlan || 'Standard'}</span></p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Room & Stay
            </span>
            <div className="flex items-center gap-2">
              <IconBed className="text-amber-400" size={16} />
              <h4 className="text-base font-bold text-white">Room {currentRes.room?.number}</h4>
            </div>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <p>Type: <span className="text-amber-300 font-medium">{currentRes.room?.type}</span></p>
              <p>Check-In: <span className="text-white font-medium">{String(currentRes.checkIn).slice(0, 10)}</span></p>
              <p>Check-Out: <span className="text-white font-medium">{String(currentRes.checkOut).slice(0, 10)}</span> ({currentRes.nights} nights)</p>
            </div>
          </div>
        </div>

        {/* Quick Action Status Bar */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">
            Front-Desk Action
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy || currentRes.status === 'In-house'}
              onClick={() => handleStatusChange('In-house')}
              className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
            >
              <IconCheck size={14} /> Check In Guest
            </button>
            <button
              disabled={busy || currentRes.status === 'Checked-out'}
              onClick={() => handleStatusChange('Checked-out')}
              className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
            >
              <IconCheck size={14} /> Check Out & Settle
            </button>
            <button
              disabled={busy || currentRes.status === 'Cancelled'}
              onClick={() => handleStatusChange('Cancelled')}
              className="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1.5"
            >
              <IconX size={14} /> Cancel Reservation
            </button>
          </div>
        </div>

        {/* Itemized Folio Charges */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Folio Account & Itemized Charges ({currentRes.charges?.length || 0})
            </span>
            <button
              onClick={() => setShowAddCharge(!showAddCharge)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1"
            >
              <IconPlus size={12} /> {showAddCharge ? 'Cancel' : 'Add Charge'}
            </button>
          </div>

          {/* Add Charge Panel */}
          {showAddCharge && (
            <form onSubmit={handleAddCharge} className="p-4 mb-3 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-3 animate-fade-in">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <IconDollar size={14} /> Post Real-Time Folio Charge
              </h5>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Department</label>
                  <select
                    value={chargeDept}
                    onChange={(e) => setChargeDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="Food & Beverage">Food & Beverage (Culinary)</option>
                    <option value="Spa & Wellness">Spa & Wellness (Treatments)</option>
                    <option value="Events & Meetings">Events & Meetings</option>
                    <option value="Transport">Transport (Limousine/Yacht)</option>
                    <option value="Minibar & Extras">Minibar & Extras</option>
                    <option value="Rooms">Rooms (Upgrade / Extra night)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 85.00"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fine Dining dinner at L'Azur Restaurant"
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
                  required
                />
              </div>

              {/* Quick suggestion tags */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {['Fine Dining Dinner €95', 'Spa Hydro-Massage €120', 'Chauffeur Transfer €45', 'Minibar Gourmet €35'].map((pill) => {
                  const [desc, val] = pill.split(' €');
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => {
                        setChargeDesc(desc);
                        setChargeAmount(val);
                        if (desc.includes('Dining')) setChargeDept('Food & Beverage');
                        if (desc.includes('Spa')) setChargeDept('Spa & Wellness');
                        if (desc.includes('Chauffeur')) setChargeDept('Transport');
                        if (desc.includes('Minibar')) setChargeDept('Minibar & Extras');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={chargePosting}
                  className="btn-gold text-xs px-4 py-1.5"
                >
                  {chargePosting ? 'Posting to DB...' : 'Post Charge to Database'}
                </button>
              </div>
            </form>
          )}

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 divide-y divide-slate-800/80">
            {(!currentRes.charges || currentRes.charges.length === 0) ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No extra charges billed yet. Room charges calculated at check-out.
              </div>
            ) : (
              currentRes.charges.map((c, i) => (
                <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/30 transition">
                  <div>
                    <span className="font-semibold text-white block">{c.description || 'Charge'}</span>
                    <span className="text-[10px] text-slate-400">
                      {c.department} • {c.date ? String(c.date).slice(0, 10) : ''}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    {eur(c.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Folio Total Balance */}
        <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Folio Charges</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {eur(totalCharges)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close Folio
          </button>
        </div>
      </div>
    </div>
  );
};
