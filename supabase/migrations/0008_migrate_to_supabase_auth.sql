-- Migration: Migrate from Clerk to Supabase Auth
-- clerk_id 컬럼을 제거하고 Supabase auth.users의 id를 직접 사용

BEGIN;

-- 1. users 테이블의 id를 Supabase auth.users.id와 연결
-- 기존 데이터가 있다면 수동으로 마이그레이션 필요
-- 여기서는 테이블 구조만 변경

-- 2. clerk_id 컬럼 제거 (NOT NULL 제약 조건 먼저 제거)
ALTER TABLE public.users ALTER COLUMN clerk_id DROP NOT NULL;

-- 3. clerk_id 인덱스 삭제
DROP INDEX IF EXISTS idx_users_clerk_id;

-- 4. clerk_id 컬럼 삭제 (데이터가 있다면 주의!)
-- 프로덕션에서는 백업 후 실행할 것
ALTER TABLE public.users DROP COLUMN IF EXISTS clerk_id;

-- 5. id 컬럼에 대한 외래키 제약 추가 (auth.users 참조)
-- auth.users는 Supabase가 자동 생성하는 테이블
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey,
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 6. 코멘트 업데이트
COMMENT ON COLUMN public.users.id IS 'Supabase auth.users의 ID (외래키)';

-- 7. 기존 랜덤 UUID 생성 제거 (auth.users의 id를 사용하므로)
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

COMMIT;
