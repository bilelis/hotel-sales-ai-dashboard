export interface Last {
  label: string;
  total: number;
  mom: number;
  occ: number;
  adr: number;
  revpar: number;
}

export interface MonthRevenue {
  m: string;
  room: number;
  other: number;
}

export interface Reservation {
  n: string;
  t: string;
  ci: string;
  co: string;
  v: number;
  s: 'Completed' | 'In-house';
}

/** GET /api/dashboard */
export interface Dashboard {
  period: string;
  asof: string;
  rev: number;
  yoy: number;
  revpar: number;
  revparYoy: number;
  last: Last;
  months: MonthRevenue[];
  dept: [name: string, revenue: number][];
  res: Reservation[];
  occ: number[];
  ch: [channel: string, roomRevenue: number, adr: number, cancellationPct: number][];
  guests: [name: string, spend: number, stays: number][];
}

export interface FolioCharge {
  chargeId: number;
  department: string;
  date: string;
  description: string;
  amount: number;
}

export interface ReservationDetail {
  _id: number;
  confirmationCode: string;
  guestId: number;
  guestName: string;
  guestNationality: string;
  room: { id?: number; number: string; type: string; floor?: number; view?: string };
  channel: { id?: number; name: string; type?: string };
  bookingDate: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  mealPlan: string;
  purpose: string;
  ratePerNight: number;
  status: 'Confirmed' | 'In-house' | 'Checked-out' | 'Cancelled' | 'No-show';
  cancellationDate?: string | null;
  totalCharges: number;
  charges: FolioCharge[];
}

export interface ReservationsResponse {
  items: ReservationDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GuestItem {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  nationality: string;
  email: string;
  phone: string;
  vipLevel: string;
  stays: number;
  spend: number;
  lastStay: string | null;
}

export interface GuestsResponse {
  items: GuestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GuestProfileDetail {
  guest: {
    guest_id: number;
    first_name: string;
    last_name: string;
    nationality: string;
    language?: string;
    email: string;
    phone: string;
    vip_level: string;
  };
  reservations: ReservationDetail[];
  totalStays: number;
  totalSpend: number;
}

export interface ChannelStat {
  channel: string;
  bookings: number;
  cancelled: number;
  cancellationRatePct: number;
  roomNights: number;
  roomRevenue: number;
  adr: number;
}

export interface MonthlyKpi {
  _id?: string;
  year: number;
  month: number;
  roomsSold: number;
  roomsAvailable: number;
  occupancyPct: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
}

export interface DepartmentMonthly {
  _id?: string;
  yearMonth: string;
  department: string;
  revenue: number;
}

export interface AnalyticsResponse {
  asOf: string;
  channels: ChannelStat[];
  monthlyKpis: MonthlyKpi[];
  monthlyKpisPrev: MonthlyKpi[];
  departmentMonthly: DepartmentMonthly[];
}

export interface RoomType {
  room_type_id: number;
  name: string;
  description: string;
  base_rate: number;
  max_occupancy: number;
  size_sqm: number;
}

export interface SettingsResponse {
  hotel: Record<string, string>;
  stats: {
    totalRooms: number;
    totalGuests: number;
    totalReservations: number;
  };
  roomTypes: RoomType[];
  system: {
    dataAsOf: string;
    ollamaHost: string;
    ollamaModel: string;
    database: string;
    port: number;
    version: string;
  };
}

export interface TableMeta {
  name: string;
  count: number;
  fields: string[];
}

export interface TableDataResponse {
  tableName: string;
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  name: string;
  args: unknown;
}

export interface ChatResponse {
  answer: string;
  toolCalls: ToolCall[];
}
