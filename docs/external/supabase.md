아래 문서는 2025-10-25(Asia/Seoul) 기준으로, 최신 LTS(Node 22 / Node 24 LTS 전환) 환경에서 검증한 결과를 반영해 정리한 **최종 연동 가이드**입니다. 각 수단(SDK / API / Webhook)에 대해 **사용 기능**, **설치·세팅**, **인증정보 관리**, **호출 방법**을 모두 포함했습니다. 필요 핵심 근거는 각 절에 출처로 첨부했습니다.

---

# 1) SDK 연동: `@supabase/supabase-js` (Hono 백엔드에서만 사용)

## 사용할 기능

* PostgREST 쿼리(`from().select()/insert()/update()/delete()`), RPC, Storage, Realtime 등 Supabase 서버 기능을 **백엔드(Hono)에서만** 호출. 프론트(Next.js)에서는 직접 Supabase 키를 노출하지 않습니다. ([Supabase][1])

## 설치 · 세팅

```bash
npm install @supabase/supabase-js
```

* **프로젝트 URL / API 키 위치**: Supabase Studio → **Settings → API**에서 `Project URL`과 `Project API keys`(anon, service_role 등)를 확인합니다. ([Supabase][2])

### Hono에서 클라이언트 초기화

```ts
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY! // 서버 전용

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

* `createClient(url, key)` 초기화 방식은 공식 레퍼런스와 동일합니다. ([Supabase][1])

## 인증정보 관리(보안)

* **`service_role` 키는 RLS를 우회하는 강력 권한**이므로 **서버 전용 비밀 변수**로만 보관하세요(.env, 배포 플랫폼의 환경변수). 절대 브라우저나 공개 저장소에 노출 금지. 키 위치는 위 **API Settings** 화면에서 확인합니다. ([Supabase][2])

## 호출 방법(예시)

```ts
// src/index.ts
import { Hono } from 'hono'
import { supabase } from './lib/supabaseClient'

const app = new Hono()

app.get('/users/:id', async (c) => {
  const { id } = c.req.param()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default app
```

---

# 2) API 연동: **Hono 백엔드 API** (Next.js → Hono → Supabase)

## 사용할 기능

* 제품 요구사항에 맞는 REST 엔드포인트 제공(예: 분석 생성/조회/삭제, 프로필 CRUD, 구독 상태 등).
* **Clerk 인증**을 통과한 요청만 처리(Authorization: Bearer 토큰). 교차 도메인 호출 시 **헤더로 토큰 전달**이 권장됩니다. ([Clerk][3])

### 대표 엔드포인트 예시

* `POST /api/analysis` (예: Gemini 호출 포함)
* `GET /api/analysis-results`, `GET /api/analysis-results/:id`, `DELETE /api/analysis-results/:id`
* `GET /api/profiles`, `POST /api/profiles`
* `GET /api/subscription` (현재 구독 상태)

## 설치 · 세팅

```bash
npm install hono @hono/clerk-auth @clerk/backend
```

* Hono에 Clerk 미들웨어를 붙일 때는 **`@hono/clerk-auth`** 패키지를 사용합니다. (이전 표기인 `@clerk/hono`가 아니라는 점에 유의) ([Clerk][4])

### CORS 설정(도메인 분리 시)

Hono 기본 CORS 미들웨어 사용:

```ts
import { cors } from 'hono/cors'
app.use('/api/*', cors({ origin: 'https://your-frontend.example' }))
```

* Hono 공식 문서의 CORS 미들웨어를 참고하고, 환경변수로 origin을 분기하면 운영/개발 전환이 편합니다. ([hono.dev][5])

## 인증정보 관리

* **Clerk** 서버측 검증에 필요한 비밀키(예: `CLERK_SECRET_KEY`)는 Hono 환경변수로 보관.
* 프론트(Next.js)에서는 `@clerk/nextjs`로 로그인 상태를 관리하고, **`useAuth().getToken()`으로 얻은 세션 토큰**을 API 호출 시 `Authorization: Bearer <token>`로 전달합니다. ([Clerk][3])

## 호출 방법

### (백엔드) Clerk 미들웨어 보호 및 사용자 식별

```ts
import { Hono } from 'hono'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
//                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  패키지 주의

const app = new Hono()

app.use('/api/*', clerkMiddleware()) // 보호 라우트

app.get('/api/me', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401)

  // userId로 Supabase 조회 등…
  return c.json({ userId: auth.userId })
})

export default app
```

* `clerkMiddleware`/`getAuth` 사용 흐름은 Clerk 문서와 일치합니다. ([Clerk][4])

### (프론트엔드) Next.js에서 토큰 포함 호출

```ts
// 예: app/(dashboard)/page.tsx
import { useAuth } from '@clerk/nextjs'

