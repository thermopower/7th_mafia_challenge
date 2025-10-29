import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { FortuneCard } from './fortune-card';

describe('FortuneCard', () => {
  it('should render fortune information correctly', () => {
    // Arrange
    const mockProps = {
      type: 'career' as const,
      emoji: '💼',
      label: '직업운',
      content: '올해 직업운이 좋습니다.',
    };

    // Act
    renderWithProviders(<FortuneCard {...mockProps} />);

    // Assert
    expect(screen.getByText('💼')).toBeInTheDocument();
    expect(screen.getByText('직업운')).toBeInTheDocument();
    expect(screen.getByText('올해 직업운이 좋습니다.')).toBeInTheDocument();
  });

  it('should show expand button when content is longer than 300 characters', () => {
    // Arrange
    const longContent = 'a'.repeat(350);
    const mockProps = {
      type: 'career' as const,
      emoji: '💼',
      label: '직업운',
      content: longContent,
    };

    // Act
    renderWithProviders(<FortuneCard {...mockProps} />);

    // Assert
    expect(screen.getByText('더 보기')).toBeInTheDocument();
  });

  it('should toggle expand/collapse when button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const longContent = 'a'.repeat(350);
    const mockProps = {
      type: 'career' as const,
      emoji: '💼',
      label: '직업운',
      content: longContent,
    };

    // Act
    renderWithProviders(<FortuneCard {...mockProps} />);

    const expandButton = screen.getByText('더 보기');
    await user.click(expandButton);

    // Assert
    expect(screen.getByText('접기')).toBeInTheDocument();

    // Act - Collapse
    const collapseButton = screen.getByText('접기');
    await user.click(collapseButton);

    // Assert
    expect(screen.getByText('더 보기')).toBeInTheDocument();
  });
});
