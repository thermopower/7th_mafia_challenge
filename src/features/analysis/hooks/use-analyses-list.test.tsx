import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalysesList } from './use-analyses-list';
import * as apiClient from '@/lib/remote/api-client';

// QueryClient Provider 래퍼
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

describe('useAnalysesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch analyses list successfully', async () => {
    // Arrange: API 모킹
    const mockData = {
      items: [
        {
          id: 'analysis-1',
          name: '홍길동',
          analysisType: 'monthly',
          createdAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'analysis-2',
          name: '김철수',
          analysisType: 'yearly',
          createdAt: '2025-01-02T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    };

    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ data: mockData });

    // Act: 훅 실행
    const { result } = renderHook(
      () => useAnalysesList({ page: 1, pageSize: 10 }),
      { wrapper: createWrapper() }
    );

    // Assert: 결과 검증
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.data?.items).toHaveLength(2);
    expect(apiClient.apiClient.get).toHaveBeenCalledWith('/api/analysis/list', {
      params: { page: 1, pageSize: 10 },
    });
  });

  it('should refetch data when query parameters change', async () => {
    // Arrange
    const mockData = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    };

    const getSpy = vi
      .spyOn(apiClient.apiClient, 'get')
      .mockResolvedValue({ data: mockData });

    // Act: 첫 번째 렌더링
    const { rerender, result } = renderHook(
      ({ query }) => useAnalysesList(query),
      {
        wrapper: createWrapper(),
        initialProps: { query: { page: 1, pageSize: 10 } },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getSpy).toHaveBeenCalledTimes(1);

    // Act: query 파라미터 변경
    rerender({ query: { page: 2, pageSize: 10 } });

    // Assert: 새로운 쿼리 호출 확인
    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });

    expect(getSpy).toHaveBeenLastCalledWith('/api/analysis/list', {
      params: { page: 2, pageSize: 10 },
    });
  });

  it('should handle error when API call fails', async () => {
    // Arrange: API 에러 모킹
    const mockError = new Error('Failed to fetch analyses list.');
    vi.spyOn(apiClient.apiClient, 'get').mockRejectedValue(mockError);

    // Act: 훅 실행
    const { result } = renderHook(
      () => useAnalysesList({ page: 1, pageSize: 10 }),
      { wrapper: createWrapper() }
    );

    // Assert: 에러 상태 확인
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });
});
