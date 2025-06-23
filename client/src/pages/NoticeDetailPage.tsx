import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from '../lib/axios';
import { isAdmin } from '../lib/auth';

interface Notice {
  notice_id: number;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  created_at: string;
  updated_at?: string;
  views: number;
  is_pinned: boolean;
  notice_type: string;
}

const NoticeDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const adminStatus = isAdmin();

  useEffect(() => {
    loadNotice();
  }, [id]);

  const loadNotice = async () => {
    try {
      const response = await axios.get(`/notices/${id}`);
      setNotice(response.data);
    } catch (error) {
      alert('공지사항을 불러올 수 없습니다.');
      navigate('/notices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await axios.delete(`/notices/${id}`);
      alert('공지사항이 삭제되었습니다.');
      navigate('/notices');
    } catch (error) {
      alert('삭제에 실패했습니다.');
    }
  };

  const getNoticeTypeLabel = (type: string) => {
    switch (type) {
      case 'important': return '중요';
      case 'urgent': return '긴급';
      default: return '일반';
    }
  };

  const getNoticeTypeColor = (type: string) => {
    switch (type) {
      case 'important': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </MainLayout>
    );
  }

  if (!notice) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">공지사항을 찾을 수 없습니다.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📢 공지사항</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate(`/notices?selected=${id}`)}
            className="bg-gray-500 hover:bg-gray-600"
          >
            목록
          </Button>
          {adminStatus && (
            <>
              <Button
                onClick={() => navigate(`/notices/edit/${id}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                수정
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-800">{notice.title}</h2>
              {notice.is_pinned && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                  📌 고정
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded ${getNoticeTypeColor(notice.notice_type)}`}>
                {getNoticeTypeLabel(notice.notice_type)}
              </span>
              <span>작성자: {notice.author_name || notice.author_id}</span>
              <span>작성일: {new Date(notice.created_at).toLocaleDateString()}</span>
              {notice.updated_at && (
                <span>수정일: {new Date(notice.updated_at).toLocaleDateString()}</span>
              )}
              <span>조회수: {notice.views}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {notice.content}
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default NoticeDetailPage; 