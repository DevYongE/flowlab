import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';

interface Company {
  company_id: string;
  company_name: string;
  company_code: string;
  company_info?: string;
  company_type?: string;
  industry_type?: string;
  founded_at?: string;
  registered_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

interface CompanyFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState({
    company_name: '',
    company_code: '',
    company_info: '',
    company_type: '',
    industry_type: '',
    founded_at: '',
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/companies', form);
    alert('등록되었습니다.');
    onSuccess();
    onClose();
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">기업 등록</h1>
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
          <button type="button" className="ml-2 px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            닫기
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminCompanyPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchCompanies = async () => {
    const res = await axios.get('/companies');
    setCompanies(res.data);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await axios.delete(`/companies/${id}`);
    fetchCompanies();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">기업 관리</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowModal(true)}
      >
        기업 등록
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg">
            <CompanyForm onSuccess={fetchCompanies} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
      <table className="w-full border">
        <thead>
          <tr>
            <th>이름</th>
            <th>코드</th>
            <th>업종</th>
            <th>설립일</th>
            <th>활성</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.company_id} className="border-t">
              <td>{c.company_name}</td>
              <td>{c.company_code}</td>
              <td>{c.industry_type}</td>
              <td>{c.founded_at}</td>
              <td>{c.is_active ? 'Y' : 'N'}</td>
              <td>
                <button
                  className="mr-2 px-2 py-1 bg-green-500 text-white rounded"
                  onClick={() => window.location.href = `/admin/companies/${c.company_id}`}
                >수정</button>
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={() => handleDelete(c.company_id)}
                >삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCompanyPage; 