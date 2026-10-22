export interface FormattedReservation {
  n: string; // Guest Name
  t: string; // Room Type
  ci: string; // Check-in MM-DD
  co: string; // Check-out MM-DD
  v: number; // Value (nights * rate)
  s: string; // Status label
}

export interface MonthlySplit {
  m: string;
  room: number;
  other: number;
}

export interface DashboardResponse {
  period: string;
  asof: string;
  rev: number;
  yoy: number;
  revpar: number;
  revparYoy: number;
  last: {
    label: string;
    total: number;
    mom: number;
    occ: number;
    adr: number;
    revpar: number;
  };
  months: MonthlySplit[];
  dept: [string, number][];
  res: FormattedReservation[];
  occ: number[];
  ch: [string, number, number, number][]; // [channelName, roomRevenue, adr, cancellationRatePct]
  guests: [string, number, number][]; // [guestName, totalSpend, stays]
}
