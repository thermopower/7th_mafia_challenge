import type { SupabaseClient } from '@supabase/supabase-js'
import { success, failure, type HandlerResult } from '@/backend/http/response'
import { analysisErrorCodes, type AnalysisServiceError } from './error'
import type {
  AnalysisListQuery,
  AnalysisListResponse,
} from './schema'

export async function getAnalysisDetail(
  supabase: SupabaseClient,
  clerkId: string,
  analysisId: string
) {
  // clerk_id로 UUID user_id 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) {
    return failure(404, analysisErrorCodes.notFound, 'User not found');
  }

  const { data, error } = await supabase
    .from('user_analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return failure(404, analysisErrorCodes.notFound, 'Analysis not found')
  }

  // JSON 결과 파싱
  const result = data.result_json as {
    general: string
    wealth: string
    love: string
    health: string
    job: string
  }

  return success({
    analysis: {
      id: data.id,
      name: data.name,
      gender: data.gender,
      birthDate: data.birth_date,
      birthTime: data.birth_time,
      isLunar: data.is_lunar,
      analysisType: data.analysis_type,
      modelUsed: data.model_used,
      createdAt: data.created_at,
    },
    result,
  })
}

export async function getRelatedAnalyses(
  supabase: SupabaseClient,
  clerkId: string,
  excludeId: string,
  limit: number
) {
  // clerk_id로 UUID user_id 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) {
    return failure(404, analysisErrorCodes.notFound, 'User not found');
  }

  // 현재 분석의 이름 조회
  const { data: currentAnalysis } = await supabase
    .from('user_analyses')
    .select('name')
    .eq('id', excludeId)
    .single()

  if (!currentAnalysis) {
    return failure(404, analysisErrorCodes.notFound, 'Analysis not found')
  }

  // 동일 이름의 다른 분석 조회
  const { data, error } = await supabase
    .from('user_analyses')
    .select('id, name, analysis_type, model_used, created_at')
    .eq('user_id', user.id)
    .eq('name', currentAnalysis.name)
    .neq('id', excludeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return failure(500, analysisErrorCodes.fetchError, 'Failed to fetch related analyses')
  }

  return success({ analyses: data || [] })
}

export async function deleteAnalysis(
  supabase: SupabaseClient,
  clerkId: string,
  analysisId: string
) {
  // clerk_id로 UUID user_id 조회
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) {
    return failure(404, analysisErrorCodes.notFound, 'User not found');
  }

  // 소유권 확인
  const { data: existing } = await supabase
    .from('user_analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return failure(404, analysisErrorCodes.notFound, 'Analysis not found')
  }

  // Soft delete
  const { error } = await supabase
    .from('user_analyses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', analysisId)

  if (error) {
    return failure(500, analysisErrorCodes.deleteError, 'Failed to delete analysis')
  }

  return success({ ok: true })
}

// ===== 대시보드용 목록 조회 =====

export const getAnalysesList = async (
  client: SupabaseClient,
  clerkId: string,
  query: AnalysisListQuery,
): Promise<HandlerResult<AnalysisListResponse, AnalysisServiceError, unknown>> => {
  const { page, limit, search, analysisType, sortBy, order } = query;
  const offset = (page - 1) * limit;

  // clerk_id로 UUID user_id 조회
  const { data: user, error: userError } = await client
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (userError) {
    return failure(500, analysisErrorCodes.fetchError, userError.message);
  }

  if (!user) {
    return failure(404, analysisErrorCodes.notFound, 'User not found');
  }

  // 쿼리 빌더 시작
  let queryBuilder = client
    .from('user_analyses')
    .select('id, name, analysis_type, model_used, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .is('deleted_at', null);

  // 검색 필터
  if (search) {
    queryBuilder = queryBuilder.ilike('name', `%${search}%`);
  }

  // 분석 종류 필터
  if (analysisType) {
    queryBuilder = queryBuilder.eq('analysis_type', analysisType);
  }

  // 정렬
  queryBuilder = queryBuilder.order(sortBy, { ascending: order === 'asc' });

  // 페이지네이션
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    return failure(500, analysisErrorCodes.fetchError, error.message);
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return success({
    analyses: data.map((row) => ({
      id: row.id,
      name: row.name,
      analysisType: row.analysis_type,
      modelUsed: row.model_used,
      createdAt: row.created_at,
    })),
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages,
    },
  });
};

export const deleteAnalysisById = async (
  client: SupabaseClient,
  clerkId: string,
  analysisId: string,
): Promise<HandlerResult<void, AnalysisServiceError, unknown>> => {
  // clerk_id로 UUID user_id 조회
  const { data: user, error: userError } = await client
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (userError || !user) {
    return failure(404, analysisErrorCodes.notFound, 'User not found');
  }

  // 권한 확인
  const { data: analysis, error: fetchError } = await client
    .from('user_analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    return failure(500, analysisErrorCodes.fetchError, fetchError.message);
  }

  if (!analysis) {
    return failure(404, analysisErrorCodes.notFound, 'Analysis not found');
  }

  // Soft delete
  const { error: updateError } = await client
    .from('user_analyses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', analysisId);

  if (updateError) {
    return failure(500, analysisErrorCodes.deleteError, updateError.message);
  }

  return success(undefined);
};
