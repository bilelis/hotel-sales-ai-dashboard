export interface DateRange {
  from: Date;
  to: Date;
}

export interface DailyKpiDocument {
  _id: string;
  date: Date;
  stayDate?: string;
  year: number;
  month: number;
  roomsSold: number;
  roomsAvailable: number;
  occupancyPct: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
}

export interface MonthlyKpiDocument {
  _id: string; // e.g., '2026-09'
  yearMonth?: string;
  year: number;
  month: number;
  roomsSold: number;
  roomsAvailable: number;
  occupancyPct: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
}

export interface DepartmentRevenueDocument {
  _id?: string;
  yearMonth: string;
  department: string;
  revenue: number;
}

export interface AggregatedKpis {
  roomsSold: number;
  roomsAvailable: number;
  roomRevenue: number;
  occupancyPct: number;
  adr: number;
  revpar: number;
}
