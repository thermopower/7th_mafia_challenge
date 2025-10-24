아래는 지금까지의 교차검증 결과를 반영한 **최종 연동 문서(Next.js LTS / Node.js LTS 가정)**입니다. SDK는 “향후 도입(선택)”, **API/Webhook 중심**으로 즉시 운영 가능한 형태로 정리했습니다. 문서의 사실 근거는 토스페이먼츠 공식 문서를 인용해 두었습니다.

---

# 토스페이먼츠 최종 연동 가이드 (SDK / API / Webhook)

> 기본 전략: **API + Webhook**으로 즉시 운영 → 이후 **SDK(결제위젯)** 도입 시 프런트 결제 UI/전환율 강화.
> 승인(Confirm)·멱등성·웹훅 재시도·보안 정책은 **공식 문서 기준**으로 구현합니다. ([토스페이먼츠][1])

---

## 1) 연동할 수단

* **SDK(결제위젯)**: *선택(향후 도입)* — 결제 UI를 페이지에 임베드하고 `requestPayment`로 결제 요청. ([토스페이먼츠][2])
* **API(서버)**: 결제 승인(Confirm), 결제 조회/취소, 가상계좌 발급, 자동결제(빌링) 발급·과금 등. 모든 POST에 **Idempotency-Key 권장(15일 유효)**. ([토스페이먼츠][1])
* **Webhook(서버)**: `PAYMENT_STATUS_CHANGED`, `DEPOSIT_CALLBACK` 등 결제 이벤트 수신. **7회 지수적 재시도**와 **가상계좌 `secret` 검증** 등 운영 규칙을 준수. ([토스페이먼츠][3])

---

## 2) 각 수단에서 사용할 기능

### 2.1 SDK(결제위젯) — *선택/향후 도입*

* **UI 렌더링**: `loadPaymentWidget(clientKey, customerKey)` → `renderPaymentMethods(...)`로 결제수단 UI 표시. ([벨로그][4])
* **결제 요청**: `paymentWidget.requestPayment({ orderId, orderName, amount, successUrl, failUrl })`. 성공 리다이렉트 후 서버에서 **승인(Confirm)** 처리. ([토스페이먼츠][2])

### 2.2 API(서버)

* **결제 승인(Confirm)**: `POST /v1/payments/confirm` — `paymentKey`, `orderId`, `amount`. 성공 페이지로 리다이렉트된 뒤 **10분 이내 승인 필수**. ([토스페이먼츠][1])
* **결제 조회/취소**: `GET /v1/payments/{paymentKey}`, `POST /v1/payments/{paymentKey}/cancel`(가상계좌 환불 계좌 정보 요구). ([토스페이먼츠][1])
* **가상계좌**: 결제창/창 없이 가상계좌 발급·입금 업데이트 처리(가상계좌 관련 속성·`secret`은 Payment 객체에 명시). ([토스페이먼츠][5])
* **자동결제(빌링)**: (1) 등록(본인인증/등록창 or API) → (2) `billingKey` 발급 → (3) `POST /v1/billing/{billingKey}` 과금. 일부 방식은 **별도 계약/심사** 필요. ([토스페이먼츠][6])

### 2.3 Webhook(서버)

* **주요 이벤트**: `PAYMENT_STATUS_CHANGED`(모든 결제수단), `DEPOSIT_CALLBACK`(가상계좌 입금/취소), `CANCEL_STATUS_CHANGED`(해외 비동기 결제), BrandPay 관련 등. ([토스페이먼츠][3])
* **검증/교차확인**: `DEPOSIT_CALLBACK` 본문 `secret`은 Payment의 `secret`과 일치해야 함 → 수신 후 **조회 API로 최종 상태 확인** 권장. ([토스페이먼츠][3])
* **재시도 정책**: 200 미응답 시 **최대 7회** 재시도(분 단위 간격: 1 → 4 → 16 → 64 → 256 → 1024 → 4096). **IP 허용** 필요. ([토스페이먼츠][3])

---

## 3) 각 수단의 설치/세팅 방법

### 3.1 SDK(선택)

```bash
npm i @tosspayments/payment-widget-sdk
```

* **환경변수(클라이언트 키)**: `.env.local`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` 저장.
* **고객 식별자**: `customerKey`(자체 유저 ID/UUID).
* **Next.js**: Client Component에서 `loadPaymentWidget` 호출 후 `renderPaymentMethods`. ([벨로그][4])

### 3.2 API(서버)

* **엔드포인트 베이스**: `https://api.tosspayments.com` (영문 가이드/코어 레퍼런스 참조).
* **런타임**: Node.js/Next.js 서버에서 표준 HTTPS + JSON 호출.
* **멱등성 키 권장**: `Idempotency-Key` 헤더(최대 300자, **15일 유효**). ([토스페이먼츠][1])

### 3.3 Webhook(서버)

* **개발자센터 > Webhook**에서 **엔드포인트 등록 + 이벤트 선택**.
* **로컬 테스트**: ngrok 등 터널 사용.
* **네트워크**: 토스페이먼츠 **발신 IP 허용**(방화벽/WAF). ([토스페이먼츠][3])

