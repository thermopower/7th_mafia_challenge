/**
 * 분석 생성 Mutation Hook
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/remote/api-client'
import { toast } from 'sonner'
import type { AnalysisCreateInput, AnalysisResponse } from '../backend/schema'

/**
 * 분석 생성 API 호출
 */
const createAnalysis = async (data: AnalysisCreateInput): Promise<AnalysisResponse> => {
  const response = await apiClient.post<AnalysisResponse>('/api/analysis/create', data)
  return response.data
}

/**
 * 분석 생성 Mutation Hook
 */
export function useCreateAnalysis() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createAnalysis,
    onSuccess: (data) => {
      // 잔여 횟수 무효화
      queryClient.invalidateQueries({ queryKey: ['user', 'quota'] })
      // 분석 목록 무효화
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      // 상세 페이지로 이동
      router.push(`/analyze/${data.id}`)
      toast.success('분석이 완료되었습니다')
    },
    onError: (error: any) => {
      const code = error?.response?.data?.error?.code
      const message = error?.response?.data?.error?.message ?? '분석 생성에 실패했습니다'

      if (code === 'INSUFFICIENT_QUOTA') {
        toast.error('잔여 횟수가 부족합니다. Pro 구독을 고려해보세요.')
      } else if (code === 'AI_API_ERROR') {
        toast.error('AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        toast.error(message)
      }
    },
  })
}
