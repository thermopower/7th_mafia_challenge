'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { profileQueryKeys } from '../constants';
import { useToast } from '@/hooks/use-toast';

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all() });
      toast({
        title: '프로필이 삭제되었습니다',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: '프로필 삭제 실패',
        description: error.response?.data?.error?.message || '오류가 발생했습니다',
        variant: 'destructive',
      });
    },
  });
}
