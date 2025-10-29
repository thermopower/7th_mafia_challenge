import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { CancelSubscriptionModal } from './cancel-subscription-modal';
import * as useCancelSubscriptionHook from '@/features/subscription/hooks/use-cancel-subscription';

vi.mock('@/features/subscription/hooks/use-cancel-subscription');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('CancelSubscriptionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useCancelSubscriptionHook, 'useCancelSubscription').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('should render cancel confirmation dialog', () => {
    // Arrange & Act
    renderWithProviders(
      <CancelSubscriptionModal
        open={true}
        onOpenChange={vi.fn()}
        nextBillingDate="2025-02-15T00:00:00Z"
      />
    );

    // Assert
    expect(screen.getByText('구독을 취소하시겠습니까?')).toBeInTheDocument();
    expect(screen.getByText(/Pro 혜택이 유지됩니다/)).toBeInTheDocument();
  });

  it('should call cancel subscription when confirm button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockMutate = vi.fn((_, options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    });

    vi.spyOn(useCancelSubscriptionHook, 'useCancelSubscription').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    const mockOnOpenChange = vi.fn();

    // Act
    renderWithProviders(
      <CancelSubscriptionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        nextBillingDate="2025-02-15T00:00:00Z"
      />
    );

    const confirmButton = screen.getByRole('button', { name: '구독 취소' });
    await user.click(confirmButton);

    // Assert
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
