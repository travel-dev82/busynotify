// =====================================================
// AUTH STORE - Zustand Store for Authentication State
// =====================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Role, AuthSession } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: AuthSession) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      
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
      
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }),
    {
      name: 'busy-notify-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('Auth store rehydration error:', error);
          }
          // Use getState() to access the store's setHasHydrated action
          useAuthStore.getState().setHasHydrated(true);
        };
      },
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserRole = (): Role | null => useAuthStore((state) => state.user?.role || null);
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated);
