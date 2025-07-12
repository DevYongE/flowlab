import { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/auth';
import { useGlobalStore } from './store/global';

// 지연 로딩을 위한 동적 import
import { lazy } from 'react';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// 인증 관련 페이지 (즉시 로딩)
import LoginPage from './pages/LoginPage';

// 메인 페이지들 (지연 로딩)
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NoticePage = lazy(() => import('./pages/NoticePage'));
const NoticeFormPage = lazy(() => import('./pages/NoticeFormPage'));
const NoticeDetailPage = lazy(() => import('./pages/NoticeDetailPage'));
const ProjectListPage = lazy(() => import('./pages/ProjectListPage'));
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const WbsMainPage = lazy(() => import('./pages/WbsMainPage'));
const WbsPage = lazy(() => import('./pages/WbsPage'));
const QaPage = lazy(() => import('./pages/QaPage'));
const QaDetailPage = lazy(() => import('./pages/QaDetailPage'));
const QaEditPage = lazy(() => import('./pages/QaEditPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));
const BoardDetailPage = lazy(() => import('./pages/BoardDetailPage'));
const BoardWritePage = lazy(() => import('./pages/BoardWritePage'));
const BoardEditPage = lazy(() => import('./pages/BoardEditPage'));
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage'));

export default function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { isOnline } = useGlobalStore();

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <div className="App">
        {/* 오프라인 상태 표시 */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
            인터넷 연결을 확인해주세요. 오프라인 상태입니다.
          </div>
        )}
        
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {isAuthenticated ? (
              <Route path="*" element={
                <ErrorBoundary fallback={
                  <div className="p-8 text-center">
                    <h2 className="text-xl font-semibold mb-4">페이지를 불러올 수 없습니다</h2>
                    <p className="text-gray-600 mb-4">잠시 후 다시 시도해주세요.</p>
                  </div>
                }>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/notices" element={<NoticePage />} />
                      <Route path="/notices/new" element={<NoticeFormPage />} />
                      <Route path="/notices/edit/:id" element={<NoticeFormPage />} />
                      <Route path="/notices/detail/:id" element={<NoticeDetailPage />} />
                      <Route path="/projects" element={<ProjectListPage />} />
                      <Route path="/projects/new" element={<ProjectFormPage />} />
                      <Route path="/projects/edit/:id" element={<ProjectFormPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailPage />} />
                      <Route path="/wbs" element={<WbsMainPage />} />
                      <Route path="/projects/:id/wbs" element={<WbsPage />} />
                      <Route path="/qa" element={<QaPage />} />
                      <Route path="/qa/questions/:id" element={<QaDetailPage />} />
                      <Route path="/qa/questions/:id/edit" element={<QaEditPage />} />
                      <Route path="/board" element={<BoardPage />} />
                      <Route path="/board/:id" element={<BoardDetailPage />} />
                      <Route path="/board/write" element={<BoardWritePage />} />
                      <Route path="/board/edit/:id" element={<BoardEditPage />} />
                      <Route path="/admin/users" element={<AdminUserPage />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              } />
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Suspense>
        
        {/* 토스트 알림 컨테이너 */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              fontSize: '14px',
              fontWeight: '500',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
