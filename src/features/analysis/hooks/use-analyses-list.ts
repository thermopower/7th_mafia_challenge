'use client';

import { useQuery} from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { AnalysisListResponseSchema, type AnalysisListQuery } from '@/features/analysis/lib/dto';
import { queryKeys } from '@/lib/query-keys';

const fetchAnalysesList = async (query: AnalysisListQuery) => {
  try {
    const { data } = await apiClient.get('/api/analysis/list', { params: query });
    return AnalysisListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch analyses list.');
    throw new Error(message);
  }
};

export const useAnalysesList = (query: AnalysisListQuery) =>
  useQuery({
    queryKey: queryKeys.analyses.list(query),
    queryFn: () => fetchAnalysesList(query),
    staleTime: 5 * 60 * 1000, // 5분
  });
