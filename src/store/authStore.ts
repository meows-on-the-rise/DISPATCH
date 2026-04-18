import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/client";

export interface User {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN";
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  wallet?: { balance: number };
  driverProfile?: {
    isClockedIn: boolean;
    isVerified: boolean;
    vehicleMake?: string;
    vehicleModel?: string;
    vehiclePlate?: string;
    vehicleColor?: string;
    documents?: Array<{ docType: string; status: string; fileUrl: string }>;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        set({ user, accessToken, refreshToken });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        const rt = get().refreshToken;
        if (rt) authApi.logout(rt).catch(() => {});
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null });
      },

      refreshUser: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data });
        } catch {
          get().logout();
        }
      },

      hydrate: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem("accessToken");
          if (token) {
            const { data } = await authApi.me();
            set({ user: data });
          }
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "dispatch-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);
