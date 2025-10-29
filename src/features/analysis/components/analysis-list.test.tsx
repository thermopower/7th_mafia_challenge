import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { AnalysisList } from './analysis-list';
import * as useAnalysesListHook from '@/features/analysis/hooks/use-analyses-list';
import * as useDeleteAnalysisHook from '@/features/analysis/hooks/use-delete-analysis';
import * as useAnalysisFiltersHook from '@/features/analysis/hooks/use-analysis-filters';
import type { AnalysisListResponse } from '@/features/analysis/lib/dto';

vi.mock('@/features/analysis/hooks/use-analyses-list');
vi.mock('@/features/analysis/hooks/use-delete-analysis');
vi.mock('@/features/analysis/hooks/use-analysis-filters');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockAnalysesData: AnalysisListResponse = {
  analyses: [
    {
      id: 'analysis-1',
      name: '홍길동 사주',
      analysisType: 'yearly',
      modelUsed: 'gemini-2.5-flash',
      createdAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'analysis-2',
      name: '김철수 월운',
      analysisType: 'monthly',
      modelUsed: 'gemini-2.5-flash',
      createdAt: '2025-01-14T09:20:00Z',
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

describe('AnalysisList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useAnalysisFiltersHook, 'useAnalysisFilters').mockReturnValue({
      filters: { page: 1, limit: 10 },
      updateFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    vi.spyOn(useDeleteAnalysisHook, 'useDeleteAnalysis').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any);
  });

  it('should render list of analysis cards', () => {
    // Arrange
    vi.spyOn(useAnalysesListHook, 'useAnalysesList').mockReturnValue({
      data: mockAnalysesData,
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<AnalysisList />);

    // Assert
    expect(screen.getByText('홍길동 사주')).toBeInTheDocument();
    expect(screen.getByText('김철수 월운')).toBeInTheDocument();
  });

  it('should show skeleton loaders when loading', () => {
    // Arrange
    vi.spyOn(useAnalysesListHook, 'useAnalysesList').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    // Act
    renderWithProviders(<AnalysisList />);

    // Assert
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no analyses exist', () => {
    // Arrange
    vi.spyOn(useAnalysesListHook, 'useAnalysesList').mockReturnValue({
      data: { analyses: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<AnalysisList />);

    // Assert
    expect(screen.getByText('아직 분석 내역이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('첫 번째 사주 분석을 시작해보세요')).toBeInTheDocument();
  });

  it('should handle pagination button clicks', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockUpdateFilters = vi.fn();

    vi.spyOn(useAnalysisFiltersHook, 'useAnalysisFilters').mockReturnValue({
      filters: { page: 1, limit: 10 },
      updateFilters: mockUpdateFilters,
      clearFilters: vi.fn(),
    });

    const multiPageData: AnalysisListResponse = {
      ...mockAnalysesData,
      pagination: { total: 20, page: 1, limit: 10, totalPages: 2 },
    };

    vi.spyOn(useAnalysesListHook, 'useAnalysesList').mockReturnValue({
      data: multiPageData,
      isLoading: false,
      error: null,
    } as any);

    // Act
    renderWithProviders(<AnalysisList />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => btn.textContent?.includes('다음')) || buttons[buttons.length - 1];
    await user.click(nextButton);

    // Assert
    await waitFor(() => {
      expect(mockUpdateFilters).toHaveBeenCalledWith({ page: 2 });
    });
  });
});
