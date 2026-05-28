import { create } from "zustand";
import type { SessionUser } from "@vms/shared";

interface AuthState {
  user: SessionUser | null;
  csrfToken: string | null;
  hydrated: boolean;
  setSession: (user: SessionUser, csrfToken: string) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  csrfToken: null,
  hydrated: false,
  setSession: (user, csrfToken) => set({ user, csrfToken }),
  clearSession: () => set({ user: null, csrfToken: null }),
  markHydrated: () => set({ hydrated: true }),
}));
