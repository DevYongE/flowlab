// client/src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import axios from '../lib/axios';
import { handleApiError, showSuccessToast } from '../lib/error';
import { useAuthStore } from '../store/auth';
import type { User } from '../types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ id: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!form.id || !form.password) {
      handleApiError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const res = await axios.post('/auth/login', form);
      
      if (res.data.success) {
        const user: User = res.data.user;
        
        // 사용자 정보를 sessionStorage에 저장 (하위 호환성)
        sessionStorage.setItem('user', JSON.stringify(user));
        
        // Zustand 스토어에 로그인 상태 저장
        login(user);
        
        showSuccessToast('로그인되었습니다.');
        
        // 쿠키 설정을 위해 잠시 대기 후 이동
        setTimeout(() => {
          // 쿠키가 설정되었는지 확인
          const accessToken = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
          const refreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='));
          
          console.log('🍪 Login success - Cookie check:', {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            allCookies: document.cookie
          });
          
          navigate('/dashboard');
        }, 500);
      } else {
        handleApiError(res.data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      handleApiError(error, '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96 shadow-2xl rounded-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🚀 FlowLab</h1>
            <p className="text-gray-600">프로젝트 관리 시스템</p>
          </div>
          
          <div className="space-y-4">
            <Input
              name="id"
              placeholder="아이디"
              value={form.id}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Input
              name="password"
              type="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                회원가입
              </button>
            </p>
            <p className="text-sm">
              <button
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                비밀번호 찾기
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
