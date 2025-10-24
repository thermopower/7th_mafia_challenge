-- Migration: Create payment_history table
-- 토스페이먼츠 결제 내역 관리

-- payment_history 테이블 생성
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  payment_key TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payment_history IS '토스페이먼츠 결제 내역';
COMMENT ON COLUMN public.payment_history.order_id IS '주문 ID (토스페이먼츠)';
COMMENT ON COLUMN public.payment_history.payment_key IS '결제 키 (토스페이먼츠)';
COMMENT ON COLUMN public.payment_history.amount IS '결제 금액 (원)';
COMMENT ON COLUMN public.payment_history.status IS '결제 상태: pending, done, canceled, failed';
COMMENT ON COLUMN public.payment_history.method IS '결제 수단: card, billing';

-- Check constraints
ALTER TABLE public.payment_history ADD CONSTRAINT check_status
  CHECK (status IN ('pending', 'done', 'canceled', 'failed'));

ALTER TABLE public.payment_history ADD CONSTRAINT check_amount_positive
  CHECK (amount > 0);

-- Indexes
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_order_id ON public.payment_history(order_id);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);

-- updated_at trigger
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;
