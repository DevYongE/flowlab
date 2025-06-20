// client/src/lib/auth.ts

// Admin 권한 체크 함수
export const isAdmin = (): boolean => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  return user?.role_code === 'ADMIN';
};

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
  return JSON.parse(sessionStorage.getItem('user') || '{}');
};

// 로그인 상태 체크
export const isLoggedIn = (): boolean => {
  return !!sessionStorage.getItem('token');
}; 