'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { useAnalysesList } from '@/features/analysis/hooks/use-analyses-list';
import { useDeleteAnalysis } from '@/features/analysis/hooks/use-delete-analysis';
import { useAnalysisFilters } from '@/features/analysis/hooks/use-analysis-filters';
import { AnalysisCard } from './analysis-card';
import { AnalysisFilters } from './analysis-filters';
import { AnalysisPagination } from './analysis-pagination';
import { DeleteDialog } from './delete-dialog';
import { AnalysisCardSkeleton } from './analysis-card-skeleton';

export const AnalysisList = () => {
  const { toast } = useToast();
  const { filters, updateFilters, clearFilters } = useAnalysisFilters();
  const { data, isLoading, error } = useAnalysesList(filters);
  const deleteMutation = useDeleteAnalysis();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      toast({
        title: '삭제 완료',
        description: '분석이 삭제되었습니다.',
      });
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AnalysisFilters
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AnalysisCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="목록을 불러올 수 없습니다"
        message={error instanceof Error ? error.message : '다시 시도해주세요.'}
      />
    );
  }

  if (!data || data.analyses.length === 0) {
    return (
      <>
        <AnalysisFilters
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
        />
        <EmptyState
          title="아직 분석 내역이 없습니다"
          message="첫 번째 사주 분석을 시작해보세요"
          actionLabel="첫 분석하기"
          actionHref="/analyze/new"
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <AnalysisFilters
        filters={filters}
        onUpdateFilters={updateFilters}
        onClearFilters={clearFilters}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.analyses.map((analysis) => (
          <AnalysisCard
            key={analysis.id}
            analysis={analysis}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      <AnalysisPagination
        currentPage={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={(page) => updateFilters({ page })}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
