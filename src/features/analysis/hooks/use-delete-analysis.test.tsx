import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteAnalysis } from './use-delete-analysis';
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

describe('useDeleteAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete analysis successfully', async () => {
    // Arrange: DELETE API 모킹
    const deleteSpy = vi
      .spyOn(apiClient.apiClient, 'delete')
      .mockResolvedValue({ data: null });

    // Act: 훅 실행
    const { result } = renderHook(() => useDeleteAnalysis(), {
      wrapper: createWrapper(),
    });

    // Act: mutation 실행
    result.current.mutate('analysis-123');

    // Assert: 성공 확인
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(deleteSpy).toHaveBeenCalledWith('/api/analysis/analysis-123');
  });

  it('should invalidate analyses queries after successful deletion', async () => {
    // Arrange
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(apiClient.apiClient, 'delete').mockResolvedValue({ data: null });

    // Wrapper에 spied queryClient 사용
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Act: 훅 실행
    const { result } = renderHook(() => useDeleteAnalysis(), { wrapper });

    // Act: mutation 실행
    result.current.mutate('analysis-456');

    // Assert: invalidateQueries 호출 확인
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });
});
