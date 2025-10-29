import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAnalysisDetail,
  getRelatedAnalyses,
  deleteAnalysis,
  getAnalysesList,
  deleteAnalysisById,
} from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import {
  createMockUser,
  createMockUserAnalysis,
} from '@/__tests__/utils/mock-factories';
import { analysisErrorCodes } from './error';

describe('Analysis Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('getAnalysisDetail', () => {
    it('should return analysis detail when valid ID and user provided', async () => {
      // Arrange: 테스트 데이터 준비
      const mockUser = createMockUser({ id: 'user-uuid-123' });
      const mockAnalysis = createMockUserAnalysis({
        id: 'analysis-123',
        user_id: mockUser.id,
        name: '홍길동',
        deleted_at: null,
      });

      // users 테이블 조회 모킹
      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        // user_analyses 테이블 조회 모킹
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAnalysis,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act: 함수 실행
      const result = await getAnalysisDetail(
        mockSupabase,
        mockUser.clerk_id,
        'analysis-123'
      );

      // Assert: 결과 검증
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analysis.id).toBe('analysis-123');
        expect(result.data.analysis.name).toBe('홍길동');
        expect(result.data.result).toHaveProperty('general');
        expect(result.data.result).toHaveProperty('wealth');
      }
    });

    it('should return 404 error when user not found', async () => {
      // Arrange: 사용자 없음
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getAnalysisDetail(
        mockSupabase,
        'non-existent-clerk-id',
        'analysis-123'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
        expect(result.error.code).toBe(analysisErrorCodes.notFound);
      }
    });

    it('should return 404 error when analysis not found', async () => {
      // Arrange: 사용자는 있지만 분석 없음
      const mockUser = createMockUser();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        // user_analyses: 분석 없음
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getAnalysisDetail(
        mockSupabase,
        mockUser.clerk_id,
        'non-existent-analysis'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
        expect(result.error.code).toBe(analysisErrorCodes.notFound);
      }
    });
  });

  describe('getRelatedAnalyses', () => {
    it('should return related analyses with same name', async () => {
      // Arrange
      const mockUser = createMockUser();
      const currentAnalysis = createMockUserAnalysis({
        id: 'current-id',
        name: '홍길동',
      });
      const relatedAnalyses = [
        createMockUserAnalysis({ id: 'related-1', name: '홍길동' }),
        createMockUserAnalysis({ id: 'related-2', name: '홍길동' }),
      ];

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        // 현재 분석 조회
        if (table === 'user_analyses') {
          const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: relatedAnalyses,
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: currentAnalysis,
              error: null,
            }),
          };
          return mockChain as any;
        }
        return {} as any;
      });

      // Act
      const result = await getRelatedAnalyses(
        mockSupabase,
        mockUser.clerk_id,
        'current-id',
        5
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analyses).toHaveLength(2);
        expect(result.data.analyses[0].name).toBe('홍길동');
      }
    });

    it('should return empty array when no related analyses found', async () => {
      // Arrange
      const mockUser = createMockUser();
      const currentAnalysis = createMockUserAnalysis({ name: '홍길동' });

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: currentAnalysis,
              error: null,
            }),
          };
          return mockChain as any;
        }
        return {} as any;
      });

      // Act
      const result = await getRelatedAnalyses(
        mockSupabase,
        mockUser.clerk_id,
        'current-id',
        5
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analyses).toEqual([]);
      }
    });
  });

  describe('deleteAnalysis', () => {
    it('should soft delete analysis successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockAnalysis = createMockUserAnalysis({
        id: 'analysis-to-delete',
        user_id: mockUser.id,
      });

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockAnalysis,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await deleteAnalysis(
        mockSupabase,
        mockUser.clerk_id,
        'analysis-to-delete'
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.ok).toBe(true);
      }
    });

    it('should return 404 when analysis not found for deletion', async () => {
      // Arrange
      const mockUser = createMockUser();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await deleteAnalysis(
        mockSupabase,
        mockUser.clerk_id,
        'non-existent'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
        expect(result.error.code).toBe(analysisErrorCodes.notFound);
      }
    });

    it('should prevent deleting another users analysis', async () => {
      // Arrange: 사용자 A가 사용자 B의 분석을 삭제하려는 시도
      const userA = createMockUser({ id: 'user-a' });
      const userBAnalysis = createMockUserAnalysis({ user_id: 'user-b' });

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: userA,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          // eq('user_id', user.id) 조건이 맞지 않아 null 반환
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null, // 권한 없음
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await deleteAnalysis(
        mockSupabase,
        userA.clerk_id,
        userBAnalysis.id
      );

      // Assert: 404 반환 (권한 없는 접근은 존재하지 않는 것처럼 처리)
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
      }
    });
  });

  describe('getAnalysesList', () => {
    it('should return paginated list with default query', async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockAnalyses = [
        createMockUserAnalysis({ name: '홍길동' }),
        createMockUserAnalysis({ name: '김철수' }),
      ];

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: mockAnalyses,
              error: null,
              count: 2,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getAnalysesList(mockSupabase, mockUser.clerk_id, {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analyses).toHaveLength(2);
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.total).toBe(2);
      }
    });

    it('should filter by search query', async () => {
      // Arrange
      const mockUser = createMockUser();
      const filteredAnalyses = [
        createMockUserAnalysis({ name: '홍길동' }),
      ];

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(), // 검색 필터
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: filteredAnalyses,
              error: null,
              count: 1,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getAnalysesList(mockSupabase, mockUser.clerk_id, {
        page: 1,
        limit: 10,
        search: '홍길동',
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analyses).toHaveLength(1);
        expect(result.data.analyses[0].name).toBe('홍길동');
      }
    });

    it('should filter by analysis type', async () => {
      // Arrange
      const mockUser = createMockUser();
      const specificTypeAnalyses = [
        createMockUserAnalysis({ analysis_type: 'wealth' }),
      ];

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: specificTypeAnalyses,
              error: null,
              count: 1,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getAnalysesList(mockSupabase, mockUser.clerk_id, {
        page: 1,
        limit: 10,
        analysisType: 'wealth',
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analyses[0].analysisType).toBe('wealth');
      }
    });

    it('should return empty list when no analyses found', async () => {
      // Arrange
      const mockUser = createMockUser();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getAnalysesList(mockSupabase, mockUser.clerk_id, {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.analyses).toEqual([]);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it('should handle database error gracefully', async () => {
      // Arrange
      const mockUser = createMockUser();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
              count: null,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getAnalysesList(mockSupabase, mockUser.clerk_id, {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(500);
        expect(result.error.code).toBe(analysisErrorCodes.fetchError);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle user lookup error', async () => {
      // Arrange: 사용자 조회 시 DB 에러
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection timeout' },
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getAnalysesList(mockSupabase, 'clerk-id', {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(500);
        expect(result.error.code).toBe(analysisErrorCodes.fetchError);
      }
    });

    it('should return 404 when user does not exist', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getAnalysesList(mockSupabase, 'non-existent', {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        order: 'desc',
      });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(404);
        expect(result.error.code).toBe(analysisErrorCodes.notFound);
      }
    });
  });
});
