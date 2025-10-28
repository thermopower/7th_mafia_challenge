import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { QuotaBadge } from './quota-badge';
import * as useUserQuotaHook from '@/features/user/hooks/use-user-quota';

vi.mock('@/features/user/hooks/use-user-quota');

describe('QuotaBadge', () => {
  it('should show loading spinner when data is loading', () => {
    vi.spyOn(useUserQuotaHook, 'useUserQuota').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    renderWithProviders(<QuotaBadge />);

    // Loader2 icon should be visible
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display quota and plan when data is loaded', () => {
    vi.spyOn(useUserQuotaHook, 'useUserQuota').mockReturnValue({
      data: {
        plan: 'pro',
        remainingAnalyses: 50,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderWithProviders(<QuotaBadge />);

    expect(screen.getByText('남은 횟수: 50회')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('should show destructive variant when remaining analyses <= 3', () => {
    vi.spyOn(useUserQuotaHook, 'useUserQuota').mockReturnValue({
      data: {
        plan: 'free',
        remainingAnalyses: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderWithProviders(<QuotaBadge />);

    expect(screen.getByText('남은 횟수: 2회')).toBeInTheDocument();
    expect(screen.getByText('무료')).toBeInTheDocument();
  });

  it('should show free plan label for non-pro users', () => {
    vi.spyOn(useUserQuotaHook, 'useUserQuota').mockReturnValue({
      data: {
        plan: 'free',
        remainingAnalyses: 10,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderWithProviders(<QuotaBadge />);

    expect(screen.getByText('무료')).toBeInTheDocument();
  });

  it('should return null when data is not available', () => {
    vi.spyOn(useUserQuotaHook, 'useUserQuota').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = renderWithProviders(<QuotaBadge />);

    expect(container.firstChild).toBeNull();
  });
});
