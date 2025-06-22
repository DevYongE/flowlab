// client/src/pages/LoginPage.tsx
import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios'; 


interface Props {
  onLogin: () => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ id: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      console.log(form);
      const res = await axios.post('/auth/login', form);
      const { token, user } = res.data;
      sessionStorage.setItem('token', token); // ✅ 로그인 유지: 브라우저 살아있을 동안만
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user)); // ✅ 유저 정보 저장
      }
      onLogin();
      navigate('/dashboard'); // ✅ 로그인 후 이동 추가
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인 실패');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[420px] shadow-2xl rounded-2xl">
        <CardContent className="p-8 space-y-5">
          <h1 className="text-2xl font-bold text-center">🔐 로그인</h1>
          <Input
            name="id"
            placeholder="이메일 또는 아이디"
            className="rounded-xl"
            value={form.id}
            onChange={handleChange}
          />
          <Input
            name="password"
            placeholder="비밀번호"
            type="password"
            className="rounded-xl"
            value={form.password}
            onChange={handleChange}
          />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div 
            className="text-sm text-right text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate('/forgot-password')}
          >
            비밀번호/아이디 찾기
          </div>
          <Button className="w-full rounded-xl text-lg" onClick={handleLogin}>로그인</Button>
          <div className="text-center text-sm text-gray-500">
            회원이 아니신가요?{' '}
            <span
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={() => navigate('/register')}
            >
              회원가입
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
