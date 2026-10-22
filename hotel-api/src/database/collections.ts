export const COLLECTIONS = {
  DAILY_KPIS: 'daily_kpis',
  MONTHLY_KPIS: 'monthly_kpis',
  DEPARTMENT_REVENUE_MONTHLY: 'department_revenue_monthly',
  RESERVATIONS: 'reservations',
  META: 'meta',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
