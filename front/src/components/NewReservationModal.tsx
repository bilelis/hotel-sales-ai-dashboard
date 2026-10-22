import React, { useState, useMemo } from 'react';
import { createReservation } from '../api';
import type { ReservationDetail } from '../types';
import { IconX, IconPlus, IconBed, IconCalendar, IconUsers, IconDollar } from './icons';
import { eur } from '../format';

interface NewReservationModalProps {
  onClose: () => void;
  onCreated: (newRes: ReservationDetail) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

const ROOM_CATEGORIES = [
  { name: 'Classic Deluxe', defaultRate: 210, defaultRoom: '204', desc: 'Garden & courtyard view, 35m²' },
  { name: 'Deluxe Sea View', defaultRate: 270, defaultRoom: '305', desc: 'Panoramic Mediterranean sea view, 42m²' },
  { name: 'Junior Suite', defaultRate: 380, defaultRoom: '402', desc: 'Lounge area, private terrace, 58m²' },
  { name: 'Executive Suite', defaultRate: 520, defaultRoom: '501', desc: 'High floor, marble bath, butler, 78m²' },
  { name: 'Presidential Suite', defaultRate: 1400, defaultRoom: '601', desc: 'Top floor penthouse, private jacuzzi, 140m²' },
];

const NATIONALITIES = [
  'France',
  'United Kingdom',
  'United States',
  'Germany',
  'Switzerland',
  'Monaco',
  'Italy',
  'Spain',
  'United Arab Emirates',
  'Canada',
  'Japan',
  'Other',
];

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  onClose,
  onCreated,
  onToast,
}) => {
  const [guestName, setGuestName] = useState('');
  const [nationality, setNationality] = useState('France');
  const [roomType, setRoomType] = useState('Deluxe Sea View');
  const [roomNumber, setRoomNumber] = useState('305');
  const [channel, setChannel] = useState('Direct Website');
  const [checkIn, setCheckIn] = useState('2026-10-18');
  const [checkOut, setCheckOut] = useState('2026-10-21');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rate, setRate] = useState(270);
  const [mealPlan, setMealPlan] = useState('Bed & Breakfast');
  const [status, setStatus] = useState<'Confirmed' | 'In-house'>('Confirmed');
  const [busy, setBusy] = useState(false);

  // Compute stay duration in nights
  const nights = useMemo(() => {
    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    const diff = Math.round((+dOut - +dIn) / 864e5);
    return Math.max(1, isNaN(diff) ? 1 : diff);
  }, [checkIn, checkOut]);

  // Total reservation charges
  const totalAmount = useMemo(() => {
    return nights * (Number(rate) || 0);
  }, [nights, rate]);

  const handleRoomTypeChange = (newType: string) => {
    setRoomType(newType);
    const matched = ROOM_CATEGORIES.find((c) => c.name === newType);
    if (matched) {
      setRate(matched.defaultRate);
      setRoomNumber(matched.defaultRoom);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      onToast('Please enter the guest full name', 'error');
      return;
    }

    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);

    if (dOut <= dIn) {
      onToast('Check-out date must be strictly after check-in date', 'error');
      return;
    }

    try {
      setBusy(true);
      const res = await createReservation({
        guestName: guestName.trim(),
        guestNationality: nationality,
        room: { number: roomNumber.trim() || '101', type: roomType },
        channel: { name: channel, type: channel === 'Direct Website' || channel === 'Walk-in' ? 'Direct' : 'OTA' },
        checkIn: dIn.toISOString() as any,
        checkOut: dOut.toISOString() as any,
        nights,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        ratePerNight: Number(rate) || 100,
        status,
        mealPlan,
        purpose: 'Leisure',
        totalCharges: totalAmount,
      });

      onToast(`Reservation created successfully: ${res.reservation.confirmationCode}`, 'success');
      onCreated(res.reservation);
      onClose();
    } catch (err: any) {
      onToast(err.message || 'Failed to create reservation', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl animate-fade-in text-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <IconBed size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Create New Reservation</h3>
              <p className="text-xs text-slate-400">Grand Azur Front-Desk & PMS Booking System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: Guest Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800/70 text-xs font-bold uppercase tracking-wider text-slate-300">
              <IconUsers size={14} className="text-amber-400" />
              <span>Guest Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  <span>Guest Full Name <span className="req">*</span></span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Viscount Charles Spencer"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">
                  <span>Nationality / Country</span>
                </label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="form-select"
                >
                  {NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Room & Stay Dates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <IconCalendar size={14} className="text-amber-400" />
                <span>Room & Stay Dates</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                {nights} {nights === 1 ? 'Night' : 'Nights'} Stay
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  <span>Room Category</span>
                </label>
                <select
                  value={roomType}
                  onChange={(e) => handleRoomTypeChange(e.target.value)}
                  className="form-select"
                >
                  {ROOM_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} (€{cat.defaultRate}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  <span>Assigned Room Number</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 305"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  <span>Check-In Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">
                  <span>Check-Out Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Billing, Channel & Guests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800/70 text-xs font-bold uppercase tracking-wider text-slate-300">
              <IconDollar size={14} className="text-amber-400" />
              <span>Billing, Channel & Occupancy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">
                  <span>Nightly Rate (€)</span>
                </label>
                <input
                  type="number"
                  min="40"
                  max="5000"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="form-input font-mono"
                />
              </div>

              <div>
                <label className="form-label">
                  <span>Booking Channel</span>
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="form-select"
                >
                  <option value="Direct Website">Direct Website (0% comm)</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Travel Agency">Travel Agency</option>
                  <option value="Walk-in">Walk-in Reception</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  <span>Booking Status</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="form-select"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="In-house">In-house (Checked-in)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">
                  <span>Adults</span>
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  <span>Children</span>
                </label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  <span>Meal Plan</span>
                </label>
                <select
                  value={mealPlan}
                  onChange={(e) => setMealPlan(e.target.value)}
                  className="form-select"
                >
                  <option value="Room Only">Room Only</option>
                  <option value="Bed & Breakfast">Bed & Breakfast</option>
                  <option value="Half Board">Half Board</option>
                  <option value="Full Board">Full Board</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Booking Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/80 to-slate-800/80 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">Stay Summary</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-white text-xs font-semibold">{roomType} (Room {roomNumber})</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {checkIn} → {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'}) • {adults} {adults === 1 ? 'Adult' : 'Adults'} • {mealPlan}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Estimated Folio</span>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-xs text-slate-400 font-mono">({nights} × {eur(rate)}) =</span>
                <span className="text-lg font-black text-amber-400 font-mono tracking-tight">
                  {eur(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-gold px-5 py-2.5 text-xs font-bold shadow-lg"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Saving Booking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <IconPlus size={16} />
                  Confirm & Save Booking ({eur(totalAmount)})
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
