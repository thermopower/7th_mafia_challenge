import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateAnalysis } from './use-create-analysis';
import * as apiClient from '@/lib/remote/api-client';
import { toast } from 'sonner';

// useRouter 모킹
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('useCreateAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create analysis successfully', async () => {
    // Arrange: API 응답 모킹
    const mockResponse = {
      id: 'analysis-123',
      name: '홍길동',
      resultJson: {
        general: '전체 운세',
        wealth: '재물운',
        love: '애정운',
        health: '건강운',
        job: '직업운',
      },
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
    const { result } = renderHook(() => useCreateAnalysis(), { wrapper });

    const input = {
      name: '홍길동',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      birthTime: '10:00',
      isLunar: false,
      analysisType: 'monthly' as const,
    };

    result.current.mutate(input);

    // Assert: 성공 확인
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/analysis/create', input);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'quota'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analyses'] });
    expect(mockPush).toHaveBeenCalledWith('/analyze/analysis-123');
    expect(toast.success).toHaveBeenCalledWith('분석이 완료되었습니다');
  });

  it('should handle insufficient quota error', async () => {
    // Arrange: 쿼터 부족 에러
    const mockError = {
      response: {
        data: {
          error: {
            code: 'INSUFFICIENT_QUOTA',
            message: '잔여 횟수가 부족합니다.',
          },
        },
      },
    };

    vi.spyOn(apiClient.apiClient, 'post').mockRejectedValue(mockError);

    // Act: 훅 실행
    const { result } = renderHook(() => useCreateAnalysis(), {
      wrapper: createWrapper(),
    });

    const input = {
      name: '김철수',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      isLunar: false,
      analysisType: 'yearly' as const,
    };

    result.current.mutate(input);

    // Assert: 에러 확인
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      '잔여 횟수가 부족합니다. Pro 구독을 고려해보세요.'
    );
  });

  it('should handle AI API error', async () => {
    // Arrange: AI 에러
    const mockError = {
      response: {
        data: {
          error: {
            code: 'AI_API_ERROR',
            message: 'AI 분석 실패',
          },
        },
      },
    };

    vi.spyOn(apiClient.apiClient, 'post').mockRejectedValue(mockError);

    // Act: 훅 실행
    const { result } = renderHook(() => useCreateAnalysis(), {
      wrapper: createWrapper(),
    });

    const input = {
      name: '이영희',
      gender: 'female' as const,
      birthDate: '1990-01-01',
      isLunar: false,
      analysisType: 'lifetime' as const,
    };

    result.current.mutate(input);

    // Assert: 에러 확인
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  });

  it('should handle generic error', async () => {
    // Arrange: 일반 에러
    const mockError = {
      response: {
        data: {
          error: {
            message: '알 수 없는 에러',
          },
        },
      },
    };

    vi.spyOn(apiClient.apiClient, 'post').mockRejectedValue(mockError);

    // Act: 훅 실행
    const { result } = renderHook(() => useCreateAnalysis(), {
      wrapper: createWrapper(),
    });

    const input = {
      name: '박민수',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      isLunar: false,
      analysisType: 'monthly' as const,
    };

    result.current.mutate(input);

    // Assert: 에러 확인
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('알 수 없는 에러');
  });
});
