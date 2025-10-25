import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import { getUserQuota } from './service';

export const registerUserRoutes = (app: Hono<AppEnv>) => {
  // 사용자 구독 정보 조회
  app.get('/api/user/quota', async (c) => {
    const userId = c.get('userId'); // Clerk 인증 미들웨어에서 주입
    const supabase = c.get('supabase');

    if (!userId) {
      return c.json({ error: { message: '인증이 필요합니다' } }, 401);
    }

    const result = await getUserQuota(supabase, userId);

    return respond(c, result);
  });
};
