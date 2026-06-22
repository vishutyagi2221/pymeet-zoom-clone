import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("pymeet_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me().then(({ data }) => setUser(data)).catch(() => {
      localStorage.removeItem("pymeet_token");
      setToken(null);
    }).finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    login: async (email, password) => {
      const { data } = await authApi.login({ email: email.trim().toLowerCase(), password });
      localStorage.setItem("pymeet_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    },
    register: async (name, email, password) => {
      const { data } = await authApi.register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      localStorage.setItem("pymeet_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    },
    logout: () => {
      localStorage.removeItem("pymeet_token");
      setToken(null);
      setUser(null);
    }
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

