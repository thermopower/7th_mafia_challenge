/**
 * Clerk Webhook 핸들러
 * Clerk 이벤트 수신 및 Supabase 동기화
 */

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createServiceClient } from '@/backend/supabase/client'
import { getAppConfig } from '@/backend/config'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing CLERK_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  // Svix 헤더 가져오기
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing Svix headers' },
      { status: 400 }
    )
  }

  // 요청 본문 가져오기
  const payload = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Webhook 검증
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (err) {
    console.error('Clerk webhook verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const config = getAppConfig()
  const supabase = createServiceClient({
    url: config.supabase.url,
    serviceRoleKey: config.supabase.serviceRoleKey,
  })

  try {
    switch (evt.type) {
      case 'user.created': {
        const { id, email_addresses } = evt.data
        const email = email_addresses?.[0]?.email_address ?? null

        await supabase.from('users').insert({
          clerk_id: id,
          email: email,
          subscription_tier: 'free',
          remaining_analyses: 3,
        })

        console.info(`User created: ${id}`)
        break
      }

      case 'user.updated': {
        const { id, email_addresses } = evt.data
        const email = email_addresses?.[0]?.email_address ?? null

        await supabase
          .from('users')
          .update({ email: email })
          .eq('clerk_id', id)

        console.info(`User updated: ${id}`)
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('clerk_id', id)

        console.info(`User deleted (soft): ${id}`)
        break
      }

      default:
        console.warn(`Unhandled webhook event type: ${evt.type}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Clerk webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
