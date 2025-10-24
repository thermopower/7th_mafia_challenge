# 결제 실패 페이지 구현 계획서

> **페이지**: `/payments/fail`
> **문서 버전**: 1.0
> **작성일**: 2025-10-25
> **프로젝트**: SuperNext - AI 기반 구독형 사주풀이 서비스

---

## 목차

1. [개요](#1-개요)
2. [페이지 요구사항](#2-페이지-요구사항)
3. [페이지 구조 및 UI 설계](#3-페이지-구조-및-ui-설계)
4. [상태 관리](#4-상태-관리)
5. [쿼리 파라미터 파싱](#5-쿼리-파라미터-파싱)
6. [구현 상세](#6-구현-상세)
7. [구현 순서 및 우선순위](#7-구현-순서-및-우선순위)
8. [테스트 시나리오](#8-테스트-시나리오)

---

## 1. 개요

### 1.1 페이지 목적

결제 실패 페이지는 토스페이먼츠 결제 프로세스 중 실패가 발생했을 때 사용자에게 오류 정보를 전달하고, 재시도 또는 고객센터 안내를 제공하는 페이지입니다.

### 1.2 주요 기능

- 결제 실패 사유 표시 (쿼리 파라미터로 전달)
- 사용자 친화적인 에러 메시지 변환
- 구독 관리 페이지로의 재시도 버튼
- 대시보드로의 복귀 버튼
- 고객센터 연락처 안내

### 1.3 참고 문서

- PRD: `docs/prd.md` - 페이지 목록 및 기본 요구사항
- Userflow: `docs/userflow.md` - 결제 실패 플로우 (3.4절)
- State Design: `docs/external/state-design.md` - 상태 관리 불필요 (정적 페이지)
- Toss API: `docs/external/toss.md` - 토스페이먼츠 failUrl 리다이렉트
- UC-011: `docs/usecases/011/spec.md` - 결제 프로세스 및 실패 시나리오

---

## 2. 페이지 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | 쿼리 파라미터로 실패 사유 수신 (`code`, `message`) | 필수 |
| FR-2 | 토스페이먼츠 에러 코드를 사용자 친화적 메시지로 변환 | 필수 |
| FR-3 | 구독 관리 페이지로 재시도 버튼 제공 | 필수 |
| FR-4 | 대시보드로 복귀 버튼 제공 | 필수 |
| FR-5 | 고객센터 안내 정보 표시 | 선택 |
| FR-6 | 실패 로그를 서버로 전송 (추후 분석용) | 선택 |

### 2.2 비기능 요구사항

| ID | 요구사항 | 목표 |
|----|---------|-----|
| NFR-1 | 페이지 로드 시간 | 1초 이내 |
| NFR-2 | 반응형 디자인 | 모바일/데스크톱 모두 지원 |
| NFR-3 | 접근성 | WCAG 2.1 AA 준수 |
| NFR-4 | SEO | `noindex` 메타 태그 적용 (검색 엔진 노출 방지) |

### 2.3 제약사항

- **인증 필요**: Clerk Middleware로 보호 (로그인 필수)
- **상태관리 불필요**: 정적 페이지로 구현 (상태 관리 라이브러리 미사용)
- **서버 처리 없음**: 쿼리 파라미터만 표시 (DB 조회 불필요)

---

## 3. 페이지 구조 및 UI 설계

### 3.1 레이아웃

```
┌─────────────────────────────────────┐
│           Header (공통)              │
├─────────────────────────────────────┤
│                                     │
│         [실패 아이콘 (X)]            │
│                                     │
│       결제 실패                      │
│                                     │
│   {사용자 친화적 에러 메시지}         │
│                                     │
│   ┌──────────────────────┐          │
│   │   다시 시도하기       │          │
│   └──────────────────────┘          │
│                                     │
│   ┌──────────────────────┐          │
│   │   대시보드로 돌아가기  │          │
│   └──────────────────────┘          │
│                                     │
│   고객센터: support@supernext.com   │
│                                     │
├─────────────────────────────────────┤
│           Footer (공통)              │
└─────────────────────────────────────┘
```

### 3.2 컴포넌트 구조

```
app/payments/fail/
  └── page.tsx (Server Component)
      ├── ErrorIcon (lucide-react: XCircle)
      ├── ErrorMessage (조건부 렌더링)
      ├── RetryButton (Link to /subscription)
      ├── BackButton (Link to /dashboard)
      └── SupportInfo (하드코딩)
```

### 3.3 디자인 시스템

**색상**:
- 실패 아이콘: `text-destructive` (빨간색)
- 제목: `text-foreground` (기본)
- 설명: `text-muted-foreground` (회색)
- 버튼: shadcn-ui `Button` 컴포넌트 사용

**타이포그래피**:
- 제목: `text-2xl font-bold`
- 메시지: `text-base`
- 고객센터: `text-sm text-muted-foreground`

**간격**:
- 요소 간 간격: `gap-6` (1.5rem)
- 패딩: `py-12 px-4`

---

## 4. 상태 관리

### 4.1 상태관리 필요 여부

**❌ 상태관리 불필요**

### 4.2 이유

- 쿼리 파라미터로 전달된 정보만 표시 (서버 조회 불필요)
- 정적 페이지로 클라이언트 상태 변경 없음
- 버튼 클릭 시 단순 페이지 이동 (Link 컴포넌트 사용)

### 4.3 데이터 소스

**입력**: URL 쿼리 파라미터
- `code`: 토스페이먼츠 에러 코드 (예: `REJECT_CARD_COMPANY`, `EXCEED_MAX_AUTH_COUNT`)
- `message`: 토스페이먼츠가 제공하는 원본 에러 메시지

**출력**: 변환된 사용자 친화적 메시지

---

## 5. 쿼리 파라미터 파싱

### 5.1 토스페이먼츠 failUrl 리다이렉트

토스페이먼츠는 결제 실패 시 다음과 같이 리다이렉트합니다:

```
https://yourdomain.com/payments/fail?code=REJECT_CARD_COMPANY&message=카드사로부터+거절되었습니다
```

### 5.2 에러 코드 매핑

| 토스페이먼츠 에러 코드 | 사용자 친화적 메시지 |
|----------------------|-------------------|
| `USER_CANCEL` | 결제를 취소하셨습니다. |
| `REJECT_CARD_COMPANY` | 카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요. |
| `EXCEED_MAX_AUTH_COUNT` | 본인인증 횟수를 초과했습니다. 잠시 후 다시 시도해주세요. |
| `EXCEED_MAX_CARD_LIMIT` | 카드 한도를 초과했습니다. 다른 카드로 시도해주세요. |
| `INVALID_CARD_EXPIRATION` | 카드 유효기간이 만료되었습니다. 다른 카드를 사용해주세요. |
| `INVALID_STOPPED_CARD` | 정지된 카드입니다. 카드사에 문의하거나 다른 카드를 사용해주세요. |
| `FAILED_CARD_PAYMENT` | 카드 결제에 실패했습니다. 카드 정보를 확인해주세요. |
| (기타 또는 없음) | 결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. |

### 5.3 구현 방법

```typescript
// app/payments/fail/page.tsx
const errorMessages: Record<string, string> = {
  USER_CANCEL: '결제를 취소하셨습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요.',
  EXCEED_MAX_AUTH_COUNT: '본인인증 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  EXCEED_MAX_CARD_LIMIT: '카드 한도를 초과했습니다. 다른 카드로 시도해주세요.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 만료되었습니다. 다른 카드를 사용해주세요.',
  INVALID_STOPPED_CARD: '정지된 카드입니다. 카드사에 문의하거나 다른 카드를 사용해주세요.',
  FAILED_CARD_PAYMENT: '카드 결제에 실패했습니다. 카드 정보를 확인해주세요.',
}

const getErrorMessage = (code?: string, message?: string): string => {
  if (code && errorMessages[code]) {
    return errorMessages[code]
  }
  return message || '결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
```

---

## 6. 구현 상세

### 6.1 파일 구조

```
src/
  app/
    payments/
      fail/
        page.tsx        # 메인 페이지 (Server Component)
  lib/
    payments/
      error-messages.ts # 에러 코드 매핑 유틸리티
```

### 6.2 코드 구현

#### 6.2.1 에러 메시지 유틸리티

```typescript
// src/lib/payments/error-messages.ts
export const TOSS_ERROR_MESSAGES: Record<string, string> = {
  USER_CANCEL: '결제를 취소하셨습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요.',
  EXCEED_MAX_AUTH_COUNT: '본인인증 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  EXCEED_MAX_CARD_LIMIT: '카드 한도를 초과했습니다. 다른 카드로 시도해주세요.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 만료되었습니다. 다른 카드를 사용해주세요.',
  INVALID_STOPPED_CARD: '정지된 카드입니다. 카드사에 문의하거나 다른 카드를 사용해주세요.',
  FAILED_CARD_PAYMENT: '카드 결제에 실패했습니다. 카드 정보를 확인해주세요.',
}

export const getPaymentErrorMessage = (
  code?: string | null,
  message?: string | null
): string => {
  if (code && TOSS_ERROR_MESSAGES[code]) {
    return TOSS_ERROR_MESSAGES[code]
  }
  return message || '결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
```

#### 6.2.2 메인 페이지 컴포넌트

```typescript
// src/app/payments/fail/page.tsx
import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPaymentErrorMessage } from '@/lib/payments/error-messages'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '결제 실패',
  robots: {
    index: false,
    follow: false,
  },
}

type PaymentFailPageProps = {
  searchParams: Promise<{
    code?: string
    message?: string
  }>
}

export default async function PaymentFailPage(props: PaymentFailPageProps) {
  const searchParams = await props.searchParams
  const { code, message } = searchParams

  const errorMessage = getPaymentErrorMessage(code, message)

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* 실패 아이콘 */}
          <XCircle className="h-16 w-16 text-destructive" aria-hidden="true" />

          {/* 제목 */}
          <h1 className="text-2xl font-bold">결제 실패</h1>

          {/* 에러 메시지 */}
          <p className="text-muted-foreground">{errorMessage}</p>

          {/* 액션 버튼 */}
          <div className="flex w-full flex-col gap-3">
            {/* 재시도 버튼 */}
            <Button asChild className="w-full">
              <Link href="/subscription">다시 시도하기</Link>
            </Button>

            {/* 대시보드 복귀 버튼 */}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">대시보드로 돌아가기</Link>
            </Button>
          </div>

          {/* 고객센터 안내 */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>문제가 계속되면 고객센터로 문의해주세요.</p>
            <p className="mt-1">
              이메일:{' '}
              <a
                href="mailto:support@supernext.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                support@supernext.com
              </a>
            </p>
          </div>

          {/* 개발 모드: 원본 에러 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (code || message) && (
            <details className="mt-4 w-full text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                디버그 정보 (개발 모드)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
                {JSON.stringify({ code, message }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 6.3 디렉터리 구조 (최종)

```
src/
  app/
    payments/
      fail/
        page.tsx
  lib/
    payments/
      error-messages.ts
  components/
    layout/
      header.tsx (공통)
      footer.tsx (공통)
    ui/
      button.tsx (shadcn-ui)
```

---

## 7. 구현 순서 및 우선순위

### Phase 1: 핵심 기능 (필수, 1-2시간)

1. ✅ **에러 메시지 유틸리티 구현**
   - 파일: `src/lib/payments/error-messages.ts`
   - 토스페이먼츠 에러 코드 매핑
   - `getPaymentErrorMessage` 함수 작성

2. ✅ **메인 페이지 컴포넌트 구현**
   - 파일: `src/app/payments/fail/page.tsx`
   - 쿼리 파라미터 파싱 (`searchParams`)
   - UI 레이아웃 (아이콘, 제목, 메시지, 버튼)
   - 메타데이터 설정 (`noindex`)

3. ✅ **버튼 링크 연결**
   - 재시도 버튼 → `/subscription`
   - 대시보드 복귀 → `/dashboard`

### Phase 2: 부가 기능 (선택, 1시간)

4. ⬜ **고객센터 안내 추가**
   - 이메일 링크 (`mailto:`)
   - 전화번호 (선택)

5. ⬜ **개발 모드 디버그 정보**
   - `NODE_ENV === 'development'` 시에만 표시
   - 원본 `code`, `message` JSON 출력

### Phase 3: 개선 및 최적화 (선택, 추후)

6. ⬜ **실패 로그 전송**
   - 클라이언트에서 서버로 에러 로그 전송
   - Supabase에 실패 내역 저장 (분석용)
   - Sentry 연동 (추후)

7. ⬜ **A/B 테스트**
   - 버튼 문구 최적화
   - 에러 메시지 개선

---

## 8. 테스트 시나리오

### 8.1 수동 테스트

| 시나리오 | 쿼리 파라미터 | 예상 결과 |
|---------|-------------|----------|
| 사용자 취소 | `?code=USER_CANCEL` | "결제를 취소하셨습니다." 표시 |
| 카드 거절 | `?code=REJECT_CARD_COMPANY` | "카드사에서 결제를 거절했습니다..." 표시 |
| 한도 초과 | `?code=EXCEED_MAX_CARD_LIMIT` | "카드 한도를 초과했습니다..." 표시 |
| 알 수 없는 에러 | `?code=UNKNOWN_ERROR` | 기본 에러 메시지 표시 |
| 파라미터 없음 | (없음) | 기본 에러 메시지 표시 |
| 메시지만 전달 | `?message=Custom error` | "Custom error" 표시 |

### 8.2 테스트 URL 예시

**개발 환경**:
```bash
# 사용자 취소
http://localhost:3000/payments/fail?code=USER_CANCEL

# 카드 거절
http://localhost:3000/payments/fail?code=REJECT_CARD_COMPANY&message=카드사로부터+거절되었습니다

# 알 수 없는 에러
http://localhost:3000/payments/fail?code=UNKNOWN&message=알+수+없는+오류

# 파라미터 없음
http://localhost:3000/payments/fail
```

### 8.3 E2E 테스트 (추후)

```typescript
// e2e/payment-fail.spec.ts (Playwright/Cypress)
test('결제 실패 페이지 - 사용자 취소', async ({ page }) => {
  await page.goto('/payments/fail?code=USER_CANCEL')

  // 제목 확인
  await expect(page.locator('h1')).toHaveText('결제 실패')

  // 에러 메시지 확인
  await expect(page.locator('p').first()).toContainText('결제를 취소하셨습니다')

  // 버튼 존재 확인
  await expect(page.locator('text=다시 시도하기')).toBeVisible()
  await expect(page.locator('text=대시보드로 돌아가기')).toBeVisible()

  // 재시도 버튼 클릭
  await page.click('text=다시 시도하기')
  await expect(page).toHaveURL('/subscription')
})
```

### 8.4 접근성 테스트

- **ARIA 레이블**: 아이콘에 `aria-hidden="true"` 적용
- **키보드 네비게이션**: Tab 키로 버튼 간 이동 가능
- **색상 대비**: WCAG AA 등급 준수 (`text-destructive` vs 배경)
- **스크린 리더**: "결제 실패" 제목 및 에러 메시지 읽기 가능

---

## 9. 엣지케이스 및 예외 처리

### 9.1 쿼리 파라미터 누락

**상황**: 사용자가 직접 URL을 입력하거나 파라미터 없이 접근
**처리**: 기본 에러 메시지 표시 ("결제 중 오류가 발생했습니다...")

### 9.2 인증되지 않은 사용자

**상황**: 비로그인 사용자가 `/payments/fail` 접근 시도
**처리**: Clerk Middleware가 자동으로 로그인 페이지로 리다이렉트

### 9.3 URL 인코딩 문제

**상황**: 토스페이먼츠가 전달하는 `message`가 URL 인코딩되어 있음
**처리**: Next.js의 `searchParams`가 자동으로 디코딩 처리

### 9.4 개발 모드 디버그 정보 보안

**상황**: 프로덕션 환경에서 디버그 정보 노출 방지
**처리**: `process.env.NODE_ENV === 'development'` 조건부 렌더링

---

## 10. 추후 개선 사항

### 10.1 다국어 지원

- `next-intl` 라이브러리 도입
- 에러 메시지 다국어 파일 분리

### 10.2 실패 로그 분석

- Supabase에 결제 실패 로그 저장
- 대시보드에서 실패율 모니터링
- 가장 빈번한 에러 유형 분석

### 10.3 Sentry 연동

- 결제 실패 이벤트를 Sentry로 전송
- 실시간 알림 설정

### 10.4 사용자 경험 개선

- 실패 사유별 맞춤 안내 (예: 한도 초과 시 카드 발급사 연락처 제공)
- 애니메이션 추가 (페이지 진입 시 fade-in)
- 다크 모드 지원

---

## 11. 체크리스트

### 개발 완료 체크리스트

- [ ] `src/lib/payments/error-messages.ts` 파일 생성
- [ ] `TOSS_ERROR_MESSAGES` 객체 정의 (최소 7개 에러 코드)
- [ ] `getPaymentErrorMessage` 함수 구현
- [ ] `src/app/payments/fail/page.tsx` 파일 생성
- [ ] 쿼리 파라미터 파싱 (`searchParams` 사용)
- [ ] UI 레이아웃 구현 (아이콘, 제목, 메시지, 버튼)
- [ ] 메타데이터 설정 (`robots: { index: false }`)
- [ ] 재시도 버튼 링크 연결 (`/subscription`)
- [ ] 대시보드 버튼 링크 연결 (`/dashboard`)
- [ ] 고객센터 안내 추가 (`mailto:` 링크)
- [ ] 개발 모드 디버그 정보 표시
- [ ] 반응형 디자인 확인 (모바일/데스크톱)
- [ ] 다크 모드 테스트 (shadcn-ui 기본 지원)

### 테스트 체크리스트

- [ ] 7개 에러 코드 각각 테스트 (수동)
- [ ] 쿼리 파라미터 없을 때 기본 메시지 확인
- [ ] 재시도 버튼 클릭 → `/subscription` 이동 확인
- [ ] 대시보드 버튼 클릭 → `/dashboard` 이동 확인
- [ ] 고객센터 이메일 링크 클릭 확인 (`mailto:`)
- [ ] 키보드 네비게이션 테스트 (Tab 키)
- [ ] 스크린 리더 테스트 (NVDA/VoiceOver)
- [ ] 색상 대비 체크 (WCAG AA)

### 배포 전 체크리스트

- [ ] 프로덕션 환경에서 디버그 정보 비활성화 확인
- [ ] SEO: `noindex` 메타 태그 적용 확인
- [ ] Clerk Middleware 보호 확인 (비로그인 접근 차단)
- [ ] 토스페이먼츠 failUrl 설정 확인 (개발자센터)

---

## 12. 참고 자료

### 공식 문서

- [토스페이먼츠 결제창 연동 가이드](https://docs.tosspayments.com/guides/payment/integration)
- [토스페이먼츠 에러 코드](https://docs.tosspayments.com/reference#error-codes)
- [Next.js App Router - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js App Router - searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional)
- [Clerk - Protected Routes](https://clerk.com/docs/references/nextjs/overview#protecting-routes)
- [shadcn-ui Button](https://ui.shadcn.com/docs/components/button)
- [Lucide React Icons](https://lucide.dev/icons/)

### 프로젝트 내부 문서

- `docs/prd.md` - 페이지 목록 및 기본 요구사항
- `docs/userflow.md` - 결제 실패 플로우 (3.4절)
- `docs/external/state-design.md` - 상태 관리 설계 (7.2절)
- `docs/external/toss.md` - 토스페이먼츠 연동 가이드
- `docs/usecases/011/spec.md` - UC-011: Pro 구독 결제 (Alternative Flow)
- `docs/common-modules.md` - 공통 모듈 (레이아웃, UI 컴포넌트)

---

**문서 끝**
