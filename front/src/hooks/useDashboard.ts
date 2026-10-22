import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api';

export const useDashboard = (asOf?: string) =>
  useQuery({
    queryKey: ['dashboard', asOf || 'default'],
    queryFn: () => getDashboard(asOf),
    refetchInterval: 4_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
