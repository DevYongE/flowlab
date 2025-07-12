// client/src/test/utils.tsx
import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

// 테스트용 Provider 컴포넌트
const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

// 커스텀 render 함수
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });

// re-export everything
export * from '@testing-library/react';
export { customRender as render };

// 테스트용 모킹 함수들
export const mockUser = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  role_code: 'USER' as const,
  position_name: 'Developer',
  company_code: 'TEST_COMPANY',
};

export const mockAdmin = {
  id: 'admin-user',
  name: 'Admin User',
  email: 'admin@example.com',
  role_code: 'ADMIN' as const,
  position_name: 'Administrator',
  company_code: 'TEST_COMPANY',
};

export const mockProject = {
  id: 1,
  name: 'Test Project',
  category: 'SI' as const,
  type: 'NEW' as const,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  progress: 50,
  author_id: 'test-user',
  company_code: 'TEST_COMPANY',
};

export const mockNotice = {
  notice_id: 1,
  title: 'Test Notice',
  content: 'This is a test notice',
  author_id: 'test-user',
  author_name: 'Test User',
  is_pinned: false,
  notice_type: 'general' as const,
  views: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockPost = {
  id: 1,
  title: 'Test Post',
  content: 'This is a test post',
  category: 'free' as const,
  views: 0,
  likes: 0,
  is_pinned: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  authorName: 'Test User',
  author_id: 'test-user',
  commentCount: 0,
};

// 모킹 헬퍼 함수들
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
};

export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

export const mockSessionStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// 네비게이션 모킹
export const mockNavigate = vi.fn();

// API 응답 모킹
export const mockApiResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const mockApiError = (message: string, status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Error',
  },
  message,
});

// 테스트용 대기 함수
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)); 