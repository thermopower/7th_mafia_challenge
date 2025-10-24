import axios, { isAxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Clerk 토큰을 설정하는 함수
let getClerkToken: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  getClerkToken = getter;
};

// Request interceptor to add Clerk token
apiClient.interceptors.request.use(
  async (config) => {
    console.log('[API Client] Request URL:', config.url);
    console.log('[API Client] getClerkToken available:', !!getClerkToken);

    if (getClerkToken) {
      try {
        const token = await getClerkToken();
        console.log('[API Client] Token received:', token ? `${token.substring(0, 20)}...` : 'null');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[API Client] Authorization header set');
        } else {
          console.warn('[API Client] No token available');
        }
      } catch (error) {
        console.error("[API Client] Failed to get Clerk token:", error);
      }
    } else {
      console.warn('[API Client] getClerkToken not initialized');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
