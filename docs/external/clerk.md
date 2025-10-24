아래는 **Clerk × Next.js(App Router)** 통합을 위한 최종 문서입니다. (기준일: 2025-10-24, Asia/Seoul)

---

# 1) 이번 프로젝트에 사용할 연동 수단

* **SDK(@clerk/nextjs)**: 인증 UI, 세션 관리, 라우트 보호(미들웨어), 클라이언트/서버 컴포넌트에서 사용자/세션 조회. ([Clerk][1])
* **Backend API(서버 SDK/REST)**: 서버에서 사용자 조회/갱신, 특히 **메타데이터(플랜/크레딧) 딥 머지 업데이트**. ([Clerk][2])
* **Webhook**: `user.created|updated|deleted` 등 이벤트를 우리 서버로 안전하게 전달(서명 검증 **verifyWebhook** 권장). 개발/로컬 테스트는 **ngrok** 사용. ([Clerk][3])

---

# 2) 각 수단에서 실제로 사용할 기능

## A. SDK(@clerk/nextjs)

* **UI 컴포넌트**: `<SignIn/>`, `<SignUp/>`, `<UserButton/>` 등.
* **세션/유저 조회**: 클라이언트 `useUser()`, 서버 `auth()`
* **라우트 보호**: `clerkMiddleware` + `createRouteMatcher` + `auth.protect()`
* **현지화**: `@clerk/localizations`를 `ClerkProvider`에 전달(ko 등). ([Clerk][1])

## B. Backend API

* **사용자 조회**: `clerkClient.users.getUser()`
* **메타데이터 병합 업데이트**: `clerkClient.users.updateUserMetadata()`(딥 머지).

  * UI 캐시용으로 `publicMetadata`에 플랜/크레딧 반영(최종 판정은 DB를 소스 오브 트루스로). ([Clerk][2])

## C. Webhook

* **핵심 이벤트**: `user.created`, `user.updated`, `user.deleted`
* **검증**: `@clerk/backend/webhooks`의 `verifyWebhook(request)` 사용(Clerk는 Svix 기반 헤더/서명).
* **로컬 테스트**: ngrok로 외부에 엔드포인트 노출 후 대시보드에서 엔드포인트/이벤트 등록. ([Clerk][3])

---

# 3) 설치 & 세팅

## A. SDK(@clerk/nextjs)

### 설치

```bash
npm i @clerk/nextjs @clerk/localizations
```

([Clerk][1])

### 환경변수(.env.local)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_or_test_...
CLERK_SECRET_KEY=sk_live_or_test_...
```

(Publishable Key는 브라우저 노출 가능, Secret Key는 서버 전용) ([Clerk][1])

### 앱 루트 레이아웃

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { koKR } from '@clerk/localizations'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko"><body>{children}</body></html>
    </ClerkProvider>
  )
}
```

([Clerk][1])

