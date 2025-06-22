import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NoticePage from './pages/NoticePage';
import NoticeFormPage from './pages/NoticeFormPage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import RegisterPage from './pages/RegisterPage';
import WbsPage from './pages/WbsPage';
import WbsMainPage from './pages/WbsMainPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  // ✅ sessionStorage의 토큰 유무로 초기값 설정
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!sessionStorage.getItem('token'));

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {isLoggedIn ? (
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notices" element={<NoticePage />} />
          <Route path="/notices/new" element={<NoticeFormPage />} />
          <Route path="/notices/edit/:id" element={<NoticeFormPage />} />
          <Route path="/notices/detail/:id" element={<NoticeDetailPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/edit/:id" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/wbs" element={<WbsPage />} />
          <Route path="/wbs" element={<WbsMainPage />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
