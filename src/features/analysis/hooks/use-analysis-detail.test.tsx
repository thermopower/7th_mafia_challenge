import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalysisDetail } from './use-analysis-detail';
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

describe('useAnalysisDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single analysis successfully', async () => {
    // Arrange: 단일 분석 데이터 모킹
    const mockAnalysis = {
      id: 'analysis-123',
      name: '홍길동',
      gender: 'male',
      birthDate: '1990-01-01',
      birthTime: '10:00',
      isLunar: false,
      analysisType: 'monthly',
      resultJson: {
        general: '전체적으로 좋은 운세입니다.',
        wealth: '재물운이 상승합니다.',
        love: '애정운이 평온합니다.',
        health: '건강에 유의하세요.',
        job: '직장운이 좋습니다.',
      },
      createdAt: '2025-01-01T00:00:00Z',
    };

    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ data: mockAnalysis });

    // Act: 훅 실행
    const { result } = renderHook(() => useAnalysisDetail('analysis-123'), {
      wrapper: createWrapper(),
    });

    // Assert: 결과 검증
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAnalysis);
    expect(result.current.data?.id).toBe('analysis-123');
    expect(apiClient.apiClient.get).toHaveBeenCalledWith('/api/analysis/analysis-123');
  });

  it('should cache analysis data with staleTime: Infinity', async () => {
    // Arrange
    const mockAnalysis = {
      id: 'analysis-456',
      name: '김철수',
      resultJson: {
        general: '운세 내용',
        wealth: '재물운',
        love: '애정운',
        health: '건강운',
        job: '직업운',
      },
    };

    const getSpy = vi
      .spyOn(apiClient.apiClient, 'get')
      .mockResolvedValue({ data: mockAnalysis });

    // Act: 첫 번째 렌더링
    const { result, rerender } = renderHook(
      ({ id }) => useAnalysisDetail(id),
      {
        wrapper: createWrapper(),
        initialProps: { id: 'analysis-456' },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getSpy).toHaveBeenCalledTimes(1);

    // Act: 같은 ID로 재렌더링 (캐시 확인)
    rerender({ id: 'analysis-456' });

    // Assert: 캐시되어 추가 호출 없음
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // staleTime: Infinity이므로 재호출 안됨
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
