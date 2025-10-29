import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { PlanComparisonTable } from './plan-comparison-table';

describe('PlanComparisonTable', () => {
  it('should render plan comparison information', () => {
    // Arrange & Act
    renderWithProviders(<PlanComparisonTable />);

    // Assert
    expect(screen.getByText('요금제 비교')).toBeInTheDocument();
    expect(screen.getByText('₩0')).toBeInTheDocument();
  });

  it('should display Free plan with ₩0 price', () => {
    // Arrange & Act
    renderWithProviders(<PlanComparisonTable />);

    // Assert
    expect(screen.getByText('₩0')).toBeInTheDocument();
  });

  it('should highlight Pro plan as recommended', () => {
    // Arrange & Act
    renderWithProviders(<PlanComparisonTable />);

    // Assert
    expect(screen.getByText('추천')).toBeInTheDocument();
  });
});
