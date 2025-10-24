'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { profileQueryKeys } from '../constants';
import type { ProfileFormData, Profile } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ProfileFormData): Promise<Profile> => {
      const response = await apiClient.post('/api/profiles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all() });
      toast({
        title: '프로필이 추가되었습니다',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: '프로필 추가 실패',
        description: error.response?.data?.error?.message || '오류가 발생했습니다',
        variant: 'destructive',
      });
    },
  });
}
