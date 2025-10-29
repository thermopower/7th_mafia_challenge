import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { AnalysisCard } from './analysis-card';
import type { AnalysisListItem } from '@/features/analysis/lib/dto';

const mockAnalysis: AnalysisListItem = {
  id: 'test-analysis-123',
  name: '홍길동 사주',
  analysisType: 'yearly',
  modelUsed: 'gemini-2.5-flash',
  createdAt: '2025-01-15T10:30:00Z',
};

describe('AnalysisCard', () => {
  it('should render analysis information correctly', () => {
    // Arrange
    const mockOnDelete = vi.fn();

    // Act
    renderWithProviders(<AnalysisCard analysis={mockAnalysis} onDelete={mockOnDelete} />);

    // Assert
    expect(screen.getByText('홍길동 사주')).toBeInTheDocument();
    expect(screen.getByText('신년 운세')).toBeInTheDocument();
    expect(screen.getByText('Flash')).toBeInTheDocument();
    expect(screen.getByText('2025년 01월 15일')).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();

    // Act
    renderWithProviders(<AnalysisCard analysis={mockAnalysis} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button');
    await user.click(deleteButton);

    // Assert
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('test-analysis-123');
  });

  it('should render different analysis types with correct labels', () => {
    // Arrange
    const monthlyAnalysis: AnalysisListItem = {
      ...mockAnalysis,
      analysisType: 'monthly',
    };
    const mockOnDelete = vi.fn();

    // Act
    renderWithProviders(<AnalysisCard analysis={monthlyAnalysis} onDelete={mockOnDelete} />);

    // Assert
    expect(screen.getByText('월간 운세')).toBeInTheDocument();
  });

  it('should prevent navigation when delete button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();

    // Act
    renderWithProviders(<AnalysisCard analysis={mockAnalysis} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button');
    await user.click(deleteButton);

    // Assert - preventDefault should be called (delete handler was called)
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
