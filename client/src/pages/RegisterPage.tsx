// client/src/pages/RegisterPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import axios from '../lib/axios'; 

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    email: '',
    birth: '',
    name: '',
    position: '',
    department: '',
    joinDate: '',
  });
  const [positions, setPositions] = useState<{ position_code: string; name: string }[]>([]);
  const [idCheck, setIdCheck] = useState<{ checked: boolean; exists: boolean }>({ checked: false, exists: false });

  useEffect(() => {
    axios.get('/positions')
      .then(res => setPositions(res.data))
      .catch(err => console.error('직책 불러오기 실패:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, id: value });
    setIdCheck({ checked: false, exists: false });
    if (value) {
      try {
        const res = await axios.get(`/users/check-id?id=${value}`);
        setIdCheck({ checked: true, exists: res.data.exists });
      } catch {
        setIdCheck({ checked: true, exists: false });
      }
    }
  };

const handleRegister = async () => {
  const {
    id, password, confirmPassword, email,
    birth, name, department, joinDate, position
  } = form;

  const missingFields: string[] = [];

  if (!id) missingFields.push('아이디');
  if (!password) missingFields.push('비밀번호');
  if (!confirmPassword) missingFields.push('비밀번호 확인');
  if (!email) missingFields.push('이메일');
  if (!birth) missingFields.push('생년월일');
  if (!name) missingFields.push('이름');
  if (!department) missingFields.push('부서');
  if (!joinDate) missingFields.push('입사일자');
  if (!position) missingFields.push('직책');

  if (missingFields.length > 0) {
    alert(`${missingFields.join(', ')} 입력해주세요.`);
    return;
  }

  if (password !== confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  try {
    await axios.post('/users/register', {
      ...form,
      join_date: joinDate,
      position_code: position,
    });
    alert('회원가입 완료! 로그인 페이지로 이동합니다.');
    navigate('/login');
  } catch (err: any) {
    console.error('회원가입 실패:', err);
    alert(err.response?.data?.message || '회원가입 실패');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[500px] shadow-2xl rounded-2xl">
        <CardContent className="p-8 space-y-4">
          <h1 className="text-2xl font-bold text-center">📝 회원가입</h1>
          <Input name="id" placeholder="아이디" value={form.id} onChange={handleIdChange} />
          {idCheck.checked && idCheck.exists && (
            <div className="text-red-500 text-sm">이미 사용 중인 아이디입니다.</div>
          )}
          <Input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} />
          <Input name="confirmPassword" type="password" placeholder="비밀번호 확인" value={form.confirmPassword} onChange={handleChange} />
          <Input name="email" placeholder="이메일" value={form.email} onChange={handleChange} />
          <Input name="birth" placeholder="생년월일 (YYYY-MM-DD)" value={form.birth} onChange={handleChange} />
          <Input name="name" placeholder="이름" value={form.name} onChange={handleChange} />
          <select
            name="position"
            className="w-full p-2 rounded border border-gray-300"
            value={form.position}
            onChange={handleChange}
          >
            <option value="">직책 선택</option>
            {positions.map(pos => (
              <option key={pos.position_code} value={pos.position_code}>{pos.name}</option>
            ))}
          </select>
          <Input name="department" placeholder="부서명" value={form.department} onChange={handleChange} />
          <Input name="joinDate" placeholder="입사일자 (YYYY-MM)" value={form.joinDate} onChange={handleChange} />
          <Button className="w-full rounded-xl text-lg" onClick={handleRegister} disabled={idCheck.exists}>가입하기</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;