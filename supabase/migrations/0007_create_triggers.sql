-- 0007_create_triggers.sql
-- updated_at 자동 업데이트 트리거 생성

-- Function: updated_at 컬럼을 현재 시간으로 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: users 테이블
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_users_updated_at'
      AND tgrelid = 'public.users'::regclass
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Trigger: user_profiles 테이블
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_profiles_updated_at'
      AND tgrelid = 'public.user_profiles'::regclass
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Trigger: payment_history 테이블
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_payment_history_updated_at'
      AND tgrelid = 'public.payment_history'::regclass
  ) THEN
    CREATE TRIGGER update_payment_history_updated_at
      BEFORE UPDATE ON public.payment_history
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
