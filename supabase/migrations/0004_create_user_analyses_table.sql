-- Migration: Create user_analyses table
-- AI 사주 분석 결과 저장

-- user_analyses 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  is_lunar BOOLEAN NOT NULL DEFAULT false,
  analysis_type TEXT NOT NULL,
  model_used TEXT NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.user_analyses IS 'AI 사주 분석 결과';
COMMENT ON COLUMN public.user_analyses.user_id IS '분석 요청자 ID';
COMMENT ON COLUMN public.user_analyses.profile_id IS '연관 프로필 ID (선택)';
COMMENT ON COLUMN public.user_analyses.analysis_type IS '분석 종류: monthly, yearly, lifetime';
COMMENT ON COLUMN public.user_analyses.model_used IS '사용 AI 모델: gemini-2.5-flash, gemini-2.5-pro';
COMMENT ON COLUMN public.user_analyses.result_json IS 'AI 분석 결과 JSON: {general, wealth, love, health, job}';

-- Check constraints
ALTER TABLE public.user_analyses ADD CONSTRAINT check_gender_analyses
  CHECK (gender IN ('male', 'female'));

ALTER TABLE public.user_analyses ADD CONSTRAINT check_analysis_type
  CHECK (analysis_type IN ('monthly', 'yearly', 'lifetime'));

ALTER TABLE public.user_analyses ADD CONSTRAINT check_model_used
  CHECK (model_used IN ('gemini-2.5-flash', 'gemini-2.5-pro'));

-- Validate result_json structure (optional, can be enforced in backend)
ALTER TABLE public.user_analyses ADD CONSTRAINT check_result_json_keys
  CHECK (
    result_json ? 'general' AND
    result_json ? 'wealth' AND
    result_json ? 'love' AND
    result_json ? 'health' AND
    result_json ? 'job'
  );

-- Indexes
CREATE INDEX idx_user_analyses_user_id ON public.user_analyses(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_user_analyses_created_at ON public.user_analyses(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_user_analyses_profile_id ON public.user_analyses(profile_id)
  WHERE profile_id IS NOT NULL AND deleted_at IS NULL;

-- Disable RLS
ALTER TABLE public.user_analyses DISABLE ROW LEVEL SECURITY;
