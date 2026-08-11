import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi, type AuthUser, type LoginPayload } from "@/lib/authApi";
import {
  clearStoredAccessToken,
  getAccessTokenExpiration,
  getStoredAccessToken,
  isStoredAccessTokenExpired,
  TOKEN_EXPIRED_EVENT,
} from "@/lib/auth-storage";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        if (isStoredAccessTokenExpired()) {
          clearStoredAccessToken();
          if (active) setUser(null);
          return;
        }

        const restoredUser = getStoredAccessToken()
          ? await authApi.me()
          : await authApi.refresh();
        if (active) setUser(restoredUser);
      } catch {
        clearStoredAccessToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function handleTokenExpired() {
      clearStoredAccessToken();
      setUser(null);
      try {
        await authApi.logout();
      } catch {
        // The local session is already gone; the next login will replace cookies.
      }
    }

    window.addEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    return () => {
      window.removeEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const expiresAt = getAccessTokenExpiration();

    if (!expiresAt || expiresAt <= Date.now()) {
      clearStoredAccessToken();
      setUser(null);
      return;
    }

    const logoutTimer = window.setTimeout(() => {
      clearStoredAccessToken();
      setUser(null);
    }, expiresAt - Date.now());

    return () => window.clearTimeout(logoutTimer);
  }, [user]);

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedUser = await authApi.login(payload);
    setUser(loggedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
