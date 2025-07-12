// client/src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { isLoggedIn as checkLoggedIn } from '../lib/auth';
import axios from '../lib/axios';

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
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
      
      logout: async () => {
        try {
          console.log('🔓 Logging out...');
          
          // 서버에 로그아웃 요청
          await axios.post('/auth/logout');
          
          // 로컬 상태 초기화
          sessionStorage.removeItem('user');
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            loading: false 
          });
          
          console.log('✅ Logged out successfully');
        } catch (error) {
          console.error('❌ Logout error:', error);
          
          // 서버 요청 실패해도 로컬 상태는 초기화
          sessionStorage.removeItem('user');
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            loading: false 
          });
        }
      },
      
      checkAuth: async () => {
        console.log('🔍 Checking authentication status...');
        set({ loading: true });
        
        const isAuth = checkLoggedIn();
        console.log('🔍 Client-side auth check:', isAuth);
        
        if (!isAuth) {
          console.log('❌ No client-side auth found');
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            loading: false 
          });
          return;
        }
        
        try {
          console.log('🔍 Verifying with server...');
          const response = await axios.get('/auth/me');
          
          if (response.data.success) {
            const user = response.data.user;
            console.log('✅ Server auth verified:', user);
            
            // sessionStorage에도 저장 (하위 호환성)
            sessionStorage.setItem('user', JSON.stringify(user));
            
            set({ 
              user, 
              isAuthenticated: true, 
              error: null,
              loading: false 
            });
          } else {
            console.log('❌ Server auth failed');
            set({ 
              user: null, 
              isAuthenticated: false, 
              error: null,
              loading: false 
            });
          }
        } catch (error) {
          console.log('❌ Auth verification failed:', error);
          
          // 서버 인증 실패 시 로컬 상태 초기화
          sessionStorage.removeItem('user');
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            loading: false 
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