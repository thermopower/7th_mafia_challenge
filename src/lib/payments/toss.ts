/**
 * 토스페이먼츠 클라이언트
 * 결제 승인, 조회, 취소, 빌링키 관리
 */

const TOSS_API_BASE = 'https://api.tosspayments.com'

/**
 * Authorization 헤더 생성
 */
const createAuthHeader = () => {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not defined')
  }
  const auth = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${auth}`
}

/**
 * 결제 승인 파라미터
 */
export type ConfirmPaymentParams = {
  paymentKey: string
  orderId: string
  amount: number
}

/**
 * 결제 승인
 */
export const confirmPayment = async (params: ConfirmPaymentParams) => {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: createAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotency-Key': `confirm-${params.orderId}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(JSON.stringify(error))
  }

  return await res.json()
}

/**
 * 결제 조회
 */
export const getPayment = async (paymentKey: string) => {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/${paymentKey}`, {
    headers: {
      Authorization: createAuthHeader(),
    },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(JSON.stringify(error))
  }

  return await res.json()
}

/**
 * 결제 취소 파라미터
 */
export type CancelPaymentParams = {
  cancelReason: string
  cancelAmount?: number
}

/**
 * 결제 취소
 */
export const cancelPayment = async (
  paymentKey: string,
  params: CancelPaymentParams
) => {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: createAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotency-Key': `cancel-${paymentKey}-${Date.now()}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(JSON.stringify(error))
  }

  return await res.json()
}

/**
 * 빌링키 발급 파라미터
 */
export type IssueBillingKeyParams = {
  authKey: string
  customerKey: string
}

/**
 * 빌링키 발급
 */
export const issueBillingKey = async (params: IssueBillingKeyParams) => {
  const res = await fetch(`${TOSS_API_BASE}/v1/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      Authorization: createAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotency-Key': `billing-issue-${params.customerKey}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(JSON.stringify(error))
  }

  return await res.json()
}

/**
 * 자동 결제 (빌링키로 과금)
 */
export type ChargeBillingParams = {
  billingKey: string
  orderId: string
  orderName: string
  amount: number
  customerKey: string
}

/**
 * 자동 결제 실행
 */
export const chargeBilling = async (params: ChargeBillingParams) => {
  const { billingKey, ...body } = params

  const res = await fetch(`${TOSS_API_BASE}/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: createAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotency-Key': `bill-${billingKey}-${new Date()
        .toISOString()
        .slice(0, 10)}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(JSON.stringify(error))
  }

  return await res.json()
}

/**
 * 빌링키 삭제
 */
export const deleteBillingKey = async (billingKey: string) => {
  const res = await fetch(
    `${TOSS_API_BASE}/v1/billing/authorizations/${billingKey}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: createAuthHeader(),
      },
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(JSON.stringify(error))
  }

  return await res.json()
}
