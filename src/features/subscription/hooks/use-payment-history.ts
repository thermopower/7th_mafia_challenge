'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { PaymentHistoryResponseSchema } from '@/features/subscription/lib/dto';

const fetchPaymentHistory = async () => {
  try {
    const { data } = await apiClient.get('/api/payments/history');
    return PaymentHistoryResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch payment history.');
    throw new Error(message);
  }
};

export const usePaymentHistory = () =>
  useQuery({
    queryKey: ['payments', 'history'],
    queryFn: fetchPaymentHistory,
    staleTime: 5 * 60 * 1000,
  });
