import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { QuotaWarningModal } from './quota-warning-modal';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('QuotaWarningModal', () => {
  it('should show warning when remaining quota is 0', () => {
    // Arrange & Act
    renderWithProviders(<QuotaWarningModal remaining={0} tier="free" />);

    // Assert
    expect(screen.getByText('더 이상 무료 분석 횟수가 없습니다')).toBeInTheDocument();
    expect(screen.getByText(/Pro 요금제로 업그레이드/)).toBeInTheDocument();
  });

  it('should show warning when remaining quota is between 1-3', () => {
    // Arrange & Act
    renderWithProviders(<QuotaWarningModal remaining={2} tier="free" />);

    // Assert
    expect(screen.getByText('남은 분석 횟수가 2회입니다')).toBeInTheDocument();
    expect(screen.getByText(/Pro로 업그레이드/)).toBeInTheDocument();
  });

  it('should show different message for Pro users', () => {
    // Arrange & Act
    renderWithProviders(<QuotaWarningModal remaining={2} tier="pro" />);

    // Assert
    expect(screen.getByText('남은 분석 횟수가 2회입니다')).toBeInTheDocument();
    expect(screen.getByText(/다음 결제일에 10회로 초기화됩니다/)).toBeInTheDocument();
  });
});
