-- 기존 Clerk 사용자를 Supabase에 동기화
-- 이 마이그레이션은 webhook이 설정되기 전에 생성된 사용자를 수동으로 추가합니다

BEGIN;

-- 특정 clerk_id로 사용자 추가 (이메일은 Clerk 대시보드에서 확인 필요)
-- 예시: INSERT INTO users (clerk_id, email, subscription_tier, remaining_analyses)
--       VALUES ('user_34XOclR0OxaDGoaEfgU235daCQA', 'your-email@example.com', 'free', 3)
--       ON CONFLICT (clerk_id) DO NOTHING;

-- ⚠️ 주의: 위 SQL을 실행하기 전에 실제 이메일 주소로 변경하세요
-- Clerk 대시보드 (https://dashboard.clerk.com) 에서 사용자 이메일을 확인할 수 있습니다

COMMIT;
