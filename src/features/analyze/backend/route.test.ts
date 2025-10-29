import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { registerAnalyzeRoutes } from './route';
import * as service from './service';
import { testRequest } from '@/__tests__/utils/test-helpers';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import { createMockAnalysisRequest } from '@/__tests__/utils/mock-factories';
import { AnalysisCreateError, ERROR_CODES } from './error';

describe('Analyze Routes', () => {
  let app: Hono<AppEnv>;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockLogger: any;
  let mockConfig: any;

  beforeEach(() => {
    app = new Hono<AppEnv>();
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

    // Mock context
    app.use('*', async (c, next) => {
      c.set('userId', 'test-clerk-id');
      c.set('supabase', mockSupabase as any);
      c.set('logger', mockLogger);
      c.set('config', mockConfig);
      await next();
    });

    registerAnalyzeRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/analysis/create', () => {
    it('should return 201 with analysis ID when successful', async () => {
      // Arrange
      const mockRequest = createMockAnalysisRequest();
      const mockAnalysisId = 'new-analysis-id';

      vi.spyOn(service, 'createAnalysisService').mockResolvedValue(mockAnalysisId);

      // Act
      const res = await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe(mockAnalysisId);
      expect(service.createAnalysisService).toHaveBeenCalledWith(
        mockSupabase,
        mockLogger,
        mockConfig,
        'test-clerk-id',
        expect.objectContaining({
          name: mockRequest.name,
          gender: mockRequest.gender,
        })
      );
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const invalidRequest = {
        name: 'Test User',
        // gender 누락
        birthDate: '1990-01-01',
      };

      // Act
      const res = await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      // Assert
      expect(res.status).toBe(400);
    });

    it('should return 400 when quota is insufficient', async () => {
      // Arrange
      const mockRequest = createMockAnalysisRequest();

      const quotaError = new AnalysisCreateError(
        ERROR_CODES.INSUFFICIENT_QUOTA,
        'Insufficient quota'
      );
      vi.spyOn(service, 'createAnalysisService').mockRejectedValue(quotaError);

      // Act
      const res = await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe(ERROR_CODES.INSUFFICIENT_QUOTA);
    });

    it('should return 503 when AI API fails', async () => {
      // Arrange
      const mockRequest = createMockAnalysisRequest();

      const aiError = new AnalysisCreateError(
        ERROR_CODES.AI_API_ERROR,
        'AI service unavailable'
      );
      vi.spyOn(service, 'createAnalysisService').mockRejectedValue(aiError);

      // Act
      const res = await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error.code).toBe(ERROR_CODES.AI_API_ERROR);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: 인증되지 않은 앱
      const noAuthApp = new Hono<AppEnv>();
      noAuthApp.use('*', async (c, next) => {
        c.set('userId', null as any);
        c.set('supabase', mockSupabase as any);
        c.set('logger', mockLogger);
        c.set('config', mockConfig);
        await next();
      });
      registerAnalyzeRoutes(noAuthApp);

      const mockRequest = createMockAnalysisRequest();

      // Act
      const res = await testRequest(noAuthApp, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('인증');
    });

    it('should return 400 when lunar date conversion fails', async () => {
      // Arrange
      const mockRequest = createMockAnalysisRequest({
        isLunar: true,
        birthDate: 'invalid-date',
      });

      const lunarError = new AnalysisCreateError(
        ERROR_CODES.INVALID_LUNAR_DATE,
        'Invalid lunar date'
      );
      vi.spyOn(service, 'createAnalysisService').mockRejectedValue(lunarError);

      // Act
      const res = await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe(ERROR_CODES.INVALID_LUNAR_DATE);
    });

    it('should return 500 when internal error occurs', async () => {
      // Arrange
      const mockRequest = createMockAnalysisRequest();

      const internalError = new Error('Unexpected error');
      vi.spyOn(service, 'createAnalysisService').mockRejectedValue(internalError);

      // Act
      const res = await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log error when analysis creation fails', async () => {
      // Arrange
      const mockRequest = createMockAnalysisRequest();

      const error = new AnalysisCreateError(
        ERROR_CODES.INSUFFICIENT_QUOTA,
        'Quota exhausted'
      );
      vi.spyOn(service, 'createAnalysisService').mockRejectedValue(error);

      // Act
      await testRequest(app, '/api/analysis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create analysis',
        expect.any(Object)
      );
    });
  });
});
