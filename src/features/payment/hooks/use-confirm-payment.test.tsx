import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConfirmPayment } from './use-confirm-payment';
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

describe('useConfirmPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should confirm payment successfully', async () => {
    // Arrange: 결제 승인 API 모킹
    const mockResponse = {
      paymentKey: 'payment-key-123',
      orderId: 'order-123',
      amount: 10000,
      status: 'done',
    };

    vi.spyOn(apiClient.apiClient, 'post').mockResolvedValue({ data: mockResponse });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Act: 훅 실행
    const { result } = renderHook(() => useConfirmPayment(), { wrapper });

    const params = {
      paymentKey: 'payment-key-123',
      orderId: 'order-123',
      amount: 10000,
    };

    result.current.mutate(params);

    // Assert: 성공 확인
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/payments/confirm', params);
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should retry on network error', async () => {
    // Arrange: 네트워크 에러 모킹
    const networkError = { code: 'NETWORK_ERROR' };

    const postSpy = vi
      .spyOn(apiClient.apiClient, 'post')
      .mockRejectedValueOnce(networkError) // 첫 번째 호출 실패
      .mockResolvedValueOnce({ data: { status: 'done' } }); // 두 번째 호출 성공

    // Act: 훅 실행
    const { result } = renderHook(() => useConfirmPayment(), {
      wrapper: createWrapper(),
    });

    const params = {
      paymentKey: 'payment-key-456',
      orderId: 'order-456',
      amount: 20000,
    };

    result.current.mutate(params);

    // Assert: 재시도 후 성공
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // 2번 호출됨 (첫 번째 실패 + 재시도 성공)
    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-network error', async () => {
    // Arrange: 일반 에러 (재시도 안함)
    const validationError = {
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 결제 정보',
          },
        },
      },
    };

    const postSpy = vi
      .spyOn(apiClient.apiClient, 'post')
      .mockRejectedValue(validationError);

    // Act: 훅 실행
    const { result } = renderHook(() => useConfirmPayment(), {
      wrapper: createWrapper(),
    });

    const params = {
      paymentKey: 'invalid-key',
      orderId: 'order-789',
      amount: 30000,
    };

    result.current.mutate(params);

    // Assert: 재시도 없이 실패
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // 1번만 호출됨 (재시도 안함)
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('should retry up to 2 times on timeout error', async () => {
    // Arrange: 타임아웃 에러 (최대 2회 재시도)
    const timeoutError = { code: 'TIMEOUT' };

    const postSpy = vi
      .spyOn(apiClient.apiClient, 'post')
      .mockRejectedValue(timeoutError);

    // Act: 훅 실행
    const { result } = renderHook(() => useConfirmPayment(), {
      wrapper: createWrapper(),
    });

    const params = {
      paymentKey: 'timeout-key',
      orderId: 'order-timeout',
      amount: 40000,
    };

    result.current.mutate(params);

    // Assert: 최대 2회 재시도
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

    // 총 3번 호출 (초기 1회 + 재시도 2회)
    expect(postSpy).toHaveBeenCalledTimes(3);
  });
});
