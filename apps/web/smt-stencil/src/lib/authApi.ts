import {
  clearStoredAccessToken,
  getStoredAccessToken,
  notifyTokenExpired,
  storeAccessToken,
} from "@/lib/auth-storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type UserArea = "operacao" | "engenharia" | "qualidade" | "admin";
export type UserRole = "user" | "admin";

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  area: UserArea;
  role: UserRole;
}

export interface LoginPayload {
  area: UserArea;
  email: string;
  password: string;
  rememberMe: boolean;
}

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getStoredAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (
    response.status === 401 &&
    token &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/refresh"
  ) {
    notifyTokenExpired();
  }

  if (!response.ok) {
    throw new Error(`Auth error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const session = await authRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    storeAccessToken(session.accessToken, payload.rememberMe);
    return session.user;
  },

  refresh: async () => {
    const session = await authRequest<AuthSession>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({}),
    });
    storeAccessToken(session.accessToken, true);
    return session.user;
  },

  me: () => authRequest<AuthUser>("/auth/me"),

  logout: async () => {
    try {
      await authRequest<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } finally {
      clearStoredAccessToken();
    }
  },
};
