// client/src/store/global.ts
import { create } from 'zustand';

interface GlobalState {
  loading: boolean;
  error: string | null;
  success: string | null;
  isOnline: boolean;
  theme: 'light' | 'dark';
}

interface GlobalActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setOnline: (isOnline: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearMessages: () => void;
}

export type GlobalStore = GlobalState & GlobalActions;

export const useGlobalStore = create<GlobalStore>((set) => ({
  // 초기 상태
  loading: false,
  error: null,
  success: null,
  isOnline: navigator.onLine,
  theme: 'light',

  // 액션
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error, loading: false }),
  
  setSuccess: (success) => set({ success, loading: false }),
  
  setOnline: (isOnline) => set({ isOnline }),
  
  setTheme: (theme) => set({ theme }),
  
  clearMessages: () => set({ error: null, success: null }),
}));

// 네트워크 상태 감지
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useGlobalStore.getState().setOnline(true);
  });
  
  window.addEventListener('offline', () => {
    useGlobalStore.getState().setOnline(false);
  });
} 