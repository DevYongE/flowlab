// client/src/lib/axios.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import { showErrorToast } from './error';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://flowlab-api.onrender.com/api',
  withCredentials: true, // 쿠키 포함하여 요청
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 하위 호환성을 위해 Authorization 헤더도 유지
instance.interceptors.request.use(
  (config) => {
    // sessionStorage에 토큰이 있다면 Authorization 헤더에 추가 (하위 호환성)
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 시 토큰 갱신 시도
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 네트워크 오류 처리
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        showErrorToast('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.message === 'Network Error') {
        showErrorToast('네트워크 연결을 확인해주세요.');
      } else {
        showErrorToast('서버에 연결할 수 없습니다.');
      }
      return Promise.reject(error);
    }
    
    // 401 에러 시 토큰 갱신 시도
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 토큰 갱신 시도
        await instance.post('/auth/refresh');
        
        // 원래 요청 재시도
        return instance(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃 처리
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // 로그인 페이지로 리다이렉트
        if (window.location.pathname !== '/login') {
          showErrorToast('인증이 만료되었습니다. 다시 로그인해주세요.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // 기타 HTTP 에러는 각 컴포넌트에서 처리하도록 전달
    return Promise.reject(error);
  }
);

export default instance;
