'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DocumentItem } from './useDocuments';

export interface DashboardStats {
  totalPdfs: number;
  totalSessions: number;
  totalQuestions: number;
  recentDocuments: DocumentItem[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return (res.data?.data || {
        totalPdfs: 0,
        totalSessions: 0,
        totalQuestions: 0,
        recentDocuments: [],
      }) as DashboardStats;
    },
    refetchInterval: 10000, // 10 seconds
  });
}
