-- Migration: Create users table
-- 사용자 기본 정보 및 구독 상태 관리

-- pgcrypto extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  remaining_analyses INTEGER NOT NULL DEFAULT 3,
  billing_key TEXT,
  subscription_start_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.users IS '사용자 기본 정보 및 구독 상태';
COMMENT ON COLUMN public.users.clerk_id IS 'Clerk 사용자 고유 ID';
COMMENT ON COLUMN public.users.subscription_tier IS '구독 등급: free, pro, pending_cancel';
COMMENT ON COLUMN public.users.remaining_analyses IS '잔여 분석 횟수';
COMMENT ON COLUMN public.users.billing_key IS '토스페이먼츠 빌링키';
COMMENT ON COLUMN public.users.cancel_at_period_end IS '기간 종료 시 취소 여부';

-- Check constraints
ALTER TABLE public.users ADD CONSTRAINT check_subscription_tier
  CHECK (subscription_tier IN ('free', 'pro', 'pending_cancel'));

ALTER TABLE public.users ADD CONSTRAINT check_remaining_analyses_non_negative
  CHECK (remaining_analyses >= 0);

-- Indexes
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX idx_users_next_billing_date ON public.users(next_billing_date)
  WHERE subscription_tier = 'pro' AND deleted_at IS NULL;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- updated_at trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
