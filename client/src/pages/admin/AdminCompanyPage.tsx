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

interface Solution {
  id: string;
  solution_name: string;
  company_code: string;
  description?: string;
  version?: string;
  is_active?: boolean;
  created_at?: string;
}

interface CompanyFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const CompanyForm: React.FC<CompanyFormProps & { initial?: Company | null }> = ({ onSuccess, onClose, initial }) => {
  const [form, setForm] = useState({
    company_name: initial?.company_name || '',
    company_info: initial?.company_info || '',
    company_type: initial?.company_type || '',
    industry_type: initial?.industry_type || '',
    founded_at: initial?.founded_at || '',
    is_active: initial?.is_active ?? true,
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
    if (initial) {
      await axios.put(`/companies/${initial.company_id}`, form);
      alert('수정되었습니다.');
    } else {
      await axios.post('/companies', form);
      alert('등록되었습니다.');
    }
    onSuccess();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold mb-2">{initial ? '기업 수정' : '기업 등록'}</h2>
      <div>
        <label className="block mb-1">이름</label>
        <input name="company_name" value={form.company_name} onChange={handleChange} className="w-full border px-2 py-1" required />
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
      <div className="flex gap-2 pt-2">
        <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">{initial ? '수정' : '등록'}</button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">닫기</button>
      </div>
    </form>
  );
};

const AdminCompanyPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionForm, setSolutionForm] = useState({ solution_name: '', description: '', version: '' });

  const fetchCompanies = async () => {
    const res = await axios.get('/companies');
    setCompanies(res.data);
  };

  const fetchSolutions = async (company_code: string) => {
    const res = await axios.get(`/solutions?company_code=${company_code}`);
    setSolutions(res.data);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await axios.delete(`/companies/${id}`);
    fetchCompanies();
  };

  const handleExpand = (company: Company) => {
    if (expandedCompanyId === company.company_id) {
      setExpandedCompanyId(null);
      setSolutions([]);
    } else {
      setExpandedCompanyId(company.company_id);
      fetchSolutions(company.company_code);
    }
  };

  const handleSolutionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSolutionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSolutionSubmit = async (company: Company, e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/solutions', {
      solution_name: solutionForm.solution_name,
      company_code: company.company_code,
      description: solutionForm.description,
      version: solutionForm.version,
    });
    setSolutionForm({ solution_name: '', description: '', version: '' });
    fetchSolutions(company.company_code);
  };

  const filteredCompanies = companies.filter(c =>
    !search || c.company_name?.includes(search) || c.industry_type?.includes(search)
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🏢 기업관리</h1>
      {/* 검색/필터 영역 */}
      <div className="mb-4 flex gap-2">
        <input className="border p-2 rounded w-64" placeholder="기업명, 업종 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={fetchCompanies}>새로고침</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => { setSelectedCompany(null); setShowModal(true); }}>기업 등록</button>
      </div>
      {/* 기업 목록 테이블 */}
      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-3 text-center">이름</th>
              <th className="py-2 px-3 text-center">업종</th>
              <th className="py-2 px-3 text-center">설립일</th>
              <th className="py-2 px-3 text-center">활성</th>
              <th className="py-2 px-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">기업이 없습니다.</td></tr>
            ) : filteredCompanies.map(c => (
              <React.Fragment key={c.company_id}>
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-3 text-center cursor-pointer text-blue-600 underline" onClick={() => handleExpand(c)}>{c.company_name}</td>
                  <td className="py-2 px-3 text-center">{c.industry_type}</td>
                  <td className="py-2 px-3 text-center">{c.founded_at}</td>
                  <td className="py-2 px-3 text-center">{c.is_active ? 'Y' : 'N'}</td>
                  <td className="py-2 px-3 text-center">
                    <button className="text-green-500 hover:text-green-700 mx-1" onClick={() => { setSelectedCompany(c); setShowModal(true); }}>수정</button>
                    <button className="text-red-500 hover:text-red-700 mx-1" onClick={() => handleDelete(c.company_id)}>삭제</button>
                  </td>
                </tr>
                {expandedCompanyId === c.company_id && (
                  <tr>
                    <td colSpan={5}>
                      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-4">
                        <div className="font-bold text-xl mb-4 flex items-center gap-2">
                          <span className="text-blue-600">🧩</span> 솔루션 목록
                        </div>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-blue-50 text-blue-800">
                                <th className="py-3 px-4 text-center">ID</th>
                                <th className="py-3 px-4 text-center">이름</th>
                                <th className="py-3 px-4 text-center">버전</th>
                                <th className="py-3 px-4 text-center">설명</th>
                                <th className="py-3 px-4 text-center">등록일</th>
                              </tr>
                            </thead>
                            <tbody>
                              {solutions.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="text-center text-gray-400 py-6">솔루션이 없습니다.</td>
                                </tr>
                              ) : solutions.map(s => (
                                <tr key={s.id} className="hover:bg-blue-50 transition">
                                  <td className="py-2 px-4 text-center font-mono">{s.id}</td>
                                  <td className="py-2 px-4 text-center">{s.solution_name}</td>
                                  <td className="py-2 px-4 text-center">{s.version}</td>
                                  <td className="py-2 px-4">{s.description}</td>
                                  <td className="py-2 px-4 text-center">{s.created_at?.slice(0, 10)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <form className="flex flex-wrap gap-4 items-end mt-6 border-t pt-6" onSubmit={e => handleSolutionSubmit(c, e)}>
                          <div className="flex flex-col flex-1 min-w-[120px]">
                            <label className="text-xs mb-1 text-gray-600">솔루션명</label>
                            <input className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-300" name="solution_name" value={solutionForm.solution_name} onChange={handleSolutionFormChange} placeholder="솔루션명" required />
                          </div>
                          <div className="flex flex-col w-28">
                            <label className="text-xs mb-1 text-gray-600">버전</label>
                            <input className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-300" name="version" value={solutionForm.version} onChange={handleSolutionFormChange} placeholder="버전" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-[120px]">
                            <label className="text-xs mb-1 text-gray-600">설명</label>
                            <input className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-300" name="description" value={solutionForm.description} onChange={handleSolutionFormChange} placeholder="설명" />
                          </div>
                          <button className="bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition" type="submit">
                            등록
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
            <CompanyForm
              onSuccess={fetchCompanies}
              onClose={() => setShowModal(false)}
              initial={selectedCompany}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompanyPage; 