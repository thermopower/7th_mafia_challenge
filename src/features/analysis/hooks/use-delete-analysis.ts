'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/query-keys';

const deleteAnalysis = async (id: string) => {
  try {
    await apiClient.delete(`/api/analysis/${id}`);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to delete analysis.');
    throw new Error(message);
  }
};

export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses.all() });
    },
  });
};
