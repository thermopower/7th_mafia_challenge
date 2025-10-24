export const profileQueryKeys = {
  all: () => ['profiles'] as const,
  list: () => ['profiles', 'list'] as const,
  detail: (id: string) => ['profiles', 'detail', id] as const,
} as const;

export const PROFILE_STALE_TIME = 5 * 60 * 1000;
