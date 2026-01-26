import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface AIUsageState {
  remaining: number;
  total: number;
  isUnlimited: boolean;
  freeRemaining?: number;
  paidCredits?: number;
  isAuthenticated: boolean;
  isLoading: boolean;
}

async function fetchUsageCheck(): Promise<AIUsageState> {
  const response = await fetch('/api/usage/check');
  const data = await response.json();

  return {
    remaining: data.remaining,
    total: data.total,
    isUnlimited: data.isUnlimited,
    freeRemaining: data.freeRemaining,
    paidCredits: data.paidCredits,
    isAuthenticated: true,
    isLoading: false,
  };
}

export function useAIUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: usageState, isLoading } = useQuery<AIUsageState>({
    queryKey: ['usageCheck', !!user],
    queryFn: async () => {
      if (user) {
        return fetchUsageCheck();
      }
      return {
        remaining: 0,
        total: 0,
        isUnlimited: false,
        isAuthenticated: false,
        isLoading: false,
      };
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const defaultState: AIUsageState = {
    remaining: 0,
    total: 0,
    isUnlimited: false,
    isAuthenticated: !!user,
    isLoading: true,
  };

  const checkUsage = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['usageCheck'] });
  }, [queryClient]);

  const incrementUsage = useCallback(async () => {
    await checkUsage();
  }, [checkUsage]);

  return {
    usageState: usageState || { ...defaultState, isLoading },
    incrementUsage,
    checkUsage,
  };
}
