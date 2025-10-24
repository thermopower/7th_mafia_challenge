/**
 * 사용자 잔여 횟수 조회 Hook
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'
import type { UserQuota } from '../backend/schema'

/**
 * 사용자 잔여 횟수 조회
 */
const fetchUserQuota = async (): Promise<UserQuota> => {
  const response = await apiClient.get<UserQuota>('/api/user/quota')
  return response.data
}

/**
 * 사용자 잔여 횟수 Hook
 */
export function useUserQuota() {
  return useQuery({
    queryKey: ['user', 'quota'],
    queryFn: fetchUserQuota,
    staleTime: 1 * 60 * 1000, // 1분
    retry: 2,
  })
}
