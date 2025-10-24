import { z } from 'zod';

// 구독 상태 응답 스키마
export const SubscriptionStatusResponseSchema = z.object({
  plan: z.enum(['free', 'pro', 'pending_cancel']),
  remainingAnalyses: z.number().int().min(0),
  nextBillingDate: z.string().nullable(),
  subscriptionStartDate: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>;

// DB Row 스키마 (snake_case)
export const UserSubscriptionRowSchema = z.object({
  id: z.string().uuid(),
  subscription_tier: z.enum(['free', 'pro', 'pending_cancel']),
  remaining_analyses: z.number().int(),
  next_billing_date: z.string().nullable(),
  subscription_start_date: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
  billing_key: z.string().nullable(),
});

export type UserSubscriptionRow = z.infer<typeof UserSubscriptionRowSchema>;

// 구독 취소 요청 스키마
export const CancelSubscriptionRequestSchema = z.object({
  userId: z.string().uuid(),
});

export type CancelSubscriptionRequest = z.infer<typeof CancelSubscriptionRequestSchema>;

// 구독 재활성화 요청 스키마
export const ReactivateSubscriptionRequestSchema = z.object({
  userId: z.string().uuid(),
});

export type ReactivateSubscriptionRequest = z.infer<typeof ReactivateSubscriptionRequestSchema>;

// 결제 내역 응답 스키마
export const PaymentHistoryItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string(),
  amount: z.number().int(),
  status: z.enum(['pending', 'done', 'canceled', 'failed']),
  method: z.string().nullable(),
  createdAt: z.string(),
});

export type PaymentHistoryItem = z.infer<typeof PaymentHistoryItemSchema>;

export const PaymentHistoryResponseSchema = z.object({
  items: z.array(PaymentHistoryItemSchema),
  total: z.number().int(),
});

export type PaymentHistoryResponse = z.infer<typeof PaymentHistoryResponseSchema>;
