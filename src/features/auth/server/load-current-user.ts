import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { CurrentUserSnapshot } from "../types";

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { status: "unauthenticated", user: null };
    }

    const user = await currentUser();

    if (!user) {
      return { status: "unauthenticated", user: null };
    }

    return {
      status: "authenticated",
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        appMetadata: {},
        userMetadata: user.publicMetadata ?? {},
      },
    };
  } catch (error) {
    console.error("[loadCurrentUser] Error:", error);
    return { status: "unauthenticated", user: null };
  }
};
