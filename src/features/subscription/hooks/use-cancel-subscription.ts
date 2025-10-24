'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

const cancelSubscription = async () => {
  try {
    const { data } = await apiClient.post('/api/subscription/cancel');
    return data;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to cancel subscription.');
    throw new Error(message);
  }
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
    },
  });
};
