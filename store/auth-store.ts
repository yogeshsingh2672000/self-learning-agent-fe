/**
 * Zustand store for authentication state management
 */
import { create } from "zustand";
import { User } from "@/types";
import { authUtils } from "@/lib/auth";

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      authUtils.setToken(token);
    }
    set({ token, isAuthenticated: !!token });
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    authUtils.removeToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const token = authUtils.getToken();
    set({
      token,
      isAuthenticated: !!token,
    });
  },
}));
