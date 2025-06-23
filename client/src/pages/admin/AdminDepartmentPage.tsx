import MainLayout from '../../components/layout/MainLayout';

const AdminDepartmentPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">🏢 부서관리</h1>
        {/* 부서 목록 */}
        <div className="bg-white rounded shadow p-4 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>부서명</th>
                <th>설명</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {/* 부서 데이터 map으로 렌더링 */}
              <tr>
                <td>개발팀</td>
                <td>서비스 개발 담당</td>
                <td>
                  <button className="text-green-500 mr-2">수정</button>
                  <button className="text-red-500">삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* 부서 추가 폼 */}
        <div className="bg-gray-50 rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">부서 추가</h2>
          <form className="flex gap-2">
            <input className="border p-2 rounded w-64" placeholder="부서명" />
            <input className="border p-2 rounded w-64" placeholder="설명" />
            <button className="bg-blue-500 text-white px-4 py-2 rounded">추가</button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDepartmentPage; 