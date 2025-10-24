import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot } from "../types";

const mapUser = (user: User) => ({
  id: user.id,
  email: user.email,
  appMetadata: user.app_metadata ?? {},
  userMetadata: user.user_metadata ?? {},
});

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();

  try {
    const result = await supabase.auth.getUser();

    // 에러가 있거나 사용자가 없는 경우
    if (result.error) {
      console.warn('[loadCurrentUser] Auth error:', result.error.message);
      // 유효하지 않은 세션 정리
      await supabase.auth.signOut();
      return { status: "unauthenticated", user: null };
    }

    const user = result.data.user;

    if (user) {
      return {
        status: "authenticated",
        user: mapUser(user),
      };
    }

    return { status: "unauthenticated", user: null };
  } catch (error) {
    console.error('[loadCurrentUser] Unexpected error:', error);
    // 예상치 못한 에러 발생 시에도 세션 정리 시도
    try {
      await supabase.auth.signOut();
    } catch {
      // signOut 실패는 무시
    }
    return { status: "unauthenticated", user: null };
  }
};
