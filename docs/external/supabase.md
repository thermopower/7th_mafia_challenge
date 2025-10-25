# Supabase 연동 가이드

> 2025-10-25 기준, 현재 프로젝트 구현을 반영한 Supabase 연동 문서

---

## 목차

1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [설치 및 설정](#설치-및-설정)
4. [Supabase 클라이언트](#supabase-클라이언트)
5. [미들웨어](#미들웨어)
6. [인증 흐름](#인증-흐름)
7. [데이터베이스 접근 패턴](#데이터베이스-접근-패턴)
8. [보안 고려사항](#보안-고려사항)

---

## 개요

이 프로젝트는 **Supabase**를 PostgreSQL 데이터베이스 및 인증 저장소로 사용합니다.

### 핵심 원칙

- **서버 사이드 전용**: Supabase 클라이언트는 Hono 백엔드에서만 사용
- **Service Role Key 사용**: RLS를 우회하여 관리자 권한으로 데이터 접근
- **Clerk 기반 인증**: 사용자 인증은 Clerk를 사용하고, Supabase는 데이터 저장소로만 활용
- **clerk_id 매핑**: Clerk의 user ID를 Supabase의 users 테이블에 저장하여 연결

---

## 아키텍처

```
┌─────────────────┐
│   Next.js App   │
│  (Client Side)  │
└────────┬────────┘
         │ API Request with Clerk Token
         ▼
┌─────────────────┐
│   Hono Server   │
│  /api/[[...]]   │
├─────────────────┤
│ ┌─────────────┐ │
│ │   Clerk     │ │ ← Token 검증
│ │ Middleware  │ │
│ └──────┬──────┘ │
│        │        │
│ ┌──────▼──────┐ │
│ │  Supabase   │ │ ← Service Role Key
│ │  Middleware │ │
│ └──────┬──────┘ │
│        │        │
│ ┌──────▼──────┐ │
│ │   Routes    │ │
│ │  (Service)  │ │
│ └─────────────┘ │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│   PostgreSQL    │
└─────────────────┘
```

---

## 설치 및 설정

### 1. 패키지 설치

```bash
npm install @supabase/supabase-js
```

### 2. 환경 변수 설정

`.env.local` 또는 배포 환경의 환경 변수:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

**⚠️ 중요**:
- `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하는 강력한 권한을 가지므로 **절대 클라이언트에 노출하지 마세요**
- Supabase Dashboard → Settings → API에서 확인 가능

---

## Supabase 클라이언트

### 클라이언트 생성 (`src/backend/supabase/client.ts`)

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ServiceClientConfig = {
  url: string
  serviceRoleKey: string
}

export const createServiceClient = ({
  url,
  serviceRoleKey,
}: ServiceClientConfig): SupabaseClient =>
  createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,    // 서버에서는 세션 유지 불필요
      autoRefreshToken: false,  // 토큰 자동 갱신 비활성화
    },
  })
```

**핵심 설정**:
- `persistSession: false`: 서버 환경에서는 세션을 메모리에 저장할 필요 없음
- `autoRefreshToken: false`: Service Role Key는 만료되지 않음

---

## 미들웨어

### Supabase 미들웨어 (`src/backend/middleware/supabase.ts`)

모든 요청에 Supabase 클라이언트를 주입합니다.

```typescript
import { createMiddleware } from 'hono/factory'
import { contextKeys, type AppEnv } from '@/backend/hono/context'
import { createServiceClient } from '@/backend/supabase/client'

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(contextKeys.config)

    if (!config) {
      throw new Error('Application configuration is not available.')
    }

    const client = createServiceClient(config.supabase)
    c.set(contextKeys.supabase, client)

    await next()
  })
```

### Hono 앱 등록 (`src/backend/hono/app.ts`)

```typescript
import { Hono } from 'hono'
import { errorBoundary } from '@/backend/middleware/error'
import { withAppContext } from '@/backend/middleware/context'
import { withSupabase } from '@/backend/middleware/supabase'
import { withClerkAuth } from '@/backend/middleware/clerk'

export const createHonoApp = () => {
  const app = new Hono<AppEnv>()

  // 미들웨어 등록 순서가 중요
  app.use('*', errorBoundary())      // 1. 에러 처리
  app.use('*', withAppContext())     // 2. 설정 주입
  app.use('*', withSupabase())       // 3. Supabase 클라이언트
  app.use('*', withClerkAuth())      // 4. Clerk 인증 (선택적)

  // 라우트 등록...

  return app
}
```

---

## 인증 흐름

### 1. Clerk 인증 (`src/backend/middleware/clerk.ts`)

```typescript
export const withClerkAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const secretKey = process.env.CLERK_SECRET_KEY

    // 1. Authorization 헤더 또는 __session 쿠키에서 토큰 추출
    let token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      token = getCookie(c, '__session')
    }

    if (token) {
      try {
        // 2. Clerk Backend SDK로 토큰 검증
        const payload = await verifyToken(token, { secretKey })
        const userId = payload.sub

        // 3. Context에 userId 저장
        if (userId) {
          c.set('userId', userId)
        }
      } catch (error) {
        console.warn('Token verification failed:', error)
      }
    }

    await next()
  })
}
```

### 2. clerk_id → UUID 변환 패턴

모든 서비스 레이어에서 사용되는 공통 패턴:

```typescript
export async function someService(
  supabase: SupabaseClient,
  clerkId: string,
  // ... other params
) {
  // 1. Clerk ID로 Supabase users 테이블의 UUID 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (!user) {
    return failure(404, 'USER_NOT_FOUND', 'User not found')
  }

  // 2. UUID를 사용하여 다른 테이블과 조인
  const { data } = await supabase
    .from('user_analyses')
    .select('*')
    .eq('user_id', user.id)  // UUID 사용
    .is('deleted_at', null)

  // ...
}
```

### 3. 프론트엔드 API 호출

```typescript
// Next.js 클라이언트 컴포넌트
'use client'

import { apiClient } from '@/lib/remote/api-client'

export function useAnalysisList() {
  return useQuery({
    queryKey: ['analyses', 'list'],
    queryFn: async () => {
      // apiClient는 자동으로 Clerk 토큰을 Authorization 헤더에 추가
      const response = await apiClient.get('/api/analysis/list')
      return response.data
    },
  })
}
```

API 클라이언트 설정 (`src/lib/remote/api-client.ts`):

```typescript
// Request interceptor에서 Clerk 토큰 자동 추가
apiClient.interceptors.request.use(async (config) => {
  if (getClerkToken) {
    const token = await getClerkToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})
```

---

## 데이터베이스 접근 패턴

### 기본 CRUD 예시

#### 1. 조회 (Read)

```typescript
// 단일 레코드
const { data, error } = await supabase
  .from('user_analyses')
  .select('*')
  .eq('id', analysisId)
  .eq('user_id', userId)
  .is('deleted_at', null)
  .single()

// 목록 조회 (페이지네이션)
const { data, error, count } = await supabase
  .from('user_analyses')
  .select('id, name, created_at', { count: 'exact' })
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

#### 2. 생성 (Create)

```typescript
const { data, error } = await supabase
  .from('user_analyses')
  .insert({
    user_id: userId,
    name: '홍길동',
    birth_date: '1990-01-01',
    analysis_type: 'yearly',
    result_json: analysisResult,
  })
  .select()
  .single()
```

#### 3. 수정 (Update)

```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    name: '김철수',
    updated_at: new Date().toISOString(),
  })
  .eq('id', profileId)
  .eq('user_id', userId)
  .select()
  .single()
```

#### 4. 삭제 (Soft Delete)

```typescript
// Soft delete 패턴 (권장)
const { error } = await supabase
  .from('user_analyses')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', analysisId)
  .eq('user_id', userId)
```

### 조인 쿼리

```typescript
// 공유 토큰으로 분석 조회 (조인)
const { data, error } = await supabase
  .from('share_tokens')
  .select(`
    token,
    expires_at,
    user_analyses (
      id,
      name,
      birth_date,
      result_json
    )
  `)
  .eq('token', shareToken)
  .gt('expires_at', new Date().toISOString())
  .single()
```

### 트랜잭션 패턴

Supabase는 직접적인 트랜잭션을 지원하지 않으므로, RPC를 사용하거나 애플리케이션 레벨에서 처리:

```typescript
// RPC 함수 호출 (트랜잭션 보장)
const { data, error } = await supabase.rpc('create_analysis_with_quota', {
  p_user_id: userId,
  p_analysis_data: analysisData,
})
```

---

## 보안 고려사항

### 1. Service Role Key 관리

✅ **올바른 사용**:
- 서버 환경 변수에만 저장
- `.env.local`은 `.gitignore`에 포함
- 배포 플랫폼(Vercel, Cloudflare 등)의 환경 변수 사용

❌ **금지 사항**:
- 클라이언트 코드에 노출
- Git 저장소에 커밋
- 브라우저 DevTools에서 접근 가능한 위치

### 2. RLS (Row Level Security)

현재 구현에서는 Service Role Key를 사용하므로 **RLS가 비활성화**됩니다.

대신 애플리케이션 레벨에서 권한 검증:

```typescript
// ✅ 항상 user_id로 필터링
const { data } = await supabase
  .from('user_analyses')
  .select('*')
  .eq('user_id', userId)  // 필수!
  .eq('id', analysisId)
```

### 3. Soft Delete 패턴

물리적 삭제 대신 `deleted_at` 타임스탬프 사용:

```typescript
// ✅ 조회 시 항상 deleted_at 체크
.is('deleted_at', null)

// ✅ 삭제 시 타임스탬프 업데이트
.update({ deleted_at: new Date().toISOString() })
```

### 4. SQL Injection 방지

Supabase JS SDK는 자동으로 파라미터화된 쿼리를 사용하므로 안전합니다.

❌ **금지**: 문자열 보간으로 쿼리 생성
```typescript
// 절대 사용 금지!
await supabase.rpc('unsafe_query', {
  query: `SELECT * FROM users WHERE name = '${userName}'`
})
```

✅ **권장**: SDK의 메서드 체이닝 사용
```typescript
await supabase
  .from('users')
  .select('*')
  .eq('name', userName)  // 자동으로 이스케이프됨
```

---

## 테이블 구조

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  remaining_analyses INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
```

### user_analyses

```sql
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  is_lunar BOOLEAN DEFAULT FALSE,
  analysis_type TEXT NOT NULL,
  result_json JSONB NOT NULL,
  model_used TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_analyses_user_id ON user_analyses(user_id);
CREATE INDEX idx_analyses_deleted_at ON user_analyses(deleted_at);
```

### 주요 관계

```
users (1) ─────< (N) user_analyses
  │
  ├────< (N) user_profiles
  ├────< (N) payment_history
  └────< (1) user_subscriptions
```

---

## 마이그레이션

마이그레이션 파일은 `supabase/migrations/` 디렉토리에 저장:

```sql
-- supabase/migrations/0001_create_users_table.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  remaining_analyses INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**마이그레이션 적용**:
1. Supabase Dashboard → SQL Editor
2. 마이그레이션 파일 내용 복사 & 실행
3. 또는 Supabase CLI 사용: `supabase db push`

---

## 트러블슈팅

### 1. "User not found" 에러

**원인**: Clerk 사용자가 Supabase에 동기화되지 않음

**해결**:
```typescript
// src/backend/middleware/ensure-user.ts
export const ensureUserExists = async (
  supabase: SupabaseClient,
  clerkId: string,
  email?: string
) => {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, clerk_id')
    .eq('clerk_id', clerkId)
    .maybeSingle()

  if (existingUser) return existingUser

  // Webhook이 누락된 경우 사용자 생성
  const { data: newUser } = await supabase
    .from('users')
    .insert({
      clerk_id: clerkId,
      email: email ?? null,
      subscription_tier: 'free',
      remaining_analyses: 3,
    })
    .select('id, clerk_id')
    .single()

  return newUser
}
```

### 2. 날짜 형식 검증 오류

**원인**: Zod의 `.datetime()` 검증이 너무 엄격함

**해결**: `.string()`으로 변경
```typescript
// ❌ 엄격한 검증
createdAt: z.string().datetime()

// ✅ 유연한 검증
createdAt: z.string()
```

### 3. 토큰 검증 실패

**원인**: Authorization 헤더 또는 쿠키 누락

**해결**:
- 프론트엔드에서 `getToken()`으로 토큰 생성 확인
- API 클라이언트 인터셉터 설정 확인
- Clerk 환경 변수 확인

---

## 참고 자료

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client Reference](https://supabase.com/docs/reference/javascript)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
