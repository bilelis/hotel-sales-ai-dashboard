import type { Db, Filter } from 'mongodb';
import { COLLECTIONS } from '../database/collections.js';
import type { ReservationDocument } from '../models/reservation.model.js';

export interface ReservationFilterOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ReservationRepository {
  constructor(private db: Db) {}

  private col() {
    return this.db.collection<ReservationDocument>(COLLECTIONS.RESERVATIONS);
  }

  public async find(options: ReservationFilterOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Filter<ReservationDocument> = {};

    if (options.status && options.status !== 'All') {
      filter.status = options.status as any;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      filter.$or = [
        { confirmationCode: { $regex: q, $options: 'i' } },
        { guestName: { $regex: q, $options: 'i' } },
        { 'room.number': { $regex: q, $options: 'i' } },
        { 'room.type': { $regex: q, $options: 'i' } },
      ];
    }

    const sortField = options.sortBy || 'checkIn';
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDir, _id: -1 };

    const [total, items] = await Promise.all([
      this.col().countDocuments(filter),
      this.col().find(filter).sort(sort).skip(skip).limit(limit).toArray(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async findById(id: number | string): Promise<ReservationDocument | null> {
    const trimmed = String(id).trim();
    const numId = Number(trimmed);
    const conditions: any[] = [];
    if (!isNaN(numId)) {
      conditions.push({ _id: numId });
    }
    conditions.push({ confirmationCode: trimmed });
    conditions.push({ confirmationCode: trimmed.toUpperCase() });

    return this.col().findOne({ $or: conditions });
  }

  public async updateStatus(id: number | string, status: string): Promise<boolean> {
    const trimmed = String(id).trim();
    const numId = Number(trimmed);
    const conditions: any[] = [];
    if (!isNaN(numId)) {
      conditions.push({ _id: numId });
    }
    conditions.push({ confirmationCode: trimmed });
    conditions.push({ confirmationCode: trimmed.toUpperCase() });

    const query = conditions.length === 1 ? conditions[0] : { $or: conditions };

    // Normalize status string (supports checkout, check-out, in-house, completed, etc.)
    const clean = String(status).toLowerCase().replace(/[\s_-]+/g, '');
    let normalizedStatus: ReservationDocument['status'] = 'Confirmed';
    if (clean === 'checkedout' || clean === 'checkout' || clean === 'completed') {
      normalizedStatus = 'Checked-out';
    } else if (clean === 'inhouse' || clean === 'checkin' || clean === 'checkedin') {
      normalizedStatus = 'In-house';
    } else if (clean === 'cancelled' || clean === 'canceled') {
      normalizedStatus = 'Cancelled';
    } else if (clean === 'noshow') {
      normalizedStatus = 'No-show';
    } else if (clean === 'confirmed') {
      normalizedStatus = 'Confirmed';
    }

    const existing = await this.col().findOne(query);

    const update: any = {
      $set: {
        status: normalizedStatus,
        updatedAt: new Date(),
      },
    };
    if (normalizedStatus === 'Cancelled') {
      update.$set.cancellationDate = new Date();
      if (existing && existing.status !== 'Cancelled') {
        await this.deductKpisForCancelledStay(new Date(existing.checkIn), existing.nights || 1, existing.ratePerNight || 0);
      }
    } else if (normalizedStatus === 'Checked-out') {
      update.$set.checkOutDate = new Date();
    }

    const result = await this.col().updateOne(query, update);
    return (result.matchedCount ?? 0) > 0 || (result.modifiedCount ?? 0) > 0;
  }

  public async create(data: Partial<ReservationDocument>): Promise<ReservationDocument> {
    const lastDoc = await this.col().find().sort({ _id: -1 }).limit(1).toArray();
    const maxId = (lastDoc[0]?._id as number) || 0;
    const count = await this.col().countDocuments();
    const newId = Math.max(count, maxId) + 1;
    const year = new Date().getFullYear();
    const confirmationCode = `GAP${year}-${String(newId).padStart(5, '0')}`;

    const newReservation: ReservationDocument = {
      _id: newId,
      confirmationCode,
      guestId: data.guestId || Math.floor(Math.random() * 5000) + 1,
      guestName: data.guestName || 'Valued Guest',
      guestNationality: data.guestNationality || 'International',
      room: data.room || { number: '101', type: 'Classic Deluxe' },
      channel: data.channel || { name: 'Direct Website', type: 'Direct' },
      bookingDate: data.bookingDate || new Date(),
      checkIn: data.checkIn ? new Date(data.checkIn) : new Date(),
      checkOut: data.checkOut ? new Date(data.checkOut) : new Date(Date.now() + 864e5 * 2),
      nights: data.nights || 2,
      adults: data.adults || 1,
      children: data.children || 0,
      mealPlan: data.mealPlan || 'Bed & Breakfast',
      purpose: data.purpose || 'Leisure',
      ratePerNight: data.ratePerNight || 240,
      status: (data.status as any) || 'Confirmed',
      cancellationDate: null,
      updatedAt: new Date(),
      totalCharges: (data.nights || 2) * (data.ratePerNight || 240),
      charges: data.charges || [
        {
          chargeId: 1,
          department: 'Rooms',
          date: data.checkIn ? new Date(data.checkIn) : new Date(),
          description: 'Room night accommodation',
          amount: (data.nights || 2) * (data.ratePerNight || 240),
        },
      ],
    };

    await this.col().insertOne(newReservation as any);

    // 1. Insert room charges into folio_charges collection
    for (const ch of newReservation.charges) {
      await this.insertFolioCharge(
        newReservation._id,
        ch.department || 'Rooms',
        ch.amount,
        ch.description || 'Accommodation room charge',
        new Date(ch.date)
      );
    }

    // 2. Propagate to real daily_kpis, monthly_kpis, and department_revenue_monthly
    await this.updateKpisForRoomStay(
      newReservation.checkIn,
      newReservation.nights,
      newReservation.ratePerNight
    );

    // 3. Upsert guest record in guests collection
    await this.ensureGuestRecord(newReservation);

    return newReservation;
  }

  public async addCharge(
    id: number | string,
    charge: {
      department: string;
      amount: number;
      description: string;
      date?: string | Date;
    }
  ) {
    const res = await this.findById(id);
    if (!res) return null;

    const chargeDate = charge.date ? new Date(charge.date) : new Date();
    const amount = Number(charge.amount) || 0;
    const existingCharges = res.charges || [];
    const nextChargeId = existingCharges.reduce((max, c) => Math.max(max, c.chargeId || 0), 0) + 1;

    const newCharge = {
      chargeId: nextChargeId,
      department: charge.department || 'Food & Beverage',
      date: chargeDate,
      description: charge.description || 'Guest charge',
      amount,
    };

    const newCharges = [...existingCharges, newCharge];
    const newTotal = Math.round(newCharges.reduce((sum, c) => sum + (c.amount || 0), 0) * 100) / 100;

    await this.col().updateOne(
      { _id: res._id },
      {
        $push: { charges: newCharge as any },
        $set: { totalCharges: newTotal, updatedAt: new Date() },
      }
    );

    // 1. Insert into folio_charges collection
    await this.insertFolioCharge(res._id, newCharge.department, amount, newCharge.description, chargeDate);

    // 2. Update department_revenue_monthly
    const ym = chargeDate.toISOString().slice(0, 7);
    await this.db.collection('department_revenue_monthly').updateOne(
      { yearMonth: ym, department: newCharge.department },
      { $inc: { revenue: amount } },
      { upsert: true }
    );

    // 3. If Rooms, also update daily and monthly KPIs
    if (newCharge.department === 'Rooms') {
      await this.updateKpisForRoomStay(chargeDate, 1, amount);
    }

    const updated = await this.findById(res._id);
    return {
      charge: newCharge,
      reservation: updated,
    };
  }

  private async insertFolioCharge(
    reservationId: number,
    department: string,
    amount: number,
    description: string,
    date: Date
  ) {
    try {
      const deptMap: Record<string, number> = {
        'Rooms': 1,
        'Food & Beverage': 2,
        'Spa & Wellness': 3,
        'Events & Meetings': 4,
        'Minibar & Extras': 5,
        'Transport': 6,
      };
      const department_id = deptMap[department] || 2;
      const lastFolio = await this.db.collection<any>('folio_charges').find().sort({ _id: -1 }).limit(1).toArray();
      const nextId = (Number(lastFolio[0]?._id) || 0) + 1;

      await this.db.collection<any>('folio_charges').insertOne({
        _id: nextId,
        charge_id: nextId,
        reservation_id: reservationId,
        department_id,
        charge_date: date.toISOString().slice(0, 10),
        description,
        amount: Math.round(amount * 100) / 100,
      });
    } catch (fErr) {
      console.error('[ReservationRepository] Error inserting folio_charge:', fErr);
    }
  }

  private async updateKpisForRoomStay(checkIn: Date, nights: number, ratePerNight: number) {
    try {
      const start = new Date(checkIn);
      start.setUTCHours(0, 0, 0, 0);

      for (let i = 0; i < nights; i++) {
        const curDate = new Date(start.getTime() + i * 864e5);
        const ymd = curDate.toISOString().slice(0, 10);
        const ym = ymd.slice(0, 7);
        const year = curDate.getUTCFullYear();
        const month = curDate.getUTCMonth() + 1;

        // 1. Update daily_kpis
        const dailyDoc = await this.db.collection<any>('daily_kpis').findOne({
          $or: [{ _id: ymd }, { stayDate: ymd }, { date: curDate }] as any,
        });

        if (dailyDoc) {
          const roomsSold = (dailyDoc.roomsSold || 0) + 1;
          const roomsAvailable = dailyDoc.roomsAvailable || 60;
          const roomRevenue = Math.round(((dailyDoc.roomRevenue || 0) + ratePerNight) * 100) / 100;
          const occupancyPct = Math.round((roomsSold / roomsAvailable) * 1000) / 10;
          const adr = Math.round((roomRevenue / roomsSold) * 100) / 100;
          const revpar = Math.round((roomRevenue / roomsAvailable) * 100) / 100;

          await this.db.collection<any>('daily_kpis').updateOne(
            { _id: dailyDoc._id },
            {
              $set: {
                roomsSold,
                roomRevenue,
                occupancyPct,
                adr,
                revpar,
              },
            }
          );
        } else {
          await this.db.collection<any>('daily_kpis').insertOne({
            _id: ymd,
            date: curDate,
            stayDate: ymd,
            year,
            month,
            roomsSold: 1,
            roomsAvailable: 60,
            occupancyPct: Math.round((1 / 60) * 1000) / 10,
            roomRevenue: ratePerNight,
            adr: ratePerNight,
            revpar: Math.round((ratePerNight / 60) * 100) / 100,
          });
        }

        // 2. Update monthly_kpis
        const monthlyDoc = await this.db.collection<any>('monthly_kpis').findOne({
          $or: [{ _id: ym }, { yearMonth: ym }] as any,
        });

        if (monthlyDoc) {
          const mSold = (monthlyDoc.roomsSold || 0) + 1;
          const mAvail = monthlyDoc.roomsAvailable || 1800;
          const mRev = Math.round(((monthlyDoc.roomRevenue || 0) + ratePerNight) * 100) / 100;
          const mOcc = Math.round((mSold / mAvail) * 1000) / 10;
          const mAdr = Math.round((mRev / mSold) * 100) / 100;
          const mRevpar = Math.round((mRev / mAvail) * 100) / 100;

          await this.db.collection<any>('monthly_kpis').updateOne(
            { _id: monthlyDoc._id },
            {
              $set: {
                roomsSold: mSold,
                roomRevenue: mRev,
                occupancyPct: mOcc,
                adr: mAdr,
                revpar: mRevpar,
              },
            }
          );
        }

        // 3. Update department_revenue_monthly for 'Rooms'
        await this.db.collection<any>('department_revenue_monthly').updateOne(
          { yearMonth: ym, department: 'Rooms' },
          { $inc: { revenue: ratePerNight } },
          { upsert: true }
        );
      }
    } catch (kpiErr) {
      console.error('[ReservationRepository] Error updating KPIs for stay:', kpiErr);
    }
  }

  private async deductKpisForCancelledStay(checkIn: Date, nights: number, ratePerNight: number) {
    try {
      const start = new Date(checkIn);
      start.setUTCHours(0, 0, 0, 0);

      for (let i = 0; i < nights; i++) {
        const curDate = new Date(start.getTime() + i * 864e5);
        const ymd = curDate.toISOString().slice(0, 10);
        const ym = ymd.slice(0, 7);

        const dailyDoc = await this.db.collection<any>('daily_kpis').findOne({
          $or: [{ _id: ymd }, { stayDate: ymd }, { date: curDate }] as any,
        });

        if (dailyDoc) {
          const roomsSold = Math.max(0, (dailyDoc.roomsSold || 1) - 1);
          const roomsAvailable = dailyDoc.roomsAvailable || 60;
          const roomRevenue = Math.max(0, Math.round(((dailyDoc.roomRevenue || 0) - ratePerNight) * 100) / 100);
          const occupancyPct = Math.round((roomsSold / roomsAvailable) * 1000) / 10;
          const adr = roomsSold > 0 ? Math.round((roomRevenue / roomsSold) * 100) / 100 : 0;
          const revpar = Math.round((roomRevenue / roomsAvailable) * 100) / 100;

          await this.db.collection<any>('daily_kpis').updateOne(
            { _id: dailyDoc._id },
            { $set: { roomsSold, roomRevenue, occupancyPct, adr, revpar } }
          );
        }

        const monthlyDoc = await this.db.collection<any>('monthly_kpis').findOne({
          $or: [{ _id: ym }, { yearMonth: ym }] as any,
        });

        if (monthlyDoc) {
          const mSold = Math.max(0, (monthlyDoc.roomsSold || 1) - 1);
          const mAvail = monthlyDoc.roomsAvailable || 1800;
          const mRev = Math.max(0, Math.round(((monthlyDoc.roomRevenue || 0) - ratePerNight) * 100) / 100);
          const mOcc = Math.round((mSold / mAvail) * 1000) / 10;
          const mAdr = mSold > 0 ? Math.round((mRev / mSold) * 100) / 100 : 0;
          const mRevpar = Math.round((mRev / mAvail) * 100) / 100;

          await this.db.collection<any>('monthly_kpis').updateOne(
            { _id: monthlyDoc._id },
            { $set: { roomsSold: mSold, roomRevenue: mRev, occupancyPct: mOcc, adr: mAdr, revpar: mRevpar } }
          );
        }

        await this.db.collection<any>('department_revenue_monthly').updateOne(
          { yearMonth: ym, department: 'Rooms' },
          { $inc: { revenue: -ratePerNight } }
        );
      }
    } catch (err) {
      console.error('[ReservationRepository] Error deducting KPIs for cancelled stay:', err);
    }
  }

  private async ensureGuestRecord(r: ReservationDocument) {
    try {
      const parts = (r.guestName || 'Guest').split(' ');
      const first_name = parts[0];
      const last_name = parts.slice(1).join(' ') || '';

      await this.db.collection<any>('guests').updateOne(
        { $or: [{ guest_id: r.guestId }, { _id: r.guestId }] as any },
        {
          $setOnInsert: {
            _id: r.guestId,
            guest_id: r.guestId,
            first_name,
            last_name,
            nationality: r.guestNationality || 'France',
            email: `${first_name.toLowerCase()}.${(last_name || 'guest').toLowerCase()}@example.com`,
            vip_level: 'Standard',
          },
        },
        { upsert: true }
      );
    } catch (gErr) {
      console.error('[ReservationRepository] Error updating guest:', gErr);
    }
  }
}
