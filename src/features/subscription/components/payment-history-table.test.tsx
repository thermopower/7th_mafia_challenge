import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { PaymentHistoryTable } from './payment-history-table';
import * as usePaymentHistoryHook from '@/features/subscription/hooks/use-payment-history';

vi.mock('@/features/subscription/hooks/use-payment-history');

const mockPaymentHistory = {
  items: [
    {
      id: 'payment-1',
      orderId: 'ORDER-123456',
      amount: 9900,
      status: 'done',
      method: '카드',
      createdAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'payment-2',
      orderId: 'ORDER-123457',
      amount: 9900,
      status: 'done',
      method: '카드',
      createdAt: '2024-12-15T10:30:00Z',
    },
  ],
};

describe('PaymentHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment history table', () => {
    // Arrange
    vi.spyOn(usePaymentHistoryHook, 'usePaymentHistory').mockReturnValue({
      data: mockPaymentHistory,
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<PaymentHistoryTable />);

    // Assert
    expect(screen.getByText('결제 내역 (최근 12개월)')).toBeInTheDocument();
    expect(screen.getByText('ORDER-123456')).toBeInTheDocument();
    expect(screen.getByText('ORDER-123457')).toBeInTheDocument();
    expect(screen.getAllByText('₩9,900')).toHaveLength(2);
  });

  it('should show empty state when no payment history exists', () => {
    // Arrange
    vi.spyOn(usePaymentHistoryHook, 'usePaymentHistory').mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<PaymentHistoryTable />);

    // Assert
    expect(screen.getByText('결제 내역')).toBeInTheDocument();
    expect(screen.getByText('결제 내역이 없습니다.')).toBeInTheDocument();
  });
});
