import MainLayout from '../../components/layout/MainLayout';
import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { FaUserEdit, FaTrash, FaKey, FaExchangeAlt, FaUserTie, FaInfoCircle, FaPlus } from 'react-icons/fa';
import AdminCompanyPage from './AdminCompanyPage';

const TABS = [
  { key: 'users', label: '회원관리' },
  { key: 'roles', label: '권한관리' },
  { key: 'companies', label: '기업관리' },
];

const AdminUserPage = () => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  // 드롭다운 목록용 상태
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [showDept, setShowDept] = useState(false);
  const [showPosition, setShowPosition] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // 선택된 기업/부서/직급 상태
  const [selectedCompanyCode, setSelectedCompanyCode] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCompanies(); // 전체 기업 목록 불러오기
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (err) {
      alert('회원 목록을 불러오지 못했습니다.');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/roles');
      setRoles(res.data);
    } catch (err) {
      setRoles([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      setCompanies([]);
    }
  };

  const fetchDepartments = async (companyCode: string) => {
    if (!companyCode) {
      setDepartments([]);
      return;
    }
    try {
      const res = await axios.get(`/departments?company_code=${companyCode}`);
      setDepartments(res.data);
    } catch (err) {
      setDepartments([]);
    }
  };

  const fetchPositions = async (companyCode: string) => {
    if (!companyCode) {
      setPositions([]);
      return;
    }
    try {
      const res = await axios.get(`/positions?company_code=${companyCode}`);
      setPositions(res.data);
    } catch (err) {
      setPositions([]);
    }
  };

  const handleOpen = (type: string, user: any) => {
    setSelectedUser(user);
    if (type === 'detail') setShowDetail(true);
    if (type === 'edit') {
      if(user.company_code) {
        setSelectedCompanyCode(user.company_code);
        fetchDepartments(user.company_code);
        fetchPositions(user.company_code);
      } else {
        setSelectedCompanyCode('');
        setDepartments([]);
        setPositions([]);
      }
      setShowEdit(true);
    }
    if (type === 'role') setShowRole(true);
    if (type === 'dept') setShowDept(true);
    if (type === 'position') setShowPosition(true);
  };
  const handleClose = () => {
    setShowDetail(false);
    setShowEdit(false);
    setShowRole(false);
    setShowDept(false);
    setShowPosition(false);
    setSelectedUser(null);
    setSelectedCompanyCode('');
  };

  // 검색 필터링
  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.includes(search) ||
    u.email?.includes(search) ||
    u.id?.includes(search)
  );

  // 삭제 핸들러(더미)
  const handleDelete = (user: any) => {
    if (window.confirm(`${user.name} 회원을 삭제하시겠습니까?`)) {
      alert('삭제 API 연동 필요');
      // 추후: axios.delete(`/users/${user.id}`) ...
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">👤 관리자</h1>
        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`px-4 py-2 rounded-t-md font-semibold border-b-2 ${tab === t.key ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-400 bg-gray-100'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* 탭별 내용 */}
        {tab === 'users' && (
          <>
            {/* 검색/필터 영역 */}
            <div className="mb-4 flex gap-2">
              <input className="border p-2 rounded w-64" placeholder="이름, 이메일, ID 검색" value={search} onChange={e => setSearch(e.target.value)} />
              <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={fetchUsers}>새로고침</button>
            </div>
            {/* 회원 목록 테이블 */}
            <div className="bg-white rounded shadow p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-center">아이디</th>
                    <th className="py-2 px-3 text-center">이름</th>
                    <th className="py-2 px-3 text-center">이메일</th>
                    <th className="py-2 px-3 text-center">부서</th>
                    <th className="py-2 px-3 text-center">직급</th>
                    <th className="py-2 px-3 text-center">권한</th>
                    <th className="py-2 px-3 text-center">상태</th>
                    <th className="py-2 px-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-gray-400 py-8">회원이 없습니다.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-center">{user.id}</td>
                      <td className="py-2 px-3 text-center">{user.name}</td>
                      <td className="py-2 px-3 text-center">{user.email}</td>
                      <td className="py-2 px-3 text-center">{user.department_name || user.department}</td>
                      <td className="py-2 px-3 text-center">{user.position_name || user.position_code}</td>
                      <td className="py-2 px-3 text-center">{user.role_name || user.role_code}</td>
                      <td className="py-2 px-3 text-center">{user.status || (user.is_active ? '활성' : '비활성')}</td>
                      <td className="py-2 px-3 text-center">
                        <button title="상세" className="text-blue-500 hover:text-blue-700 mx-1" onClick={() => handleOpen('detail', user)}><FaInfoCircle /></button>
                        <button title="수정" className="text-green-500 hover:text-green-700 mx-1" onClick={() => handleOpen('edit', user)}><FaUserEdit /></button>
                        <button title="삭제" className="text-red-500 hover:text-red-700 mx-1" onClick={() => handleDelete(user)}><FaTrash /></button>
                        <button title="권한부여" className="text-purple-500 hover:text-purple-700 mx-1" onClick={() => handleOpen('role', user)}><FaKey /></button>
                        <button title="부서이동" className="text-yellow-600 hover:text-yellow-800 mx-1" onClick={() => handleOpen('dept', user)}><FaExchangeAlt /></button>
                        <button title="직급관리" className="text-pink-500 hover:text-pink-700 mx-1" onClick={() => handleOpen('position', user)}><FaUserTie /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 상세 모달 */}
            {showDetail && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
                  <h2 className="text-lg font-bold mb-2">회원 상세</h2>
                  <div>이름: {selectedUser.name}</div>
                  <div>이메일: {selectedUser.email}</div>
                  <div>부서: {selectedUser.department || selectedUser.department_name}</div>
                  <div>직급: {selectedUser.position || selectedUser.position_name}</div>
                  <div>권한: {selectedUser.role || selectedUser.role_code}</div>
                  <div>상태: {selectedUser.status || (selectedUser.is_active ? '활성' : '비활성')}</div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">닫기</button>
                  </div>
                </div>
              </div>
            )}
            {/* 수정 모달 */}
            {showEdit && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  const company_code = (form.elements.namedItem('company_code') as HTMLSelectElement).value;
                  const department = (form.elements.namedItem('department') as HTMLSelectElement).value;
                  const position_code = (form.elements.namedItem('position_code') as HTMLSelectElement).value;
                  
                  try {
                    await axios.patch(`/users/${selectedUser.id}`, { name, email, department, position_code, company_code });
                    await fetchUsers();
                    handleClose();
                  } catch (err) {
                    alert('회원 정보 수정 실패');
                  }
                }}>
                  <h2 className="text-lg font-bold mb-2">회원 정보 수정</h2>
                  <input name="name" className="w-full border rounded p-2" defaultValue={selectedUser.name} placeholder="이름" />
                  <input name="email" className="w-full border rounded p-2" defaultValue={selectedUser.email} placeholder="이메일" />

                  <label className="block text-sm">기업</label>
                  <select
                    name="company_code"
                    className="w-full border rounded p-2"
                    value={selectedCompanyCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedCompanyCode(code);
                      fetchDepartments(code);
                      fetchPositions(code);
                    }}
                  >
                    <option value="">기업 선택</option>
                    {companies.map((c: any) => (
                      <option key={c.company_code} value={c.company_code}>{c.company_name}</option>
                    ))}
                  </select>
                  
                  <label className="block text-sm">부서</label>
                  <select name="department" className="w-full border rounded p-2" defaultValue={selectedUser.department}>
                    <option value="">부서 선택</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.department_name}>{d.department_name}</option>
                    ))}
                  </select>
                  
                  <label className="block text-sm">직급</label>
                  <select
                    name="position_code"
                    className="w-full border rounded p-2"
                    value={selectedUser.position_code || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, position_code: e.target.value })}
                  >
                    <option value="">직급 선택</option>
                    {positions.map((pos: any) => (
                      <option key={pos.position_code} value={pos.position_code}>{pos.name}</option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">취소</button>
                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">저장</button>
                  </div>
                </form>
              </div>
            )}
            {/* 권한 부여 모달 */}
            {showRole && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const role_code = (form.elements.namedItem('role_code') as HTMLSelectElement).value;
                  try {
                    await axios.patch(`/users/${selectedUser.id}/role`, { role_code });
                    await fetchUsers();
                    handleClose();
                  } catch (err) {
                    alert('권한 변경 실패');
                  }
                }}>
                  <h2 className="text-lg font-bold mb-2">권한 부여</h2>
                  <select name="role_code" className="w-full border rounded p-2" defaultValue={selectedUser.role_code || selectedUser.role}>
                    {roles.map((role: any) => (
                      <option key={role.role_code} value={role.role_code}>{role.name}</option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">취소</button>
                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">저장</button>
                  </div>
                </form>
              </div>
            )}
            {/* 부서 이동 모달 */}
            {showDept && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
                  <h2 className="text-lg font-bold mb-2">부서 이동</h2>
                  <select className="w-full border rounded p-2" defaultValue={selectedUser.department || selectedUser.department_name}>
                    <option value="개발팀">개발팀</option>
                    <option value="기획팀">기획팀</option>
                    <option value="디자인팀">디자인팀</option>
                  </select>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">취소</button>
                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">저장</button>
                  </div>
                </form>
              </div>
            )}
            {/* 직급 관리 모달 */}
            {showPosition && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const position_code = (form.elements.namedItem('position_code') as HTMLSelectElement).value;
                  try {
                    await axios.patch(`/users/${selectedUser.id}/position`, { position_code });
                    await fetchUsers();
                    handleClose();
                  } catch (err) {
                    alert('직급 변경 실패');
                  }
                }}>
                  <h2 className="text-lg font-bold mb-2">직급 관리</h2>
                  <select name="position_code" className="w-full border rounded p-2" defaultValue={selectedUser.position_code || selectedUser.position || selectedUser.position_name}>
                    {positions.map((pos: any) => (
                      <option key={pos.position_code} value={pos.position_code}>{pos.name}</option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">취소</button>
                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">저장</button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
        {/* 기업관리 탭 내용 */}
        {tab === 'companies' && (
          <div className="bg-white rounded shadow p-4">
            <AdminCompanyPage />
          </div>
        )}
        {tab === 'roles' && (
          <div className="bg-white rounded shadow p-4 mb-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaKey /> 권한관리</h2>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-3 text-center">역할명</th>
                  <th className="py-2 px-3 text-center">설명</th>
                  <th className="py-2 px-3 text-center">권한</th>
                  <th className="py-2 px-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role: any) => (
                  <tr key={role.role_code} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-center">{role.name}</td>
                    <td className="py-2 px-3 text-center">{role.description || '-'}</td>
                    <td className="py-2 px-3 text-center">{role.permissions || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <button title="수정" className="text-green-500 hover:text-green-700 mx-1"><FaUserEdit /></button>
                      <button title="삭제" className="text-red-500 hover:text-red-700 mx-1"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form className="flex gap-2 items-center">
              <input className="border p-2 rounded w-64" placeholder="역할명" />
              <input className="border p-2 rounded w-64" placeholder="설명" />
              <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-1"><FaPlus /> 추가</button>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminUserPage; 