import type { Db, Filter } from 'mongodb';
import { COLLECTIONS } from '../database/collections.js';

export interface GuestFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  nationality?: string;
  vipLevel?: string;
}

export class GuestRepository {
  constructor(private db: Db) {}

  public async find(options: GuestFilterOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Filter<any> = {};

    if (options.nationality && options.nationality !== 'All') {
      filter.nationality = options.nationality;
    }

    if (options.vipLevel && options.vipLevel !== 'All') {
      filter.vip_level = options.vipLevel;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      filter.$or = [
        { first_name: { $regex: q, $options: 'i' } },
        { last_name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { nationality: { $regex: q, $options: 'i' } },
      ];
    }

    const [total, guests] = await Promise.all([
      this.db.collection('guests').countDocuments(filter),
      this.db.collection('guests').find(filter).skip(skip).limit(limit).toArray(),
    ]);

    // Aggregate spend and stays for these guests from reservations
    const guestIds = guests.map(g => g.guest_id ?? g._id);
    const stats = await this.db.collection(COLLECTIONS.RESERVATIONS).aggregate([
      { $match: { guestId: { $in: guestIds } } },
      {
        $group: {
          _id: '$guestId',
          stays: { $sum: 1 },
          spend: { $sum: '$totalCharges' },
          lastStay: { $max: '$checkOut' },
        },
      },
    ]).toArray();

    const statsMap = new Map(stats.map(s => [s._id, s]));

    const enriched = guests.map(g => {
      const id = g.guest_id ?? g._id;
      const s = statsMap.get(id);
      return {
        id,
        name: `${g.first_name || ''} ${g.last_name || ''}`.trim(),
        firstName: g.first_name,
        lastName: g.last_name,
        nationality: g.nationality,
        email: g.email,
        phone: g.phone,
        vipLevel: g.vip_level || 'Standard',
        stays: s ? s.stays : 1,
        spend: s ? Math.round(s.spend * 100) / 100 : 0,
        lastStay: s?.lastStay ? s.lastStay.toISOString().slice(0, 10) : null,
      };
    });

    return {
      items: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async findById(id: number) {
    const guest = await this.db.collection('guests').findOne({
      $or: [{ guest_id: id }, { _id: id }] as any,
    });
    if (!guest) return null;

    const history = await this.db
      .collection(COLLECTIONS.RESERVATIONS)
      .find({ guestId: id })
      .sort({ checkIn: -1 })
      .toArray();

    return {
      guest,
      reservations: history,
      totalStays: history.length,
      totalSpend: Math.round(history.reduce((acc, r) => acc + (r.totalCharges || 0), 0) * 100) / 100,
    };
  }
}
