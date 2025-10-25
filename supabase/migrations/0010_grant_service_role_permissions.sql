-- Migration: Grant service_role permissions to all tables
-- service_role이 모든 테이블에 접근할 수 있도록 권한 부여

-- public 스키마 사용 권한
GRANT USAGE ON SCHEMA public TO service_role;

-- 모든 기존 테이블에 대한 권한
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- 미래에 생성될 테이블에 대한 기본 권한
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;

-- 시퀀스 권한 (AUTO INCREMENT 등)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

-- 함수 실행 권한
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;
