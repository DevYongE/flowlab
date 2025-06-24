import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AdminCompanyPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const navigate = useNavigate();

  const fetchCompanies = async () => {
    const res = await axios.get('/api/companies');
    setCompanies(res.data);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await axios.delete(`/api/companies/${id}`);
    fetchCompanies();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">기업 관리</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => navigate('/admin/companies/new')}
      >
        기업 등록
      </button>
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
                  onClick={() => navigate(`/admin/companies/${c.company_id}`)}
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