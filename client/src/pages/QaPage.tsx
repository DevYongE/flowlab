import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, SortDesc, HelpCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import QaCard from '../components/qa/QaCard';
import QaQuestionModal from '../components/qa/QaQuestionModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from '../lib/axios';
import { getCurrentUser } from '../lib/auth';

interface Question {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  tags: string[];
  authorName: string;
  projectName: string;
  viewCount: number;
  voteCount: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
}

const QaPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  // 통계 상태
  const [stats, setStats] = useState({
    totalQuestions: 0,
    openQuestions: 0,
    resolvedQuestions: 0,
    myQuestions: 0
  });

  useEffect(() => {
    fetchQuestions();
    fetchProjects();
    fetchStats();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/qa/questions', {
        params: {
          search: searchTerm,
          project: selectedProject,
          category: selectedCategory,
          status: selectedStatus,
          sort: sortBy
        }
      });
      setQuestions(response.data);
    } catch (error) {
      console.error('질문 목록 조회 실패:', error);
      alert('질문 목록을 불러오는데 실패했습니다.');
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

  const fetchStats = async () => {
    try {
      const response = await axios.get('/qa/stats');
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const handleSearch = () => {
    fetchQuestions();
  };

  const handleQuestionSubmit = async (questionData: any) => {
    try {
      if (editingQuestion) {
        await axios.put(`/qa/questions/${editingQuestion.id}`, questionData);
        alert('질문이 수정되었습니다.');
      } else {
        await axios.post('/qa/questions', questionData);
        alert('질문이 등록되었습니다.');
      }
      setShowQuestionModal(false);
      setEditingQuestion(null);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      console.error('질문 저장 실패:', error);
      alert('질문 저장에 실패했습니다.');
    }
  };

  const handleQuestionClick = (question: Question) => {
    navigate(`/qa/questions/${question.id}`);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !selectedProject || question.projectName === selectedProject;
    const matchesCategory = !selectedCategory || question.category === selectedCategory;
    const matchesStatus = !selectedStatus || question.status === selectedStatus;
    
    return matchesSearch && matchesProject && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QA 게시판</h1>
              <p className="text-gray-600">프로젝트 관련 질문과 답변을 공유하세요</p>
            </div>
          </div>
          <Button
            onClick={() => setShowQuestionModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            질문 등록
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</p>
                  <p className="text-sm text-gray-600">전체 질문</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.openQuestions}</p>
                  <p className="text-sm text-gray-600">미해결 질문</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedQuestions}</p>
                  <p className="text-sm text-gray-600">해결된 질문</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.myQuestions}</p>
                  <p className="text-sm text-gray-600">내 질문</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              검색 및 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 검색 */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="질문 제목이나 내용을 검색하세요..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleSearch}>검색</Button>
              </div>

              {/* 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">전체 프로젝트</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">전체 카테고리</option>
                    <option value="TECH">기술</option>
                    <option value="SCHEDULE">일정</option>
                    <option value="REQUIREMENT">요구사항</option>
                    <option value="GENERAL">일반</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">전체 상태</option>
                    <option value="OPEN">미해결</option>
                    <option value="IN_PROGRESS">진행중</option>
                    <option value="RESOLVED">해결됨</option>
                    <option value="CLOSED">종료됨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="latest">최신순</option>
                    <option value="oldest">오래된순</option>
                    <option value="most_voted">추천순</option>
                    <option value="most_viewed">조회순</option>
                    <option value="most_answered">답변순</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 질문 목록 */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">질문이 없습니다</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedProject || selectedCategory || selectedStatus
                    ? '검색 조건에 맞는 질문이 없습니다.'
                    : '첫 번째 질문을 등록해보세요!'}
                </p>
                <Button onClick={() => setShowQuestionModal(true)}>
                  질문 등록하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => (
              <QaCard
                key={question.id}
                question={question}
                onClick={() => handleQuestionClick(question)}
              />
            ))
          )}
        </div>

        {/* 질문 등록/수정 모달 */}
        <QaQuestionModal
          isOpen={showQuestionModal}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
          onSubmit={handleQuestionSubmit}
          editingQuestion={editingQuestion}
          projects={projects}
        />
      </div>
    </MainLayout>
  );
};

export default QaPage; 