### 미들웨어(라우트 보호)

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher(['/dashboard(.*)', '/analyze(.*)', '/subscription(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

export const config = {
  matcher: [
    // 정적/내부 경로 제외한 모든 경로 + api
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

([Clerk][4])

---

## B. Backend API(서버에서 Clerk 호출)

### 사용 패키지

* Next.js 서버 런타임에서는 `@clerk/nextjs/server`의 `clerkClient` 사용(Secret Key 기반). ([Clerk][1])

### 환경변수(.env.local)

```env
CLERK_SECRET_KEY=sk_live_or_test_...   # Bearer 인증에 사용
```

([Clerk][1])

### 호출 예시(메타데이터 업데이트)

```ts
// app/api/payment-success/route.ts
import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId, plan, credits } = await req.json()

  // 1) DB 업데이트(소스 오브 트루스) 후…
  // await db.users.update({ plan, credits }).where({ clerkId: userId })

  // 2) Clerk 메타데이터 병합 업데이트(딥 머지)
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { plan, credits },
  })

  return NextResponse.json({ ok: true })
}
```

([Clerk][2])

### 호출 예시(서버에서 사용자 조회)

```ts
import { clerkClient } from '@clerk/nextjs/server'

const user = await clerkClient.users.getUser(userId)
// user.publicMetadata.plan 등 사용
```

([Clerk][1])

---

## C. Webhook(Clerk → 우리 서버)

### 엔드포인트 생성(Next.js App Router)

```ts
// app/api/webhooks/clerk/route.ts
import { verifyWebhook } from '@clerk/backend/webhooks'

export async function POST(request: Request) {
  try {
    const evt = await verifyWebhook(request) // Svix 서명 자동 검증
    switch (evt.type) {
      case 'user.created': {
        const u = evt.data
        // await db.profiles.insert({ clerkId: u.id, email: u.email_addresses?.[0]?.email_address, ... })
        break
      }
      case 'user.updated': {
        // await db.profiles.update(...)
        break
      }
      case 'user.deleted': {
        // await db.profiles.deleteOrDeactivate(...)
        break
      }
    }
    return new Response('OK', { status: 200 })
  } catch (err) {
    return new Response('Bad signature', { status: 400 })
  }
}
```

([Clerk][3])

### 대시보드 설정(요약)

1. Clerk Dashboard → **Webhooks** → **Add endpoint**
2. 엔드포인트 URL: `https://<도메인>/api/webhooks/clerk`
3. **Events**: `user.created`, `user.updated`, `user.deleted` 구독
4. 생성 후 발급되는 **Signing secret**을 `.env.local`에 저장

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

(변수명은 자유; `verifyWebhook`가 내부적으로 이 값을 사용) ([Clerk][5])

### 로컬 테스트

* ngrok로 로컬 서버를 외부에 노출 → 대시보드 엔드포인트에 ngrok URL 등록 후 테스트. ([ngrok.com][6])

---

# 4) 인증정보(Secrets) 관리 원칙

* **브라우저 노출**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`만.
* **서버 전용**: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` 등은 **서버 런타임 변수**로만 사용.
* **권한/플랜 판정**: UI 즉시 반영은 `publicMetadata`를 보조 캐시로 활용하되, **최종 판정은 DB 값 기준**으로. ([Clerk][1])

---

# 5) 호출 방법(요약 표)

| 수단              | 어디서 호출                | 주요 기능                         | 예시 코드 키포인트                                                                    |
| --------------- | --------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| **SDK**         | 클라/서버 컴포넌트, 미들웨어      | 로그인/회원가입 UI, 세션·유저 조회, 라우트 보호 | `<ClerkProvider/>`, `useUser()`, `auth()`, `clerkMiddleware`+`auth.protect()` |
| **Backend API** | 서버 라우트/액션             | 사용자 조회, **메타데이터 딥 머지 업데이트**   | `clerkClient.users.getUser()`, `updateUserMetadata()`                         |
| **Webhook**     | Next.js Route Handler | `user.*` 이벤트 수신→DB 동기화        | `verifyWebhook(request)`로 서명 검증 후 타입별 처리                                      |

(각 항목은 위 코드 블록 참조) ([Clerk][1])

---

# 6) Hono API 라우트에서 Clerk 인증 처리

이 프로젝트는 **Hono**를 사용하여 API 라우트를 구현하고 있으며, Next.js API 라우트와는 다른 방식으로 Clerk 인증을 처리합니다.

## A. 토큰 전송 방식

Clerk는 요청 유형에 따라 다른 방식으로 토큰을 전송합니다:

* **Same-origin 요청**: 토큰이 `__session` **쿠키**에 자동 저장 (브라우저가 자동 전송)
* **Cross-origin 요청**: 토큰이 `Authorization` **헤더**에 포함 (`Bearer <token>` 형식)

우리 앱은 same-origin 요청이므로, **쿠키에서 토큰을 읽어야 합니다**.

## B. Clerk 미들웨어 구현 (Hono)

```ts
// src/backend/middleware/clerk.ts
import { createMiddleware } from 'hono/factory'
import { createClerkClient } from '@clerk/backend'
import { getCookie } from 'hono/cookie'
import type { AppEnv } from '@/backend/hono/context'

export const withClerkAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const secretKey = process.env.CLERK_SECRET_KEY
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    if (!secretKey || !publishableKey) {
      await next()
      return
    }

    // 1. Authorization 헤더에서 토큰 확인 (cross-origin)
    let token = c.req.header('Authorization')?.replace('Bearer ', '')

    // 2. __session 쿠키에서 토큰 확인 (same-origin) ✅ 중요!
    if (!token) {
      token = getCookie(c, '__session')
    }

    if (token) {
      try {
        // Clerk Backend SDK로 토큰 검증
        const clerkClient = createClerkClient({ secretKey, publishableKey })
        const { sub: userId } = await clerkClient.verifyToken(token)

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

**핵심 포인트**:
* `getCookie(c, '__session')`로 same-origin 요청의 토큰 추출
* `createClerkClient`와 `verifyToken`으로 토큰 검증
* 검증된 `userId`를 Hono 컨텍스트에 주입

## C. Hono 앱에 미들웨어 등록

```ts
// src/backend/hono/app.ts
import { Hono } from "hono";
import { withClerkAuth } from "@/backend/middleware/clerk";

const app = new Hono<AppEnv>();

app.use("*", errorBoundary());
app.use("*", withAppContext());
app.use("*", withSupabase());
app.use("*", withClerkAuth()); // ✅ 모든 라우트에 적용

// ... 라우트 등록
```

## D. API 라우트에서 userId 사용

```ts
// src/features/user/backend/route.ts
import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';

export const registerUserRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/user/quota', async (c) => {
    const userId = c.get('userId'); // ✅ 미들웨어에서 주입된 userId

    if (!userId) {
      return c.json({ error: { message: '인증이 필요합니다' } }, 401);
    }

    // userId 사용하여 비즈니스 로직 처리
    const quota = await getUserQuota(supabase, userId);
    return c.json(quota);
  });
};
```

## E. 클라이언트에서 API 호출 (옵션)

같은 도메인 요청이므로 브라우저가 자동으로 `__session` 쿠키를 전송하지만, cross-origin이나 명시적 토큰 전송이 필요한 경우:

```ts
// src/lib/remote/api-client.ts
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
});

