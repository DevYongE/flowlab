// client/src/lib/axios.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://211.188.55.145:4000/api',
  withCredentials: true, // 중요
});

// 요청 인터셉터 추가
instance.interceptors.request.use(
  (config) => {
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

export default instance;
