'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { UserQuotaResponseSchema } from '@/features/user/lib/dto';
import { queryKeys } from '@/lib/query-keys';

const fetchUserQuota = async () => {
  try {
    const { data } = await apiClient.get('/api/user/quota');
    return UserQuotaResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch user quota.');
    throw new Error(message);
  }
};

export const useUserQuota = () =>
  useQuery({
    queryKey: queryKeys.user.quota(),
    queryFn: fetchUserQuota,
    staleTime: 1 * 60 * 1000, // 1분
  });
