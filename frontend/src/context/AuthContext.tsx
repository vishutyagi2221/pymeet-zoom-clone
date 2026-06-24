import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (name?: string, current_password?: string, new_password?: string, reset_token?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("pymeet_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("pymeet_token"));
  const [loading, setLoading] = useState(() => !(localStorage.getItem("pymeet_token") && localStorage.getItem("pymeet_user")));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me().then(({ data }) => {
      setUser(data);
      localStorage.setItem("pymeet_user", JSON.stringify(data));
    }).catch(() => {
      localStorage.removeItem("pymeet_token");
      localStorage.removeItem("pymeet_user");
      setToken(null);
      setUser(null);
    }).finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    login: async (email, password) => {
      const { data } = await authApi.login({ email: email.trim().toLowerCase(), password });
      localStorage.setItem("pymeet_token", data.access_token);
      localStorage.setItem("pymeet_user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
    },
    register: async (name, email, password) => {
      const { data } = await authApi.register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      localStorage.setItem("pymeet_token", data.access_token);
      localStorage.setItem("pymeet_user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
    },
    updateProfile: async (name, current_password, new_password, reset_token) => {
      const payload: any = {};
      if (name) payload.name = name;
      if (current_password) payload.current_password = current_password;
      if (new_password) payload.password = new_password;
      if (reset_token) payload.reset_token = reset_token;
      const { data } = await authApi.updateProfile(payload);
      localStorage.setItem("pymeet_user", JSON.stringify(data));
      setUser(data);
    },
    logout: () => {
      localStorage.removeItem("pymeet_token");
      localStorage.removeItem("pymeet_user");
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

