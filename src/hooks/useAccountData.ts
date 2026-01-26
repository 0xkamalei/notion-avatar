import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface UsageRecord {
  id: string;
  generation_mode: string;
  created_at: string;
  image_path?: string;
  image_url?: string;
}

interface UsageHistoryResponse {
  records: UsageRecord[];
}

export function useUsageHistory(limit: number = 10) {
  const { user } = useAuth();

  return useQuery<UsageRecord[]>({
    queryKey: ['usageHistory', limit],
    queryFn: async () => {
      const response = await fetch(`/api/usage/history?limit=${limit}`);
      const data: UsageHistoryResponse = await response.json();
      return data.records || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
