"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, ApiError } from "./api";
import type { UserProfile } from "./types";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      api.clearToken();
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("farmpilot_token")
        : null;

    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    const profile = await api.getProfile();
    setUser(profile);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
    }) => {
      await api.register(data);
      const profile = await api.getProfile();
      setUser(profile);
    },
    []
  );

  const logout = useCallback(() => {
    api.clearToken();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
