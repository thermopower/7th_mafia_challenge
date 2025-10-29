import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserQuotaService,
  createAnalysisService,
} from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import {
  createMockUser,
  createMockAnalysisRequest,
  createMockGeminiResponse,
} from '@/__tests__/utils/mock-factories';
import { AnalysisCreateError, ERROR_CODES, ERROR_MESSAGES } from './error';

// 외부 라이브러리 모킹
vi.mock('@/lib/saju/calculate', () => ({
  calculateSaju: vi.fn(() => ({
    yearPillar: '갑자',
    monthPillar: '을축',
    dayPillar: '병인',
    timePillar: '정묘',
  })),
}));

vi.mock('@/lib/date/lunar', () => ({
  lunarToSolar: vi.fn((date: Date) => {
    // 음력 → 양력 변환 모킹 (간단히 한 달 뒤로)
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1);
    return result;
  }),
}));

vi.mock('@/lib/gemini/client', () => ({
  generateAnalysis: vi.fn(),
}));

vi.mock('@/lib/gemini/prompts', () => ({
  createAnalysisPrompt: vi.fn(() => 'mocked prompt'),
}));

describe('Analyze Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockLogger: any;
  let mockConfig: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    mockConfig = {
      geminiApiKey: 'test-api-key',
    };
    vi.clearAllMocks();
  });

  describe('getUserQuotaService', () => {
    it('should return user quota when user exists', async () => {
      // Arrange
      const mockUser = createMockUser({
        clerk_id: 'user-123',
        remaining_analyses: 5,
        subscription_tier: 'free',
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getUserQuotaService(mockSupabase, 'user-123');

      // Assert
      expect(result.remaining).toBe(5);
      expect(result.tier).toBe('free');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'User not found' },
              }),
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(
        getUserQuotaService(mockSupabase, 'non-existent')
      ).rejects.toThrow(AnalysisCreateError);

      await expect(
        getUserQuotaService(mockSupabase, 'non-existent')
      ).rejects.toMatchObject({
        code: ERROR_CODES.USER_NOT_FOUND,
        message: ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
      });
    });
  });

  describe('createAnalysisService', () => {
    it('should create analysis successfully with sufficient quota', async () => {
      // Arrange
      const mockUser = createMockUser({
        id: 'user-uuid',
        clerk_id: 'user-123',
        remaining_analyses: 5,
        subscription_tier: 'free',
      });
      const mockRequest = createMockAnalysisRequest();
      const mockAIResponse = createMockGeminiResponse();

      // 사용자 조회 모킹
      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
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
        if (table === 'user_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'new-analysis-id' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // AI 응답 모킹
      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockResolvedValue(mockAIResponse);

      // Act
      const result = await createAnalysisService(
        mockSupabase,
        mockLogger,
        mockConfig,
        'user-123',
        mockRequest
      );

      // Assert
      expect(result).toBe('new-analysis-id');
      expect(generateAnalysis).toHaveBeenCalledWith(
        'mocked prompt',
        'gemini-2.5-flash'
      );
    });

    it('should use pro model when user has pro subscription', async () => {
      // Arrange
      const proUser = createMockUser({
        id: 'pro-user-uuid',
        remaining_analyses: 10,
        subscription_tier: 'pro',
      });
      const mockRequest = createMockAnalysisRequest();
      const mockAIResponse = createMockGeminiResponse();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: proUser,
                    error: null,
                  }),
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
        if (table === 'user_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'pro-analysis-id' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockResolvedValue(mockAIResponse);

      // Act
      const result = await createAnalysisService(
        mockSupabase,
        mockLogger,
        mockConfig,
        'pro-user',
        mockRequest
      );

      // Assert
      expect(result).toBe('pro-analysis-id');
      expect(generateAnalysis).toHaveBeenCalledWith(
        'mocked prompt',
        'gemini-2.5-pro' // Pro 모델 사용
      );
    });

    it('should throw error when quota is insufficient', async () => {
      // Arrange
      const mockUser = createMockUser({
        remaining_analyses: 0, // 쿼터 없음
        subscription_tier: 'free',
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const mockRequest = createMockAnalysisRequest();

      // Act & Assert
      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          mockRequest
        )
      ).rejects.toThrow(AnalysisCreateError);

      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          mockRequest
        )
      ).rejects.toMatchObject({
        code: ERROR_CODES.INSUFFICIENT_QUOTA,
      });
    });

    it('should convert lunar date to solar date when isLunar is true', async () => {
      // Arrange
      const mockUser = createMockUser({
        id: 'user-uuid',
        remaining_analyses: 5,
      });
      const lunarRequest = createMockAnalysisRequest({
        isLunar: true,
        birthDate: '1990-01-01',
      });
      const mockAIResponse = createMockGeminiResponse();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
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
        if (table === 'user_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'lunar-analysis-id' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockResolvedValue(mockAIResponse);

      const { lunarToSolar } = await import('@/lib/date/lunar');

      // Act
      const result = await createAnalysisService(
        mockSupabase,
        mockLogger,
        mockConfig,
        'user-123',
        lunarRequest
      );

      // Assert
      expect(result).toBe('lunar-analysis-id');
      expect(lunarToSolar).toHaveBeenCalled();
    });

    it('should throw error when lunar conversion fails', async () => {
      // Arrange
      const mockUser = createMockUser({
        remaining_analyses: 5,
      });
      const invalidLunarRequest = createMockAnalysisRequest({
        isLunar: true,
        birthDate: 'invalid-date',
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const { lunarToSolar } = await import('@/lib/date/lunar');
      vi.mocked(lunarToSolar).mockImplementation(() => {
        throw new Error('Invalid lunar date');
      });

      // Act & Assert
      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          invalidLunarRequest
        )
      ).rejects.toThrow(AnalysisCreateError);

      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          invalidLunarRequest
        )
      ).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_LUNAR_DATE,
      });
    });

    it('should throw error when AI API fails', async () => {
      // Arrange
      const mockUser = createMockUser({
        id: 'user-uuid',
        remaining_analyses: 5,
      });
      const mockRequest = createMockAnalysisRequest();

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockRejectedValue(
        new Error('AI API timeout')
      );

      // Act & Assert
      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          mockRequest
        )
      ).rejects.toThrow(AnalysisCreateError);

      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          mockRequest
        )
      ).rejects.toMatchObject({
        code: ERROR_CODES.AI_API_ERROR,
      });
    });

    it('should save profile when saveAsProfile is true', async () => {
      // Arrange
      const mockUser = createMockUser({
        id: 'user-uuid',
        remaining_analyses: 5,
      });
      const mockRequest = createMockAnalysisRequest({
        saveAsProfile: true,
      });
      const mockAIResponse = createMockGeminiResponse();

      let profileInsertCalled = false;

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
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
        if (table === 'user_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'new-analysis-id' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_profiles') {
          profileInsertCalled = true;
          return {
            insert: vi.fn().mockResolvedValue({
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockResolvedValue(mockAIResponse);

      // Act
      await createAnalysisService(
        mockSupabase,
        mockLogger,
        mockConfig,
        'user-123',
        mockRequest
      );

      // Assert
      expect(profileInsertCalled).toBe(true);
    });

    it('should handle database insert error gracefully', async () => {
      // Arrange
      const mockUser = createMockUser({
        remaining_analyses: 5,
      });
      const mockRequest = createMockAnalysisRequest();
      const mockAIResponse = createMockGeminiResponse();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Insert failed' },
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockResolvedValue(mockAIResponse);

      // Act & Assert
      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          mockRequest
        )
      ).rejects.toThrow(AnalysisCreateError);

      await expect(
        createAnalysisService(
          mockSupabase,
          mockLogger,
          mockConfig,
          'user-123',
          mockRequest
        )
      ).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    });

    it('should decrement user quota after successful analysis', async () => {
      // Arrange
      const mockUser = createMockUser({
        id: 'user-uuid',
        remaining_analyses: 5,
      });
      const mockRequest = createMockAnalysisRequest();
      const mockAIResponse = createMockGeminiResponse();

      let quotaUpdated = false;
      let updatedQuota = 0;

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn((data: any) => {
              quotaUpdated = true;
              updatedQuota = data.remaining_analyses;
              return {
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              };
            }),
          } as any;
        }
        if (table === 'user_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'new-analysis-id' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { generateAnalysis } = await import('@/lib/gemini/client');
      vi.mocked(generateAnalysis).mockResolvedValue(mockAIResponse);

      // Act
      await createAnalysisService(
        mockSupabase,
        mockLogger,
        mockConfig,
        'user-123',
        mockRequest
      );

      // Assert
      expect(quotaUpdated).toBe(true);
      expect(updatedQuota).toBe(4); // 5 - 1 = 4
    });
  });
});
