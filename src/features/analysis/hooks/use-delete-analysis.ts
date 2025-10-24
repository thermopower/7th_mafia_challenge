'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/remote/api-client'

export function useDeleteAnalysis() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/analysis/${id}`)
    },
    onSuccess: () => {
      // 분석 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      // 대시보드로 리다이렉트
      router.push('/dashboard')
    },
  })
}
