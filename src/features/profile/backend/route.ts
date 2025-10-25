import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CreateProfileRequestSchema,
  UpdateProfileRequestSchema,
} from './schema';
import {
  getProfilesList,
  createProfile,
  updateProfile,
  deleteProfile,
} from './service';
import {
  profileErrorCodes,
  type ProfileServiceError,
} from './error';

export const registerProfileRoutes = (app: Hono<AppEnv>) => {
  // 1. 프로필 목록 조회
  app.get('/api/profiles', async (c) => {
    const userId = c.get('userId'); // Clerk 인증 미들웨어에서 주입
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '인증이 필요합니다'));
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getProfilesList(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProfileServiceError, unknown>;
      logger.error('Failed to fetch profiles', errorResult.error.message);
    }

    return respond(c, result);
  });

  // 2. 프로필 생성
  app.post('/api/profiles', async (c) => {
    const userId = c.get('userId'); // Clerk 인증 미들웨어에서 주입
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '인증이 필요합니다'));
    }

    const body = await c.req.json();
    const parsedBody = CreateProfileRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_PROFILE_DATA',
          '입력 데이터가 유효하지 않습니다',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createProfile(supabase, userId, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProfileServiceError, unknown>;
      logger.error('Failed to create profile', errorResult.error.message);
    }

    return respond(c, result);
  });

  // 3. 프로필 수정
  app.patch('/api/profiles/:id', async (c) => {
    const userId = c.get('userId'); // Clerk 인증 미들웨어에서 주입
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '인증이 필요합니다'));
    }

    const profileId = c.req.param('id');
    const body = await c.req.json();
    const parsedBody = UpdateProfileRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_PROFILE_DATA',
          '입력 데이터가 유효하지 않습니다',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await updateProfile(supabase, userId, profileId, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProfileServiceError, unknown>;
      logger.error('Failed to update profile', errorResult.error.message);
    }

    return respond(c, result);
  });

  // 4. 프로필 삭제
  app.delete('/api/profiles/:id', async (c) => {
    const userId = c.get('userId'); // Clerk 인증 미들웨어에서 주입
    if (!userId) {
      return respond(c, failure(401, 'UNAUTHORIZED', '인증이 필요합니다'));
    }

    const profileId = c.req.param('id');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await deleteProfile(supabase, userId, profileId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProfileServiceError, unknown>;
      logger.error('Failed to delete profile', errorResult.error.message);
    }

    return respond(c, result);
  });
};
