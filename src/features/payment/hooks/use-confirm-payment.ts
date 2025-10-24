/**
 * 결제 승인 React Query Hook
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'
import { queryKeys } from '@/lib/query-client'
import type { PaymentSuccessParams } from '../lib/validate-params'
import type { ConfirmPaymentResponse } from '../lib/dto'

/**
 * 결제 승인 API 호출
 */
async function confirmPayment(
  params: PaymentSuccessParams
): Promise<ConfirmPaymentResponse> {
  const response = await apiClient.post('/api/payments/confirm', params)
  return response.data
}

/**
 * 결제 승인 Mutation Hook
 * - 결제 승인 API 호출
 * - 성공 시 구독 관련 캐시 무효화
 * - 네트워크 오류 시 최대 2회 재시도
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      // 구독 상태 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.user.subscription() })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.quota() })
    },
    retry: (failureCount, error: unknown) => {
      // 네트워크 오류나 타임아웃은 최대 2회 재시도
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string }).code
        if (errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT') {
          return failureCount < 2
        }
      }
      // 그 외 오류는 재시도하지 않음
      return false
    },
    retryDelay: 1000, // 1초 간격
  })
}
