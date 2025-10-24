'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { AnalysisListQuery } from '@/features/analysis/lib/dto';

export const useAnalysisFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: AnalysisListQuery = {
    page: Number(searchParams.get('page')) || 1,
    limit: 10,
    search: searchParams.get('search') || undefined,
    analysisType: (searchParams.get('type') as AnalysisListQuery['analysisType']) || undefined,
    sortBy: 'created_at',
    order: 'desc',
  };

  const updateFilters = useCallback(
    (updates: Partial<AnalysisListQuery>) => {
      const params = new URLSearchParams(searchParams);

      // 페이지는 필터 변경 시 1로 리셋
      if (updates.search !== undefined || updates.analysisType !== undefined) {
        params.set('page', '1');
      } else if (updates.page !== undefined) {
        params.set('page', String(updates.page));
      }

      if (updates.search !== undefined) {
        if (updates.search) {
          params.set('search', updates.search);
        } else {
          params.delete('search');
        }
      }

      if (updates.analysisType !== undefined) {
        if (updates.analysisType) {
          params.set('type', updates.analysisType);
        } else {
          params.delete('type');
        }
      }

      router.push(`/dashboard?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return { filters, updateFilters, clearFilters };
};
