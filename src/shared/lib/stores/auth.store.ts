// =====================================================
// AUTH STORE - Zustand Store for Authentication State
// =====================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, AuthSession } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: AuthSession) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setSession: (session) => set({ 
        user: session.user, 
        token: session.token,
        isAuthenticated: true,
        error: null,
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      logout: () => set({ 
        user: null, 
        token: null,
        isAuthenticated: false,
        error: null,
      }),
    }),
    {
      name: 'busy-notify-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserRole = (): Role | null => useAuthStore((state) => state.user?.role || null);
