import MainLayout from '../../components/layout/MainLayout';

const AdminUserPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">👤 회원관리</h1>
        {/* 검색/필터 영역 */}
        <div className="mb-4 flex gap-2">
          <input className="border p-2 rounded w-64" placeholder="이름, 이메일, ID 검색" />
          <button className="bg-blue-500 text-white px-4 py-2 rounded">검색</button>
        </div>
        {/* 회원 목록 테이블 */}
        <div className="bg-white rounded shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>부서</th>
                <th>권한</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {/* 회원 데이터 map으로 렌더링 */}
              <tr>
                <td>홍길동</td>
                <td>hong@company.com</td>
                <td>개발팀</td>
                <td>관리자</td>
                <td>활성</td>
                <td>
                  <button className="text-blue-500 mr-2">상세</button>
                  <button className="text-green-500 mr-2">수정</button>
                  <button className="text-red-500">삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminUserPage; 