// Clerk 토큰을 Authorization 헤더에 추가
apiClient.interceptors.request.use(async (config) => {
  if (getClerkToken) {
    const token = await getClerkToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

```tsx
// src/app/providers.tsx
import { useAuth } from "@clerk/nextjs";
import { setClerkTokenGetter } from "@/lib/remote/api-client";
import { useEffect } from "react";

export default function Providers({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(async () => await getToken());
  }, [getToken]);

  return <>{children}</>;
}
```

## F. 중요 차이점

| Next.js Route Handler | Hono API 라우트 |
|---------------------|----------------|
| `auth()` 함수 사용 | `createClerkClient().verifyToken()` 사용 |
| 자동으로 세션 확인 | 수동으로 쿠키/헤더에서 토큰 추출 필요 |
| `middleware.ts`가 자동 처리 | 커스텀 Hono 미들웨어 구현 필요 |

**왜 이렇게 해야 하는가?**
* `auth()` 함수는 Next.js Route Handler 내부에서만 작동
* Hono는 독립적인 HTTP 프레임워크이므로 Clerk Backend SDK를 직접 사용
* Same-origin 요청의 `__session` 쿠키를 놓치면 401 에러 발생

---

## 참고한 공식 문서

* **Next.js 퀵스타트/SDK**: 설치·Provider·훅/도우미 전반. ([Clerk][1])
* **Middleware 레퍼런스**: `clerkMiddleware` / `createRouteMatcher` / 보호 방식. ([Clerk][4])
* **Webhook 검증**: `@clerk/backend/webhooks` 의 `verifyWebhook()` 사용. ([Clerk][3])
* **메타데이터 업데이트(딥 머지)**: `updateUserMetadata()` 레퍼런스. ([Clerk][2])
* **웹훅 구성/로컬 테스트**: 동기화 가이드, ngrok 활용. ([Clerk][5])

필요하면 이 문서를 **프로젝트용 README.md** 형식으로 변환해서 드리거나, 현재 코드베이스 구조에 맞춘 **템플릿 파일(middleware, webhook, API 라우트)**까지 바로 제공해드릴게요.

[1]: https://clerk.com/docs/nextjs/getting-started/quickstart?utm_source=chatgpt.com "Next.js Quickstart (App Router)"
[2]: https://clerk.com/docs/reference/backend/user/update-user-metadata?utm_source=chatgpt.com "SDK Reference: updateUserMetadata()"
[3]: https://clerk.com/docs/reference/backend/verify-webhook?utm_source=chatgpt.com "SDK Reference: verifyWebhook()"
[4]: https://clerk.com/docs/reference/nextjs/clerk-middleware?utm_source=chatgpt.com "SDK Reference: clerkMiddleware() | Next.js"
[5]: https://clerk.com/docs/guides/development/webhooks/syncing?utm_source=chatgpt.com "Sync Clerk data to your app with webhooks"
[6]: https://ngrok.com/docs/integrations/webhooks/clerk-webhooks?utm_source=chatgpt.com "Clerk Webhooks - ngrok documentation"
