import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import axios from '../lib/axios';
import { getCurrentUser } from '../lib/auth';

interface NoticeForm {
  title: string;
  content: string;
  is_pinned: boolean;
  notice_type: string;
}

const NoticeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 수정 시 공지사항 ID
  const user = getCurrentUser();
  const isEdit = !!id;

  const [form, setForm] = useState<NoticeForm>({
    title: '',
    content: '',
    is_pinned: false,
    notice_type: 'general'
  });

  const [loading, setLoading] = useState(false);

  // 수정 시 기존 데이터 로드
  useEffect(() => {
    if (isEdit) {
      loadNotice();
    }
  }, [id]);

  const loadNotice = async () => {
    try {
      const response = await axios.get(`/notices/${id}`);
      const notice = response.data;
      setForm({
        title: notice.title,
        content: notice.content,
        is_pinned: notice.is_pinned,
        notice_type: notice.notice_type
      });
    } catch (error) {
      alert('공지사항을 불러올 수 없습니다.');
      navigate('/notices');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const noticeData = {
        ...form,
        author_id: user.id
      };

      if (isEdit) {
        await axios.put(`/notices/${id}`, noticeData);
        alert('공지사항이 수정되었습니다.');
      } else {
        await axios.post('/notices', noticeData);
        alert('공지사항이 등록되었습니다.');
      }
      
      navigate('/notices');
    } catch (error: any) {
      alert(error.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성을 취소하시겠습니까?')) {
      navigate('/notices');
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? '📝 공지사항 수정' : '📝 공지사항 작성'}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="공지사항 제목을 입력하세요"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              공지 유형
            </label>
            <select
              name="notice_type"
              value={form.notice_type}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="general">일반</option>
              <option value="important">중요</option>
              <option value="urgent">긴급</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="공지사항 내용을 입력하세요"
              className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_pinned"
              checked={form.is_pinned}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              상단 고정
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '저장 중...' : (isEdit ? '수정' : '등록')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default NoticeFormPage; 