-- Migration: Create user_profiles table
-- 대상 인물(본인, 가족, 친구) 프로필 관리

-- user_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  is_lunar BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.user_profiles IS '대상 인물 프로필 (본인, 가족, 친구 등)';
COMMENT ON COLUMN public.user_profiles.user_id IS '프로필 소유자 ID';
COMMENT ON COLUMN public.user_profiles.gender IS '성별: male, female';
COMMENT ON COLUMN public.user_profiles.is_lunar IS '음력 여부';

-- Check constraints
ALTER TABLE public.user_profiles ADD CONSTRAINT check_gender
  CHECK (gender IN ('male', 'female'));

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id)
  WHERE deleted_at IS NULL;

-- updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
