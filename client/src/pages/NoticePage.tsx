import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from '../lib/axios';
import { isAdmin } from '../lib/auth';
import { handleApiError, showSuccessToast } from '../lib/error';

interface Notice {
  notice_id: number;
  title: string;
  author: string;
  author_name?: string;
  created_at: string;
  views: number;
  is_pinned?: boolean;
  notice_type?: string;
}

const NoticePage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const adminStatus = isAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

  useEffect(() => {
    // URL에서 'selected' 파라미터를 읽어와서 상태 업데이트
    const params = new URLSearchParams(location.search);
    const selectedId = params.get('selected');
    if (selectedId) {
      const noticeId = Number(selectedId);
      setSelectedNoticeId(noticeId);
      
      // 선택된 항목으로 스크롤
      setTimeout(() => {
        const element = document.getElementById(`notice-${noticeId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [location.search]);

  useEffect(() => {
    axios
      .get(`/notices?limit=${pageSize}`)
      .then((res) => {
        console.log('📢 공지사항 목록 로딩 성공:', res.data);
        setNotices(res.data);
      })
      .catch((error) => {
        console.error('📢 공지사항 목록 로딩 실패:', error);
        handleApiError(error, '공지사항을 불러오지 못했습니다.');
      });
  }, [pageSize]);

  // 공지사항 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      console.log('🗑️ 공지사항 삭제 요청:', id);
      
      const response = await axios.delete(`/notices/${id}`);
      console.log('🗑️ 삭제 응답:', response.data);
      
      if (response.data.success) {
        // 성공적으로 삭제된 경우 목록에서 제거
        setNotices(notices.filter(n => n.notice_id !== id));
        showSuccessToast('공지사항이 성공적으로 삭제되었습니다.');
      } else {
        handleApiError('삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('🗑️ 삭제 실패:', error);
      handleApiError(error, '공지사항 삭제에 실패했습니다.');
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📢 공지사항</h1>
        {adminStatus && <Button className="ml-auto" onClick={() => navigate('/notices/new')}>글쓰기</Button>}
      </div>

      <div className="mb-4 flex justify-end">
        <label className="mr-2 text-sm">페이지당</label>
        <select
          className="border px-2 py-1 rounded text-sm"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={10}>10개</option>
          <option value={20}>20개</option>
          <option value={50}>50개</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left border-t">
            <thead className="bg-gray-100 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-2 w-16 text-center">번호</th>
                <th className="px-4 py-2">제목</th>
                <th className="px-4 py-2 w-32">글쓴이</th>
                <th className="px-4 py-2 w-40">날짜</th>
                <th className="px-4 py-2 w-20 text-center">조회수</th>
                {adminStatus && <th className="px-4 py-2 w-24 text-center">관리</th>}
              </tr>
            </thead>
            <tbody>
              {notices.map((notice, idx) => (
                <tr 
                  key={notice.notice_id} 
                  id={`notice-${notice.notice_id}`}
                  className={`border-b transition-colors ${notice.notice_id === selectedNoticeId ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-2 text-center">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      {notice.is_pinned && (
                        <span className="text-red-500 text-sm">📌</span>
                      )}
                      <span 
                        className="cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => navigate(`/notices/detail/${notice.notice_id}`)}
                      >
                        {notice.title}
                      </span>
                      {notice.notice_type && notice.notice_type !== 'general' && (
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          notice.notice_type === 'important' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {notice.notice_type === 'important' ? '중요' : '긴급'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">{notice.author_name || notice.author}</td>
                  <td className="px-4 py-2">{new Date(notice.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-center">{notice.views}</td>
                  {adminStatus && (
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center items-center space-x-3">
                        <button
                          onClick={() => navigate(`/notices/edit/${notice.notice_id}`)}
                          className="text-lg text-gray-500 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(notice.notice_id)}
                          className="text-lg text-gray-500 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default NoticePage;
