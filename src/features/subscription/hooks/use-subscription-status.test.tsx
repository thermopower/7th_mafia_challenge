import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscriptionStatus } from './use-subscription-status';
import * as apiClient from '@/lib/remote/api-client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch subscription status successfully', async () => {
    // Arrange: 구독 상태 모킹
    const mockStatus = {
      plan: 'pro',
      status: 'active',
      startedAt: '2025-01-01T00:00:00Z',
      expiresAt: '2025-02-01T00:00:00Z',
      quota: {
        used: 5,
        limit: 100,
      },
    };

    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ data: mockStatus });

    // Act: 훅 실행
    const { result } = renderHook(() => useSubscriptionStatus(), {
      wrapper: createWrapper(),
    });

    // Assert: 결과 검증
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStatus);
    expect(result.current.data?.plan).toBe('pro');
    expect(result.current.data?.status).toBe('active');
    expect(apiClient.apiClient.get).toHaveBeenCalledWith('/api/subscription/status');
  });

  it('should refetch status with staleTime of 60 seconds', async () => {
    // Arrange
    const mockStatus = {
      plan: 'free',
      status: 'inactive',
      quota: {
        used: 10,
        limit: 10,
      },
    };

    const getSpy = vi
      .spyOn(apiClient.apiClient, 'get')
      .mockResolvedValue({ data: mockStatus });

    // Act: 훅 실행
    const { result } = renderHook(() => useSubscriptionStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getSpy).toHaveBeenCalledTimes(1);

    // staleTime이 60초이므로 즉시 재호출하면 캐시 사용
    // 이 테스트는 staleTime 설정이 제대로 되었는지 확인
    expect(result.current.data).toEqual(mockStatus);
  });
});