---

## 4) 각 수단의 인증정보 관리 방법

### 공통(API 키/헤더)

* **시크릿 키(서버 전용)**: 테스트 `test_sk* / test_gsk*`, 운영 `live_sk* / live_gsk*`.
* **Basic 인증**: `Authorization: Basic {base64(secretKey + ":")}`.
* **멱등성**: `Idempotency-Key` 헤더 사용(임의 고유값, **15일 유효**). ([토스페이먼츠][1])

### SDK

* **클라이언트 키**: `NEXT_PUBLIC_TOSS_CLIENT_KEY` (브라우저 노출 가능).
* **초기화**: JS SDK(V2) 또는 결제위젯 SDK 문서 흐름 준수. ([토스페이먼츠][7])

### Webhook

* **가상계좌**: 본문 `secret` ↔ Payment의 `secret` **일치 검증**.
* **응답 정책**: 가능한 **빠른 200 응답**(내부 비동기 처리).
* **재시도/가시성**: 실패 시 **최대 7회 재시도**, 개발자센터에서 히스토리 확인. ([토스페이먼츠][3])

---

## 5) 각 수단의 호출 방법 (Next.js App Router / TypeScript 예시)

> 예시에서는 **멱등성 키**를 모든 POST에 넣고, **오류 응답을 그대로 로깅**하도록 간단화했습니다.

### 5.1 SDK — 결제위젯 *(선택/향후)*

```tsx
// app/checkout/page.tsx (Client Component)
'use client'
import { useEffect, useRef } from 'react'
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk'

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
const customerKey = 'user-uuid-or-id'

export default function CheckoutPage() {
  const widgetRef = useRef<PaymentWidgetInstance | null>(null)

  useEffect(() => {
    (async () => {
      const widget = await loadPaymentWidget(clientKey, customerKey) // SDK 초기화
      await widget.renderPaymentMethods('#payment-widget', { value: 10000 }) // UI 렌더링
      widgetRef.current = widget
    })()
  }, [])

  const pay = async () => {
    await widgetRef.current?.requestPayment({
      orderId: 'order-' + Date.now(),
      orderName: 'Pro 1개월',
      amount: 10000,
      successUrl: `${location.origin}/api/payments/success`,
      failUrl: `${location.origin}/payments/fail`,
    }) // 인증 → successUrl로 리다이렉트
  }

  return (
    <div>
      <div id="payment-widget" />
      <button onClick={pay}>결제하기</button>
    </div>
  )
}
```

> **서버 승인(Confirm)**은 성공 리다이렉트 후 **10분 이내**에 수행하세요. ([토스페이먼츠][8])

```ts
// app/api/payments/success/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = Number(searchParams.get('amount'))

  const auth = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')

  const r = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `confirm-${orderId}`,
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  }) // POST /v1/payments/confirm

  if (!r.ok) return NextResponse.json({ ok: false, error: await r.text() }, { status: 500 })
  return NextResponse.redirect(new URL('/dashboard', req.url))
}
```

([토스페이먼츠][1])

---

### 5.2 API — 가상계좌(무위젯, 즉시 운영)

```ts
// app/api/payments/virtual-account/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orderId, orderName, amount, customerEmail, customerMobilePhone } = await req.json()
  const auth = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')

  const r = await fetch('https://api.tosspayments.com/v1/virtual-accounts', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `va-${orderId}`,
    },
    body: JSON.stringify({
      orderId, orderName, amount, validHours: 24,
      customerEmail, customerMobilePhone,
      secret: `whsec-${orderId}`, // DEPOSIT_CALLBACK 검증용
    }),
  })

  const data = await r.json()
  if (!r.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 })
  // paymentKey, virtualAccount.accountNumber/bank 저장
  return NextResponse.json({ ok: true, payment: data })
}
```

> `secret`은 가상계좌 웹훅 본문과 **일치해야 정상 요청**으로 인정됩니다. 수신 후 **조회 API**로 상태를 교차검증하세요. ([토스페이먼츠][5])

---

### 5.3 API — 자동결제(빌링)

**흐름**: 등록(본인인증/등록창 등) → `authKey` 수신 → `POST /v1/billing/authorizations/issue`로 **`billingKey` 발급** → `POST /v1/billing/{billingKey}`로 과금. 일부 방식은 **별도 계약/심사**가 필요할 수 있습니다. ([토스페이먼츠][6])

```ts
// app/api/billing/issue/route.ts (authKey → billingKey)
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const authKey = searchParams.get('authKey')
  const customerKey = searchParams.get('customerKey')
  if (!authKey || !customerKey) {
    return NextResponse.json({ ok: false, error: 'Missing authKey/customerKey' }, { status: 400 })
  }

  const auth = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')
  const r = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `billing-issue-${customerKey}`,
    },
    body: JSON.stringify({ authKey, customerKey }),
  })

  const data = await r.json()
  if (!r.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 })

  // data.billingKey 저장
  return NextResponse.redirect(new URL('/dashboard', req.url))
}
```

