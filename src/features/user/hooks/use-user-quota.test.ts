import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useUserQuota } from './use-user-quota';
import * as apiClient from '@/lib/remote/api-client';

// Mock API client
vi.mock('@/lib/remote/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
  extractApiErrorMessage: vi.fn((error, defaultMsg) => defaultMsg),
}));

describe('useUserQuota', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  it('should fetch user quota successfully', async () => {
    const mockData = {
      plan: 'pro',
      remainingAnalyses: 50,
    };

    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      data: mockData,
    });

    const { result } = renderHook(() => useUserQuota(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useUserQuota(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('should cache data for 1 minute', async () => {
    const mockData = {
      plan: 'free',
      remainingAnalyses: 5,
    };

    const getSpy = vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      data: mockData,
    });

    const { result, rerender } = renderHook(() => useUserQuota(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getSpy).toHaveBeenCalledTimes(1);

    // Rerender should use cached data
    rerender();

    expect(getSpy).toHaveBeenCalledTimes(1); // Still 1, not 2
  });
});
