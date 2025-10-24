/**
 * React Query 전역 설정
 * staleTime, retry 등 기본 옵션 정의
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Query Keys Factory
 */
export const queryKeys = {
  user: {
    subscription: () => ['user', 'subscription'] as const,
    quota: () => ['user', 'quota'] as const,
  },
} as const