```ts
// server/lib/payments.ts (정기/수시 과금)
export async function chargeRecurring(billingKey: string, userId: string, amount: number) {
  const auth = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')
  const r = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `bill-${billingKey}-${new Date().toISOString().slice(0,10)}`,
    },
    body: JSON.stringify({
      orderId: `sub-${userId}-${Date.now()}`,
      orderName: 'Pro 구독',
      amount,
      customerKey: userId,
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(data))
  return data
}
```

([토스페이먼츠][6])

---

### 5.4 Webhook — 수신 엔드포인트

```ts
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const event = await req.json()

  // 운영 권장:
  // 1) 토스 발신 IP 허용(WAF/보안그룹)
  // 2) 가능한 빠르게 200 응답(내부 비동기 처리)
  // 3) 조회 API로 교차검증
  // 4) 가상계좌: body.secret === 저장된 secret 확인

  switch (event.eventType) {
    case 'PAYMENT_STATUS_CHANGED': {
      const snapshot = event.data // Payment 객체 스냅샷
      // GET /v1/payments/{paymentKey}로 최종 확인 후 DB 갱신
      break
    }
    case 'DEPOSIT_CALLBACK': {
      const { secret, orderId, status } = event
      // secret 일치/금액 검증 후 주문 확정
      break
    }
    default:
      break
  }
  return NextResponse.json({ ok: true })
}
```

> **재시도 정책**: 미응답/비200이면 **최대 7회**, 간격은 **1, 4, 16, 64, 256, 1024, 4096분**. 개발자센터에서 히스토리 확인 가능. ([토스페이먼츠][3])

---

## 6) 체크리스트(운영 기준)

* [ ] **키 분리**: `test_*` / `live_*` 운영 분리. ([토스페이먼츠][1])
* [ ] **시크릿 키는 서버 전용**, 클라이언트에 노출 금지. ([토스페이먼츠][1])
* [ ] 모든 POST에 **Idempotency-Key** 적용(**15일 유효**). ([토스페이먼츠][1])
* [ ] **Webhook 등록**: 필요한 이벤트만 구독, **IP 허용 + 200 빠른 응답**. ([토스페이먼츠][3])
* [ ] **가상계좌**: `secret` 검증 + 조회 API 교차확인. ([토스페이먼츠][3])
* [ ] **Confirm 10분 제한 준수**(성공 리다이렉트 후 승인). ([토스페이먼츠][8])
* [ ] **취소/환불**: 가상계좌 취소 시 환불 계좌 정보 필수. ([토스페이먼츠][1])

---

## 7) 디렉터리 예시(Next.js App Router)

```
app/
  api/
    payments/
      success/route.ts           # (SDK 사용 시) 결제 승인(Confirm)
      virtual-account/route.ts   # 가상계좌 발급
    billing/
      issue/route.ts             # authKey → billingKey 발급
    webhook/route.ts             # 웹훅 수신
  dashboard/page.tsx
lib/
  payments.ts                    # 공통 fetch/멱등성/에러 유틸
.env / .env.local
```

---

### 부록: 참고한 공식 문서

* **Payment APIs/Confirm·조회·취소·키인**: ([토스페이먼츠][1])
* **결제 성공 후 10분 내 승인**: ([토스페이먼츠][8])
* **Idempotency-Key(15일)**: ([토스페이먼츠][1])
* **Webhook 이벤트·secret·재시도 정책·IP 허용**: ([토스페이먼츠][3])
* **가상계좌 속성/secret(코어 API)**: ([토스페이먼츠][5])
* **결제위젯/SDK 흐름**: ([토스페이먼츠][2])

---

[1]: https://docs.tosspayments.com/en/api-guide "Payment APIs | 토스페이먼츠 개발자센터"
[2]: https://docs.tosspayments.com/en/integration-widget?utm_source=chatgpt.com "Integrate payment widgets | 토스페이먼츠 개발자센터"
[3]: https://docs.tosspayments.com/en/webhooks "Integrate webhooks | 토스페이먼츠 개발자센터"
[4]: https://velog.io/%40tosspayments/React%EB%A1%9C-%EA%B2%B0%EC%A0%9C-%ED%8E%98%EC%9D%B4%EC%A7%80-%EA%B0%9C%EB%B0%9C%ED%95%98%EA%B8%B0-ft.-%EA%B2%B0%EC%A0%9C%EC%9C%84%EC%A0%AF?utm_source=chatgpt.com "React로 결제 페이지 개발하기 (ft. 결제위젯)"
[5]: https://docs.tosspayments.com/reference?utm_source=chatgpt.com "코어 API | 토스페이먼츠 개발자센터"
[6]: https://docs.tosspayments.com/guides/v2/billing/integration-api?utm_source=chatgpt.com "자동결제(빌링) API로 연동하기 | 토스페이먼츠 개발자센터"
[7]: https://docs.tosspayments.com/sdk/v2/js?utm_source=chatgpt.com "토스페이먼츠 JavaScript SDK | 토스페이먼츠 개발자센터"
[8]: https://docs.tosspayments.com/guides/payment/integration?utm_source=chatgpt.com "토스페이먼츠 결제창 연동하기(Version 1) | 토스페이먼츠 개발자센터"
