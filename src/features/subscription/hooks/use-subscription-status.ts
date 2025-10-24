'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { SubscriptionStatusResponseSchema } from '@/features/subscription/lib/dto';

const fetchSubscriptionStatus = async () => {
  try {
    const { data } = await apiClient.get('/api/subscription/status');
    return SubscriptionStatusResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch subscription status.');
    throw new Error(message);
  }
};

export const useSubscriptionStatus = () =>
  useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: fetchSubscriptionStatus,
    staleTime: 60 * 1000,
  });
