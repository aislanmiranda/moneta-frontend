import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, getToken, onUnauthorized, setToken, type AuthUser, type RegisterInput } from "../api/client";

interface AuthContextValue {
  user: AuthUser | null;
  /** True while a stored token is being checked on startup — avoids flashing the login page. */
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => getToken() !== null);

  function logout() {
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    onUnauthorized(logout);
    return () => onUnauthorized(null);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        // 401 already signed out via onUnauthorized; a network error keeps the token for later.
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(loginName: string, password: string) {
    const result = await authApi.login(loginName, password);
    setToken(result.token);
    setUser(result.user);
  }

  async function register(input: RegisterInput) {
    const result = await authApi.register(input);
    setToken(result.token);
    setUser(result.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}
