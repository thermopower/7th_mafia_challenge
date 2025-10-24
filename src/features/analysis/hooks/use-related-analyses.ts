'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'
import type { RelatedAnalysesResponse } from '../backend/schema'

export const queryKeys = {
  relatedAnalyses: (id: string) => ['analyses', 'related', id] as const,
}

export function useRelatedAnalyses(id: string, limit: number = 3) {
  return useQuery({
    queryKey: queryKeys.relatedAnalyses(id),
    queryFn: async () => {
      const response = await apiClient.get<{ data: RelatedAnalysesResponse }>(
        `/api/analysis/${id}/related`,
        { params: { limit: limit.toString() } }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}
