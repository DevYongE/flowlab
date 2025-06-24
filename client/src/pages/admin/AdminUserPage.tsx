import MainLayout from '../../components/layout/MainLayout';
import { useState, useEffect } from 'react';
import axios from '../../lib/axios';

const AdminUserPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [showDept, setShowDept] = useState(false);
  const [showPosition, setShowPosition] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // 실제 회원 목록 불러오기
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (err) {
      alert('회원 목록을 불러오지 못했습니다.');
    }
  };

  const handleOpen = (type: string, user: any) => {
    setSelectedUser(user);
    if (type === 'detail') setShowDetail(true);
    if (type === 'edit') setShowEdit(true);
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
        <h1 className="text-2xl font-bold mb-6">👤 회원관리</h1>
        {/* 검색/필터 영역 */}
        <div className="mb-4 flex gap-2">
          <input className="border p-2 rounded w-64" placeholder="이름, 이메일, ID 검색" value={search} onChange={e => setSearch(e.target.value)} />
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={fetchUsers}>새로고침</button>
        </div>
        {/* 회원 목록 테이블 */}
        <div className="bg-white rounded shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>부서</th>
                <th>직급</th>
                <th>권한</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">회원이 없습니다.</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.department || user.department_name}</td>
                  <td>{user.position || user.position_name}</td>
                  <td>{user.role || user.role_code}</td>
                  <td>{user.status || (user.is_active ? '활성' : '비활성')}</td>
                  <td>
                    <button className="text-blue-500 mr-2" onClick={() => handleOpen('detail', user)}>상세</button>
                    <button className="text-green-500 mr-2" onClick={() => handleOpen('edit', user)}>수정</button>
                    <button className="text-red-500 mr-2" onClick={() => handleDelete(user)}>삭제</button>
                    <button className="text-purple-500 mr-2" onClick={() => handleOpen('role', user)}>권한부여</button>
                    <button className="text-yellow-600 mr-2" onClick={() => handleOpen('dept', user)}>부서이동</button>
                    <button className="text-pink-500" onClick={() => handleOpen('position', user)}>직급관리</button>
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
            <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
              <h2 className="text-lg font-bold mb-2">회원 정보 수정</h2>
              <input className="w-full border rounded p-2" defaultValue={selectedUser.name} placeholder="이름" />
              <input className="w-full border rounded p-2" defaultValue={selectedUser.email} placeholder="이메일" />
              <input className="w-full border rounded p-2" defaultValue={selectedUser.department || selectedUser.department_name} placeholder="부서" />
              <input className="w-full border rounded p-2" defaultValue={selectedUser.position || selectedUser.position_name} placeholder="직급" />
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
            <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
              <h2 className="text-lg font-bold mb-2">권한 부여</h2>
              <select className="w-full border rounded p-2" defaultValue={selectedUser.role || selectedUser.role_code}>
                <option value="ADMIN">관리자</option>
                <option value="BASIC">일반</option>
                <option value="GUEST">게스트</option>
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
            <form className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
              <h2 className="text-lg font-bold mb-2">직급 관리</h2>
              <select className="w-full border rounded p-2" defaultValue={selectedUser.position || selectedUser.position_name}>
                <option value="사원">사원</option>
                <option value="주임">주임</option>
                <option value="대리">대리</option>
                <option value="과장">과장</option>
                <option value="차장">차장</option>
                <option value="팀장">팀장</option>
                <option value="이사">이사</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">취소</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">저장</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminUserPage; 