import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from '../lib/axios';
import { getCurrentUser, isAdmin } from '../lib/auth';

interface Question {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  tags: string[];
  projectId: number;
  authorId: string;
}

interface Project {
  id: number;
  name: string;
}

const QaEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    projectId: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (id) {
      fetchQuestion();
      fetchProjects();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`/qa/questions/${id}`);
      const questionData = response.data.question;
      
      // 권한 체크
      if (!isAdmin() && currentUser?.id !== questionData.authorId) {
        alert('질문을 수정할 권한이 없습니다.');
        navigate('/qa');
        return;
      }
      
      setQuestion(questionData);
      setFormData({
        title: questionData.title || '',
        content: questionData.content || '',
        category: questionData.category || 'GENERAL',
        priority: questionData.priority || 'NORMAL',
        projectId: questionData.projectId?.toString() || '',
        tags: questionData.tags || []
      });
    } catch (error) {
      console.error('질문 조회 실패:', error);
      alert('질문을 불러오는데 실패했습니다.');
      navigate('/qa');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    
    if (!formData.projectId) {
      alert('프로젝트를 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`/qa/questions/${id}`, {
        ...formData,
        projectId: parseInt(formData.projectId)
      });
      alert('질문이 수정되었습니다.');
      navigate(`/qa/questions/${id}`);
    } catch (error) {
      console.error('질문 수정 실패:', error);
      alert('질문 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!question) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">질문을 찾을 수 없습니다</h1>
            <Button onClick={() => navigate('/qa')}>QA 게시판으로 돌아가기</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/qa/questions/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            질문으로 돌아가기
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/qa/questions/${id}`)}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 질문 수정 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>질문 수정</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 프로젝트 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 <span className="text-red-500">*</span>
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">프로젝트를 선택하세요</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="질문 제목을 입력하세요"
                  className="w-full"
                />
              </div>

              {/* 카테고리 및 우선순위 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GENERAL">일반</option>
                    <option value="TECH">기술</option>
                    <option value="SCHEDULE">일정</option>
                    <option value="REQUIREMENT">요구사항</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    우선순위
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">낮음</option>
                    <option value="NORMAL">보통</option>
                    <option value="HIGH">높음</option>
                  </select>
                </div>
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={12}
                  placeholder="질문 내용을 상세히 입력하세요"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="태그를 입력하세요"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTagAdd}
                  >
                    추가
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default QaEditPage; 