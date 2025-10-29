import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { DeleteDialog } from './delete-dialog';

describe('DeleteDialog', () => {
  it('should render dialog when open is true', () => {
    // Arrange
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    // Act
    renderWithProviders(
      <DeleteDialog open={true} onOpenChange={mockOnOpenChange} onConfirm={mockOnConfirm} />
    );

    // Assert
    expect(screen.getByText('분석을 삭제하시겠습니까?')).toBeInTheDocument();
    expect(screen.getByText(/이 작업은 되돌릴 수 없습니다/)).toBeInTheDocument();
  });

  it('should call onOpenChange when cancel button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    // Act
    renderWithProviders(
      <DeleteDialog open={true} onOpenChange={mockOnOpenChange} onConfirm={mockOnConfirm} />
    );

    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);

    // Assert
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onConfirm when delete button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn();

    // Act
    renderWithProviders(
      <DeleteDialog open={true} onOpenChange={mockOnOpenChange} onConfirm={mockOnConfirm} />
    );

    const deleteButton = screen.getByText('삭제');
    await user.click(deleteButton);

    // Assert
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
