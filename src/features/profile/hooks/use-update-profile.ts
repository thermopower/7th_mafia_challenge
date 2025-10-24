'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { profileQueryKeys } from '../constants';
import type { Profile, ProfileFormData } from '../types';
import { useToast } from '@/hooks/use-toast';

interface UpdateProfileParams {
  id: string;
  data: Partial<ProfileFormData>;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateProfileParams): Promise<Profile> => {
      const response = await apiClient.patch(`/api/profiles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all() });
      toast({
        title: '프로필이 수정되었습니다',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: '프로필 수정 실패',
        description: error.response?.data?.error?.message || '오류가 발생했습니다',
        variant: 'destructive',
      });
    },
  });
}
