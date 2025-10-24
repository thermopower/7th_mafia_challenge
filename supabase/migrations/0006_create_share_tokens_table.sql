-- Migration: Create share_tokens table
-- 분석 결과 공유 링크 토큰 관리

-- share_tokens 테이블 생성
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.user_analyses(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.share_tokens IS '분석 결과 공유 링크 토큰 (7일 유효)';
COMMENT ON COLUMN public.share_tokens.analysis_id IS '공유할 분석 ID';
COMMENT ON COLUMN public.share_tokens.token IS '공유 토큰 (UUID)';
COMMENT ON COLUMN public.share_tokens.expires_at IS '만료 시간 (생성일 + 7일)';

-- Indexes
CREATE INDEX idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX idx_share_tokens_expires_at ON public.share_tokens(expires_at);
CREATE INDEX idx_share_tokens_analysis_id ON public.share_tokens(analysis_id);

-- Disable RLS
ALTER TABLE public.share_tokens DISABLE ROW LEVEL SECURITY;

-- Optional: 자동으로 만료된 토큰 삭제하는 함수 (Cron에서 호출 가능)
CREATE OR REPLACE FUNCTION cleanup_expired_share_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.share_tokens
  WHERE expires_at < NOW();
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION cleanup_expired_share_tokens IS '만료된 공유 토큰 자동 삭제 (Cron 사용)';
