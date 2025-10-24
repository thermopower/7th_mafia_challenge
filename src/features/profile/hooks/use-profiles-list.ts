'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { profileQueryKeys, PROFILE_STALE_TIME } from '../constants';
import type { ProfilesListData } from '../types';

export function useProfilesList() {
  return useQuery({
    queryKey: profileQueryKeys.list(),
    queryFn: async (): Promise<ProfilesListData> => {
      const response = await apiClient.get('/api/profiles');
      return response.data;
    },
    staleTime: PROFILE_STALE_TIME,
  });
}
