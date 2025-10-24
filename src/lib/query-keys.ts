import type { AnalysisListQuery } from '@/features/analysis/lib/dto';

export const queryKeys = {
  analyses: {
    all: () => ['analyses'] as const,
    list: (filters: AnalysisListQuery) => ['analyses', 'list', filters] as const,
    detail: (id: string) => ['analyses', 'detail', id] as const,
  },
  user: {
    quota: () => ['user', 'quota'] as const,
    subscription: () => ['user', 'subscription'] as const,
  },
} as const;
