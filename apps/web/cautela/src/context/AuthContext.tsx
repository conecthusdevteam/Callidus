import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getStoredSession,
  login as loginRequest,
  logout as logoutRequest,
  storeSession,
  type AuthSession,
  type AuthUser,
} from "../lib/api";

interface AuthContextValue {
  accessToken: string | null;
  login: (email: string, senha: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );

  const handleLogin = useCallback(async (email: string, senha: string) => {
    const nextSession = await loginRequest(email, senha);
    storeSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  }, []);

  const handleLogout = useCallback(async () => {
    const refreshToken = session?.refreshToken;

    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Falha remota não deve prender o usuário na sessão local.
      }
    }

    clearSession();
    setSession(null);
  }, [session?.refreshToken]);

  const value = useMemo(
    () => ({
      accessToken: session?.accessToken ?? null,
      login: handleLogin,
      logout: handleLogout,
      user: session?.user ?? null,
    }),
    [handleLogin, handleLogout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
