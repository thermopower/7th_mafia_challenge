import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { registerAnalysisRoutes } from './route';
import * as service from './service';
import { testRequest } from '@/__tests__/utils/test-helpers';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import { createMockUserAnalysis } from '@/__tests__/utils/mock-factories';

describe('Analysis Routes', () => {
  let app: Hono<AppEnv>;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    app = new Hono<AppEnv>();
    mockSupabase = createMockSupabaseClient();

    // Mock context
    app.use('*', async (c, next) => {
      c.set('userId', 'test-clerk-id');
      c.set('supabase', mockSupabase as any);
      c.set('logger', console as any);
      c.set('config', {} as any);
      await next();
    });

    registerAnalysisRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/analysis/list', () => {
    it('should return 200 with analysis list when successful', async () => {
      // Arrange
      const mockList = [
        createMockUserAnalysis({ id: 'analysis-1' }),
        createMockUserAnalysis({ id: 'analysis-2' }),
      ];

      vi.spyOn(service, 'getAnalysesList').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          analyses: mockList,
          total: 2,
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/list');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.analyses).toHaveLength(2);
      expect(json.total).toBe(2);
    });

    it('should return 200 with empty list when no analyses', async () => {
      // Arrange
      vi.spyOn(service, 'getAnalysesList').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          analyses: [],
          total: 0,
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/list');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.analyses).toHaveLength(0);
      expect(json.total).toBe(0);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: 인증되지 않은 앱
      const noAuthApp = new Hono<AppEnv>();
      noAuthApp.use('*', async (c, next) => {
        c.set('userId', null as any);
        c.set('supabase', mockSupabase as any);
        c.set('logger', console as any);
        c.set('config', {} as any);
        await next();
      });
      registerAnalysisRoutes(noAuthApp);

      // Act
      const res = await testRequest(noAuthApp, '/api/analysis/list');

      // Assert
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('인증');
    });

    it('should support pagination with limit and page', async () => {
      // Arrange
      const mockList = [createMockUserAnalysis()];

      vi.spyOn(service, 'getAnalysesList').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          analyses: mockList,
          total: 10,
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/list?limit=5&page=1');

      // Assert
      expect(res.status).toBe(200);
      expect(service.getAnalysesList).toHaveBeenCalledWith(
        mockSupabase,
        'test-clerk-id',
        expect.objectContaining({ limit: 5, page: 1 })
      );
    });
  });

  describe('GET /api/analysis/:id', () => {
    it('should return 200 with analysis detail when found', async () => {
      // Arrange
      const mockAnalysis = createMockUserAnalysis({ id: 'analysis-123' });

      vi.spyOn(service, 'getAnalysisDetail').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          analysis: {
            id: mockAnalysis.id,
            name: mockAnalysis.name,
            gender: mockAnalysis.gender,
            birthDate: mockAnalysis.birth_date,
            birthTime: mockAnalysis.birth_time,
            isLunar: mockAnalysis.is_lunar,
            analysisType: mockAnalysis.analysis_type,
            modelUsed: mockAnalysis.model_used,
            createdAt: mockAnalysis.created_at,
          },
          result: mockAnalysis.result_json,
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/analysis-123');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.analysis.id).toBe('analysis-123');
      expect(json.result).toBeDefined();
    });

    it('should return 404 when analysis not found', async () => {
      // Arrange
      vi.spyOn(service, 'getAnalysisDetail').mockResolvedValue({
        ok: false,
        status: 404,
        error: {
          code: 'ANALYSIS_NOT_FOUND',
          message: 'Analysis not found',
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/non-existent');

      // Assert
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('ANALYSIS_NOT_FOUND');
    });

    it('should return 403 when accessing other user analysis', async () => {
      // Arrange
      vi.spyOn(service, 'getAnalysisDetail').mockResolvedValue({
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/other-user-analysis');

      // Assert
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/analysis/:id/related', () => {
    it('should return 200 with related analyses', async () => {
      // Arrange
      const mockRelated = [
        createMockUserAnalysis({ id: 'related-1' }),
        createMockUserAnalysis({ id: 'related-2' }),
      ];

      vi.spyOn(service, 'getRelatedAnalyses').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          analyses: mockRelated,
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/analysis-123/related?limit=3');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.analyses).toHaveLength(2);
    });

    it('should return 200 with empty array when no related analyses', async () => {
      // Arrange
      vi.spyOn(service, 'getRelatedAnalyses').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          analyses: [],
        },
      });

      // Act
      const res = await testRequest(app, '/api/analysis/analysis-123/related');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.analyses).toHaveLength(0);
    });
  });

  describe('DELETE /api/analysis/:id', () => {
    it('should return 200 when deletion successful', async () => {
      // Arrange
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';

      vi.spyOn(service, 'deleteAnalysisById').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          message: 'Analysis deleted successfully',
        },
      });

      // Act
      const res = await testRequest(app, `/api/analysis/${validUUID}`, {
        method: 'DELETE',
      });

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('deleted');
    });

    it('should return 404 when analysis not found for deletion', async () => {
      // Arrange
      const validUUID = '123e4567-e89b-12d3-a456-426614174001';

      vi.spyOn(service, 'deleteAnalysisById').mockResolvedValue({
        ok: false,
        status: 404,
        error: {
          code: 'ANALYSIS_NOT_FOUND',
          message: 'Analysis not found',
        },
      });

      // Act
      const res = await testRequest(app, `/api/analysis/${validUUID}`, {
        method: 'DELETE',
      });

      // Assert
      expect(res.status).toBe(404);
    });

    it('should return 403 when trying to delete other user analysis', async () => {
      // Arrange
      const validUUID = '123e4567-e89b-12d3-a456-426614174002';

      vi.spyOn(service, 'deleteAnalysisById').mockResolvedValue({
        ok: false,
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete other user analysis',
        },
      });

      // Act
      const res = await testRequest(app, `/api/analysis/${validUUID}`, {
        method: 'DELETE',
      });

      // Assert
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });
});
