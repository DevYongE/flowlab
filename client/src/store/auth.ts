// client/src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { isLoggedIn as checkLoggedIn } from '../lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // 액션
      setUser: (user) => set({ user }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      login: (user) => {
        set({ 
          user, 
          isAuthenticated: true, 
          error: null,
          loading: false 
        });
      },
      
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null,
          loading: false 
        });
      },
      
      checkAuth: () => {
        const isAuth = checkLoggedIn();
        const storedUser = sessionStorage.getItem('user');
        
        if (isAuth && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            set({ 
              user, 
              isAuthenticated: true, 
              error: null 
            });
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            set({ 
              user: null, 
              isAuthenticated: false, 
              error: 'Invalid user data' 
            });
          }
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 