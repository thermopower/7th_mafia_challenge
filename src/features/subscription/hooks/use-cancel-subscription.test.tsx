import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCancelSubscription } from './use-cancel-subscription';
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

describe('useCancelSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cancel subscription successfully', async () => {
    // Arrange: 취소 API 모킹
    const mockResponse = {
      status: 'pending_cancel',
      message: '구독이 취소되었습니다.',
    };

    vi.spyOn(apiClient.apiClient, 'post').mockResolvedValue({ data: mockResponse });

    // Act: 훅 실행
    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    // Assert: 성공 확인
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/subscription/cancel');
  });

  it('should invalidate subscription status after cancellation', async () => {
    // Arrange
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(apiClient.apiClient, 'post').mockResolvedValue({
      data: { status: 'canceled' },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Act: 훅 실행
    const { result } = renderHook(() => useCancelSubscription(), { wrapper });

    result.current.mutate();

    // Assert: invalidateQueries 호출 확인
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['subscription', 'status'],
    });
  });
});
