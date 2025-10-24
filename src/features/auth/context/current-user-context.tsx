"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import type {
  CurrentUserContextValue,
  CurrentUserSnapshot,
} from "../types";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  children: ReactNode;
};

export const CurrentUserProvider = ({
  children,
}: CurrentUserProviderProps) => {
  const queryClient = useQueryClient();
  const { user: clerkUser, isLoaded } = useUser();

  const refresh = useCallback(async () => {
    // Clerk는 자동으로 사용자 상태를 관리하므로 별도 refresh 불필요
    // 필요시 쿼리 캐시만 invalidate
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  }, [queryClient]);

  const snapshot = useMemo<CurrentUserSnapshot>(() => {
    if (!isLoaded) {
      return { status: "loading", user: null };
    }

    if (clerkUser) {
      return {
        status: "authenticated",
        user: {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          appMetadata: {},
          userMetadata: clerkUser.publicMetadata ?? {},
        },
      };
    }

    return { status: "unauthenticated", user: null };
  }, [clerkUser, isLoaded]);

  const value = useMemo<CurrentUserContextValue>(() => {
    return {
      ...snapshot,
      refresh,
      isAuthenticated: snapshot.status === "authenticated",
      isLoading: snapshot.status === "loading",
    };
  }, [refresh, snapshot]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserContext = () => {
  const value = useContext(CurrentUserContext);

  if (!value) {
    throw new Error("CurrentUserProvider가 트리 상단에 필요합니다.");
  }

  return value;
};
