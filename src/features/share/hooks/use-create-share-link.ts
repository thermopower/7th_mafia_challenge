'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'
import type { CreateShareLinkResponse } from '../backend/schema'

export function useCreateShareLink() {
  return useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await apiClient.post<{ data: CreateShareLinkResponse }>(
        `/api/share/${analysisId}`
      )
      return response.data.data
    },
  })
}
