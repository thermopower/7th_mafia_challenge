import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { NewAnalysisForm } from './new-analysis-form';
import * as useCreateAnalysisHook from '@/features/analyze/hooks/use-create-analysis';

vi.mock('@/features/analyze/hooks/use-create-analysis');

describe('NewAnalysisForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useCreateAnalysisHook, 'useCreateAnalysis').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('should render all form fields', () => {
    // Arrange & Act
    renderWithProviders(<NewAnalysisForm />);

    // Assert
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('생년월일')).toBeInTheDocument();
    expect(screen.getByText('음력')).toBeInTheDocument();
    expect(screen.getByText('분석 종류')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '분석 시작' })).toBeInTheDocument();
  });

  it('should render form and accept user input', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.spyOn(useCreateAnalysisHook, 'useCreateAnalysis').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    // Act
    renderWithProviders(<NewAnalysisForm />);

    const nameInput = screen.getByLabelText('이름');
    const birthDateInput = screen.getByLabelText('생년월일');

    await user.type(nameInput, '홍길동');
    await user.type(birthDateInput, '1990-01-01');

    // Assert - 입력이 정상적으로 동작하는지 확인
    expect(nameInput).toHaveValue('홍길동');
    expect(birthDateInput).toHaveValue('1990-01-01');
  });

  it('should show validation errors when required fields are empty', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.spyOn(useCreateAnalysisHook, 'useCreateAnalysis').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    // Act
    renderWithProviders(<NewAnalysisForm />);

    const submitButton = screen.getByRole('button', { name: '분석 시작' });
    await user.click(submitButton);

    // Assert - form validation should prevent submission
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show loading state when analysis is being created', () => {
    // Arrange
    vi.spyOn(useCreateAnalysisHook, 'useCreateAnalysis').mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    // Act
    renderWithProviders(<NewAnalysisForm />);

    // Assert
    expect(screen.queryByRole('button', { name: '분석 시작' })).not.toBeInTheDocument();
    expect(screen.getByText(/분석 중/i)).toBeInTheDocument();
  });
});
