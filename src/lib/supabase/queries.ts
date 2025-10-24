/**
 * Supabase 공통 쿼리 유틸리티
 * 자주 사용되는 쿼리 패턴을 재사용 가능한 함수로 제공
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Clerk ID로 사용자 조회
 */
export const getUserByClerkId = async (
  supabase: SupabaseClient,
  clerkId: string
) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

/**
 * 사용자 크레딧 차감/충전
 * @param delta - 양수(충전) 또는 음수(차감)
 */
export const updateUserCredits = async (
  supabase: SupabaseClient,
  userId: string,
  delta: number
) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      remaining_analyses: supabase.raw(`remaining_analyses + ${delta}`),
    })
    .eq('id', userId)
    .select('remaining_analyses')
    .single()

  if (error) throw error
  return data
}

/**
 * 사용자의 프로필 목록 조회
 */
export const getUserProfiles = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * 사용자의 분석 내역 조회 (검색/필터/페이지네이션)
 */
export const getUserAnalyses = async (
  supabase: SupabaseClient,
  userId: string,
  options?: {
    search?: string
    analysisType?: string
    limit?: number
    offset?: number
  }
) => {
  let query = supabase
    .from('user_analyses')
    .select('id, name, analysis_type, model_used, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`)
  }

  if (options?.analysisType) {
    query = query.eq('analysis_type', options.analysisType)
  }

  query = query.order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 10) - 1
    )
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * 분석 내역 상세 조회
 */
export const getAnalysisById = async (
  supabase: SupabaseClient,
  analysisId: string,
  userId?: string
) => {
  let query = supabase
    .from('user_analyses')
    .select('*')
    .eq('id', analysisId)
    .is('deleted_at', null)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.single()

  if (error) throw error
  return data
}

/**
 * 분석 내역 삭제 (Soft Delete)
 */
export const deleteAnalysis = async (
  supabase: SupabaseClient,
  analysisId: string,
  userId: string
) => {
  const { error } = await supabase
    .from('user_analyses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', analysisId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * 프로필 생성
 */
export const createProfile = async (
  supabase: SupabaseClient,
  data: {
    userId: string
    name: string
    gender: 'male' | 'female'
    birthDate: string
    birthTime?: string
    isLunar: boolean
  }
) => {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: data.userId,
      name: data.name,
      gender: data.gender,
      birth_date: data.birthDate,
      birth_time: data.birthTime,
      is_lunar: data.isLunar,
    })
    .select()
    .single()

  if (error) throw error
  return profile
}

/**
 * 프로필 수정
 */
export const updateProfile = async (
  supabase: SupabaseClient,
  profileId: string,
  userId: string,
  data: {
    name?: string
    gender?: 'male' | 'female'
    birthDate?: string
    birthTime?: string
    isLunar?: boolean
  }
) => {
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.gender !== undefined) updateData.gender = data.gender
  if (data.birthDate !== undefined) updateData.birth_date = data.birthDate
  if (data.birthTime !== undefined) updateData.birth_time = data.birthTime
  if (data.isLunar !== undefined) updateData.is_lunar = data.isLunar

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', profileId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return profile
}

/**
 * 프로필 삭제 (Soft Delete)
 */
export const deleteProfile = async (
  supabase: SupabaseClient,
  profileId: string,
  userId: string
) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', profileId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * 결제 내역 조회
 */
export const getPaymentHistory = async (
  supabase: SupabaseClient,
  userId: string,
  options?: {
    limit?: number
    offset?: number
  }
) => {
  let query = supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 10) - 1
    )
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * 공유 토큰 생성
 */
export const createShareToken = async (
  supabase: SupabaseClient,
  analysisId: string
) => {
  const { data, error } = await supabase
    .from('share_tokens')
    .insert({
      analysis_id: analysisId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
    })
    .select('token')
    .single()

  if (error) throw error
  return data.token
}

/**
 * 공유 토큰으로 분석 조회
 */
export const getAnalysisByShareToken = async (
  supabase: SupabaseClient,
  token: string
) => {
  const { data, error } = await supabase
    .from('share_tokens')
    .select('analysis_id, user_analyses(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) throw error
  return data.user_analyses
}
