import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { SubscriptionStatusCard } from './subscription-status-card';
import * as useSubscriptionStatusHook from '@/features/subscription/hooks/use-subscription-status';

vi.mock('@/features/subscription/hooks/use-subscription-status');

const mockSubscriptionData = {
  plan: 'pro',
  remainingAnalyses: 7,
  nextBillingDate: '2025-02-15T00:00:00Z',
  subscriptionStartDate: '2025-01-15T00:00:00Z',
};

describe('SubscriptionStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display active subscription status', () => {
    // Arrange
    vi.spyOn(useSubscriptionStatusHook, 'useSubscriptionStatus').mockReturnValue({
      data: mockSubscriptionData,
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<SubscriptionStatusCard />);

    // Assert
    expect(screen.getByText('현재 플랜')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText(/7.*10회/)).toBeInTheDocument();
    expect(screen.getByText('2025년 02월 15일')).toBeInTheDocument();
  });

  it('should display pending_cancel status correctly', () => {
    // Arrange
    const pendingCancelData = {
      ...mockSubscriptionData,
      plan: 'pending_cancel',
    };

    vi.spyOn(useSubscriptionStatusHook, 'useSubscriptionStatus').mockReturnValue({
      data: pendingCancelData,
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<SubscriptionStatusCard />);

    // Assert
    expect(screen.getByText('취소 예정')).toBeInTheDocument();
    expect(screen.getByText('만료 예정일')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    // Arrange
    vi.spyOn(useSubscriptionStatusHook, 'useSubscriptionStatus').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    // Act
    renderWithProviders(<SubscriptionStatusCard />);

    // Assert
    expect(screen.getByText('구독 정보')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
