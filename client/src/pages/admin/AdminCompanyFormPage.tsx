import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../lib/axios';

interface CompanyForm {
  company_name: string;
  company_code: string;
  company_info?: string;
  company_type?: string;
  industry_type?: string;
  founded_at?: string;
  is_active?: boolean;
}

const AdminCompanyFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<CompanyForm>({
    company_name: '',
    company_code: '',
    company_info: '',
    company_type: '',
    industry_type: '',
    founded_at: '',
    is_active: true,
  });

  useEffect(() => {
    if (id && id !== 'new') {
      axios.get(`/api/companies/${id}`).then((res) => {
        setForm({
          company_name: res.data.company_name,
          company_code: res.data.company_code,
          company_info: res.data.company_info,
          company_type: res.data.company_type,
          industry_type: res.data.industry_type,
          founded_at: res.data.founded_at || '',
          is_active: res.data.is_active,
        });
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && id !== 'new') {
      await axios.put(`/api/companies/${id}`, form);
      alert('수정되었습니다.');
    } else {
      await axios.post('/api/companies', form);
      alert('등록되었습니다.');
    }
    navigate('/admin/companies');
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{id && id !== 'new' ? '기업 수정' : '기업 등록'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">이름</label>
          <input name="company_name" value={form.company_name} onChange={handleChange} className="w-full border px-2 py-1" required />
        </div>
        <div>
          <label className="block mb-1">코드</label>
          <input name="company_code" value={form.company_code} onChange={handleChange} className="w-full border px-2 py-1" required />
        </div>
        <div>
          <label className="block mb-1">업종</label>
          <input name="industry_type" value={form.industry_type} onChange={handleChange} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1">설립일</label>
          <input name="founded_at" type="date" value={form.founded_at} onChange={handleChange} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1">회사 정보</label>
          <textarea name="company_info" value={form.company_info} onChange={handleChange} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1">회사 유형</label>
          <input name="company_type" value={form.company_type} onChange={handleChange} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="inline-flex items-center">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            <span className="ml-2">활성</span>
          </label>
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            저장
          </button>
          <button type="button" className="ml-2 px-4 py-2 bg-gray-300 rounded" onClick={() => navigate('/admin/companies')}>
            목록
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCompanyFormPage; 