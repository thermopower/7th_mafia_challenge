'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';

const reactivateSubscription = async () => {
  try {
    const { data } = await apiClient.post('/api/subscription/reactivate');
    return data;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to reactivate subscription.');
    throw new Error(message);
  }
};

export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
    },
  });
};
