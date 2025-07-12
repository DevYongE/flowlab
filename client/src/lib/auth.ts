// client/src/lib/auth.ts
import Cookies from 'js-cookie';
import axios from './axios';

// Admin 권한 체크 함수
export const isAdmin = (): boolean => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  return user?.role_code === 'ADMIN';
};

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
  return JSON.parse(sessionStorage.getItem('user') || '{}');
};

// 로그인 상태 체크 (쿠키 기반 + 하위 호환성)
export const isLoggedIn = (): boolean => {
  // 쿠키에서 토큰 확인
  const hasCookieToken = Cookies.get('accessToken');
  
  // 하위 호환성을 위해 sessionStorage도 확인
  const hasSessionToken = sessionStorage.getItem('token');
  
  return !!(hasCookieToken || hasSessionToken);
};

// 로그아웃 함수
export const logout = async (): Promise<void> => {
  try {
    // 서버에 로그아웃 요청 (쿠키 제거)
    await axios.post('/auth/logout');
  } catch (error) {
    console.error('로그아웃 요청 실패:', error);
  } finally {
    // 로컬 스토리지 정리
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // 페이지 리로드 또는 로그인 페이지로 이동
    window.location.href = '/login';
  }
};

// 토큰 갱신 함수
export const refreshToken = async (): Promise<boolean> => {
  try {
    await axios.post('/auth/refresh');
    return true;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return false;
  }
}; 