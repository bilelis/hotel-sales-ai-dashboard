// Pure aggregation pipeline builders (no DB access) so they can be unit-checked offline.
import type { Document } from 'mongodb';

export type Range = { from: Date; to: Date };
const REALIZED = ['Checked-out', 'In-house'];
const r2 = (e: unknown) => ({ $round: [e, 2] });
const ratio = (num: unknown, den: unknown) => ({ $cond: [{ $gt: [den, 0] }, { $divide: [num, den] }, 0] });

/** Occupancy %, ADR, RevPAR over a date range (collection: daily_kpis). */
export const kpis = ({ from, to }: Range): Document[] => [
  { $match: { date: { $gte: from, $lte: to } } },
  { $group: { _id: null, roomsSold: { $sum: '$roomsSold' }, roomsAvailable: { $sum: '$roomsAvailable' }, roomRevenue: { $sum: '$roomRevenue' } } },
  { $project: { _id: 0, roomsSold: 1, roomsAvailable: 1, roomRevenue: r2('$roomRevenue'),
      occupancyPct: { $round: [{ $multiply: [100, ratio('$roomsSold', '$roomsAvailable')] }, 1] },
      adr: r2(ratio('$roomRevenue', '$roomsSold')), revpar: r2(ratio('$roomRevenue', '$roomsAvailable')) } },
];

/** Monthly KPIs for a year (collection: monthly_kpis). */
export const monthlyKpis = (year: number): Document[] => [
  { $match: { year } }, { $sort: { month: 1 } },
  { $project: { _id: 0, month: 1, occupancyPct: 1, adr: 1, revpar: 1, roomRevenue: 1 } },
];

/** Revenue per department from the embedded charges (collection: reservations). */
export const deptRevenue = ({ from, to }: Range): Document[] => [
  { $match: { status: { $ne: 'Cancelled' }, 'charges.date': { $gte: from, $lte: to } } },
  { $unwind: '$charges' },
  { $match: { 'charges.date': { $gte: from, $lte: to } } },
  { $group: { _id: '$charges.department', revenue: { $sum: '$charges.amount' } } },
  { $project: { _id: 0, department: '$_id', revenue: r2('$revenue') } },
  { $sort: { revenue: -1 } },
];

/** Booking channels for reservations whose check-in is in the range (collection: reservations). */
export const channels = ({ from, to }: Range): Document[] => [
  { $match: { checkIn: { $gte: from, $lte: to } } },
  { $group: { _id: '$channel.name', bookings: { $sum: 1 },
      cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
      roomNights: { $sum: { $cond: [{ $in: ['$status', REALIZED] }, '$nights', 0] } },
      roomRevenue: { $sum: { $cond: [{ $in: ['$status', REALIZED] }, { $multiply: ['$nights', '$ratePerNight'] }, 0] } } } },
  { $project: { _id: 0, channel: '$_id', bookings: 1, cancelled: 1,
      cancellationRatePct: { $round: [{ $multiply: [100, { $divide: ['$cancelled', '$bookings'] }] }, 1] },
      roomNights: 1, roomRevenue: r2('$roomRevenue'), adr: r2(ratio('$roomRevenue', '$roomNights')) } },
  { $sort: { roomRevenue: -1 } },
];

/** Highest-spending guests (stays checked-out or in-house with check-in in range). */
export const topGuests = ({ from, to }: Range, limit: number): Document[] => [
  { $match: { checkIn: { $gte: from, $lte: to }, status: { $in: REALIZED } } },
  { $group: { _id: '$guestId', name: { $first: '$guestName' }, nationality: { $first: '$guestNationality' }, stays: { $sum: 1 }, spend: { $sum: '$totalCharges' } } },
  { $sort: { spend: -1 } }, { $limit: limit },
  { $project: { _id: 0, guestId: '$_id', name: 1, nationality: 1, stays: 1, spend: r2('$spend') } },
];

/** Stays and spend by guest nationality. */
export const nationalities = ({ from, to }: Range, limit: number): Document[] => [
  { $match: { checkIn: { $gte: from, $lte: to }, status: { $in: REALIZED } } },
  { $group: { _id: '$guestNationality', stays: { $sum: 1 }, spend: { $sum: '$totalCharges' } } },
  { $sort: { spend: -1 } }, { $limit: limit },
  { $project: { _id: 0, nationality: '$_id', stays: 1, spend: r2('$spend') } },
];

/** Rooms vs other revenue per month (collection: department_revenue_monthly). */
export const monthlySplit = (fromYM: string, toYM: string): Document[] => [
  { $match: { yearMonth: { $gte: fromYM, $lte: toYM } } },
  { $group: { _id: '$yearMonth', room: { $sum: { $cond: [{ $eq: ['$department', 'Rooms'] }, '$revenue', 0] } }, total: { $sum: '$revenue' } } },
  { $project: { _id: 0, ym: '$_id', room: r2('$room'), other: r2({ $subtract: ['$total', '$room'] }) } },
  { $sort: { ym: 1 } },
];
