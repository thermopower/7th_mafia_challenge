-- Migration: Restore Clerk Integration
-- Clerk을 인증 시스템으로 다시 사용 (구글 로그인)
-- Supabase는 데이터베이스로만 사용

BEGIN;

-- 1. auth.users 외래키 제약 제거 (Clerk ID를 사용하므로)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. clerk_id 컬럼 추가
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- 3. clerk_id에 UNIQUE 제약 추가
ALTER TABLE public.users
  ADD CONSTRAINT users_clerk_id_unique UNIQUE (clerk_id);

-- 4. clerk_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);

-- 5. 코멘트 업데이트
COMMENT ON COLUMN public.users.id IS 'Supabase 내부 UUID (Primary Key)';
COMMENT ON COLUMN public.users.clerk_id IS 'Clerk 사용자 ID (인증용)';

-- 6. id 컬럼 기본값 복원 (자동 UUID 생성)
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMIT;
