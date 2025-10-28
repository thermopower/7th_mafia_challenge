import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createMockSupabaseClient = (): SupabaseClient => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    from: vi.fn(() => mockQuery),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      })),
    },
  } as unknown as SupabaseClient;
};

// 사용 예시
export const mockSuccessQuery = (mockClient: SupabaseClient, data: any) => {
  vi.spyOn(mockClient, 'from').mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  } as any);
};

export const mockErrorQuery = (mockClient: SupabaseClient, error: string) => {
  vi.spyOn(mockClient, 'from').mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: error },
        }),
      }),
    }),
  } as any);
};
