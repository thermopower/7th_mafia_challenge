'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'
import type { AnalysisDetailResponse } from '../backend/schema'

export const queryKeys = {
  analysisDetail: (id: string) => ['analyses', 'detail', id] as const,
}

export function useAnalysisDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.analysisDetail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ data: AnalysisDetailResponse }>(
        `/api/analysis/${id}`
      )
      return response.data.data
    },
    staleTime: Infinity, // 분석 결과는 변경 불가
    retry: 1,
  })
}