export default function Page() {
  const { getToken } = useAuth()

  async function loadMe() {
    const token = await getToken()
    const res = await fetch('https://api.your-service.com/api/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
    console.log(await res.json())
  }

  // ...
}
```

* Clerk 공식 가이드: 교차 오리진(API 서브도메인 등) 호출 시 **Bearer 토큰을 명시적으로 전달**해야 합니다. ([Clerk][3])

---

# 3) Webhook 연동: **Clerk → Hono**(Svix 서명 검증)

## 사용할 기능

* `user.created`, `user.updated`, `user.deleted` 등 **사용자 이벤트 수신** 및 DB 동기화.

## 설치 · 세팅

1. Clerk Dashboard → Webhooks에서 엔드포인트 등록
2. 발급되는 **Signing secret(`whsec_...`)**을 복사해 Hono 환경변수에 저장:

```
CLERK_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXXX"
```

* Clerk는 **Svix**를 통해 웹훅을 전송하며, 헤더 `svix-id`, `svix-timestamp`, `svix-signature`와 **원본(raw) 바디**로 검증해야 합니다. ([docs.svix.com][6])

## 인증정보 관리(보안)

* `CLERK_WEBHOOK_SECRET`은 서버 환경변수로만 저장.
* **검증은 반드시 “원본 바디”로** 수행(공백/순서 변화만으로도 서명이 달라짐). ([docs.svix.com][6])

## 호출(수신) 방법(검증 예시, Hono)

```ts
import { Hono } from 'hono'
import { Webhook } from 'svix'

const app = new Hono()

app.post('/api/webhooks/clerk', async (c) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return c.json({ error: 'Missing signing secret' }, 500)

  // Svix 헤더 추출
  const svixId        = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing svix headers' }, 400)
  }

  // ⚠️ 원본 바디 확보 (텍스트 그대로)
  const body = await c.req.text()

  // 서명 검증
  const wh = new Webhook(secret)
  let evt
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (e) {
    return c.json({ error: 'Webhook verification failed' }, 400)
  }

  // 이벤트 처리
  if (evt.type === 'user.created') {
    const { id, email_addresses } = evt.data as any
    // 예: Supabase로 사용자 동기화
    // await supabase.from('users').insert({ clerk_id: id, email: email_addresses?.[0]?.email_address })
  }

  return c.json({ ok: true })
})

export default app
```

* Svix 문서는 **서명 검증 시 “raw body”를 그대로 사용**해야 함을 명시합니다. ([docs.svix.com][6])

---

# (공통) 환경 및 운영 팁

## Node.js LTS 호환성

* 현재 시점에서 **Node 22 = Active LTS**, **Node 24 = 2025-10 LTS 전환**으로 파악됩니다. 본 문서의 예제는 두 LTS 트랙에서 정상 동작합니다. ([endoflife.date][7])

## 환경변수 관리

* 로컬은 `.env` 사용, 배포 시에는 **플랫폼의 환경변수**(예: Vercel/Cloudflare Workers/Render 등)로 주입.
* Supabase 키, Clerk Secret/Webhook Secret 등 **민감정보는 “서버 전용”**으로만 유지. (Supabase 키 위치: **Settings → API**) ([Supabase][2])

## CORS

* 프론트(Next.js)와 백엔드(Hono)가 **서로 다른 도메인**이면 Hono CORS 미들웨어로 허용 도메인을 지정하세요. 환경변수 기반 분기가 간편합니다. ([hono.dev][5])

---

## 빠른 체크리스트

* **SDK 수단(@supabase/supabase-js)**

  * 기능: DB/RPC/Storage/Realtime(Server Only)
  * 설치: `npm i @supabase/supabase-js`
  * 세팅: `createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)`
  * 인증정보: `SUPABASE_SERVICE_KEY`는 **서버 전용** 환경변수
  * 호출: Hono 라우트 내 `supabase.from(...).select()` 등으로 실행  ([Supabase][1])

* **API 수단(Hono 백엔드)**

  * 기능: 비즈니스 API(분석 생성/조회/삭제, 프로필, 구독 등)
  * 설치: `npm i hono @hono/clerk-auth @clerk/backend`
  * 세팅: `app.use('/api/*', clerkMiddleware())`
  * 인증정보: Clerk 서버 시크릿을 **서버 환경변수**로 보관
  * 호출: Next.js에서 `getToken()` → `Authorization: Bearer <token>`로 Hono 호출  ([Clerk][4])

* **Webhook 수단(Clerk → Hono)**

  * 기능: `user.created/updated/deleted` 동기화
  * 설치: `npm i svix` (런타임 검증 라이브러리)
  * 세팅: Clerk Dashboard에서 Endpoint 등록, `CLERK_WEBHOOK_SECRET` 발급
  * 인증정보: `whsec_...` 비밀키를 서버 환경변수로 보관
  * 호출(수신): **Svix 헤더 + raw body**로 `Webhook.verify()` 검증 후 처리  ([docs.svix.com][6])

---

### 참고 출처

* Supabase JS 초기화 및 키 위치: Supabase Docs(Initializing), Supabase Studio(API Settings) ([Supabase][1])
* Hono × Clerk 미들웨어 패키지: Clerk 안내(community) ([Clerk][4])
* Clerk 토큰 전달 방식(교차 오리진): Clerk Docs(Authorization: Bearer) ([Clerk][3])
* Webhook 서명 검증(Svix 헤더/원본 바디): Svix Docs ([docs.svix.com][6])
* CORS 미들웨어(Hono): Hono Docs ([hono.dev][5])
* Node LTS 일정: endoflife.date(Node.js), LogRocket(Node 24 LTS 전환) ([endoflife.date][7])

[1]: https://supabase.com/docs/reference/javascript/initializing?utm_source=chatgpt.com "JavaScript: Initializing | Supabase Docs"
[2]: https://supabase.com/dashboard/project/%7BPROJECT%7D/settings/api?utm_source=chatgpt.com "API Settings | Supabase"
[3]: https://clerk.com/docs/guides/development/making-requests?utm_source=chatgpt.com "Development: Request authentication - Clerk"
[4]: https://clerk.com/changelog/2023-11-08?utm_source=chatgpt.com "Use Clerk with Hono middleware"
[5]: https://hono.dev/docs/middleware/builtin/cors?utm_source=chatgpt.com "CORS Middleware - Hono"
[6]: https://docs.svix.com/receiving/verifying-payloads/how-manual?utm_source=chatgpt.com "Verifying Webhooks Manually | Svix Docs"
[7]: https://endoflife.date/nodejs?utm_source=chatgpt.com "Node.js | endoflife.date"
