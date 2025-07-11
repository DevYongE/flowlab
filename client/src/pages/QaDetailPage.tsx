import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Calendar,
  User,
  Tag,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from '../lib/axios';
import { getCurrentUser, isAdmin } from '../lib/auth';

interface Question {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  tags: string[];
  authorName: string;
  authorId: string;
  projectName: string;
  projectId: number;
  viewCount: number;
  voteCount: number;
  acceptedAnswerId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Answer {
  id: number;
  content: string;
  isAccepted: boolean;
  voteCount: number;
  authorName: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

const QaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuestionDetail();
    }
  }, [id]);

  const fetchQuestionDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/qa/questions/${id}`);
      setQuestion(response.data.question);
      setAnswers(response.data.answers || []);
      setUserVotes(response.data.userVotes || {});
    } catch (error) {
      console.error('질문 상세 조회 실패:', error);
      alert('질문을 불러오는데 실패했습니다.');
      navigate('/qa');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 'question' | 'answer', targetId: number, voteType: 'UP' | 'DOWN') => {
    try {
      const endpoint = type === 'question' 
        ? `/qa/questions/${targetId}/vote`
        : `/qa/answers/${targetId}/vote`;
      
      await axios.post(endpoint, { voteType });
      fetchQuestionDetail(); // 투표 후 데이터 새로고침
    } catch (error) {
      console.error('투표 처리 실패:', error);
      alert('투표 처리에 실패했습니다.');
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
      await axios.put(`/qa/answers/${answerId}/adopt`);
      alert('답변이 채택되었습니다.');
      fetchQuestionDetail();
    } catch (error) {
      console.error('답변 채택 실패:', error);
      alert('답변 채택에 실패했습니다.');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirm('정말로 이 질문을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/qa/questions/${id}`);
      alert('질문이 삭제되었습니다.');
      navigate('/qa');
    } catch (error) {
      console.error('질문 삭제 실패:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!confirm('정말로 이 답변을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/qa/answers/${answerId}`);
      alert('답변이 삭제되었습니다.');
      fetchQuestionDetail();
    } catch (error) {
      console.error('답변 삭제 실패:', error);
      alert('답변 삭제에 실패했습니다.');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/qa/questions/${id}/answers`, { content: newAnswer });
      alert('답변이 등록되었습니다.');
      setNewAnswer('');
      fetchQuestionDetail();
    } catch (error) {
      console.error('답변 등록 실패:', error);
      alert('답변 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.put(`/qa/questions/${id}/status`, { status: newStatus });
      alert('상태가 변경되었습니다.');
      fetchQuestionDetail();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4" />;
      case 'CLOSED': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TECH': return 'bg-purple-100 text-purple-800';
      case 'SCHEDULE': return 'bg-orange-100 text-orange-800';
      case 'REQUIREMENT': return 'bg-indigo-100 text-indigo-800';
      case 'GENERAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEditQuestion = () => {
    return isAdmin() || (currentUser && currentUser.id === question?.authorId);
  };

  const canAcceptAnswer = () => {
    return currentUser && currentUser.id === question?.authorId;
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
            onClick={() => navigate('/qa')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            QA 게시판으로 돌아가기
          </button>
          {canEditQuestion() && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/qa/questions/${id}/edit`)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                수정
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteQuestion}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </div>
          )}
        </div>

        {/* 질문 상세 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}>
                  {getStatusIcon(question.status)}
                  <span className="ml-1">{question.status}</span>
                </span>
                {canEditQuestion() && (
                  <select
                    value={question.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-white hover:bg-gray-50"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                )}
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(question.priority)}`}>
                {question.priority}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
                {question.category}
              </span>
            </div>
            <CardTitle className="text-2xl font-bold">{question.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{question.authorName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>조회 {question.viewCount}</span>
              </div>
              <div className="text-blue-600 font-medium">
                프로젝트: {question.projectName}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-4">
              <p className="whitespace-pre-wrap text-gray-700">{question.content}</p>
            </div>

            {/* 태그 */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 border"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 투표 버튼 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote('question', question.id, 'UP')}
                className={`flex items-center gap-1 ${
                  userVotes[`question_${question.id}`] === 'UP' ? 'bg-green-100 border-green-300' : ''
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{question.voteCount}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote('question', question.id, 'DOWN')}
                className={`flex items-center gap-1 ${
                  userVotes[`question_${question.id}`] === 'DOWN' ? 'bg-red-100 border-red-300' : ''
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 답변 목록 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            답변 ({answers.length})
          </h2>
          
          {answers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 답변이 없습니다</h3>
                <p className="text-gray-600">첫 번째 답변을 작성해보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <Card key={answer.id} className={`${answer.isAccepted ? 'border-green-300 bg-green-50' : ''}`}>
                  <CardContent className="p-4">
                    {answer.isAccepted && (
                      <div className="flex items-center gap-2 mb-3 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">채택된 답변</span>
                      </div>
                    )}
                    
                    <div className="prose max-w-none mb-4">
                      <p className="whitespace-pre-wrap text-gray-700">{answer.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote('answer', answer.id, 'UP')}
                            className={`flex items-center gap-1 ${
                              userVotes[`answer_${answer.id}`] === 'UP' ? 'bg-green-100 border-green-300' : ''
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{answer.voteCount}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote('answer', answer.id, 'DOWN')}
                            className={`flex items-center gap-1 ${
                              userVotes[`answer_${answer.id}`] === 'DOWN' ? 'bg-red-100 border-red-300' : ''
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {canAcceptAnswer() && !answer.isAccepted && question.status !== 'RESOLVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptAnswer(answer.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            채택하기
                          </Button>
                        )}
                        
                        {/* 답변 수정/삭제 버튼 (작성자 또는 관리자) */}
                        {(isAdmin() || currentUser?.id === answer.authorId) && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // 답변 수정 기능 (향후 구현)
                                alert('답변 수정 기능은 추후 구현 예정입니다.');
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnswer(answer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{answer.authorName}</span>
                        <span>•</span>
                        <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 답변 작성 */}
        <Card>
          <CardHeader>
            <CardTitle>답변 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="답변을 작성해주세요..."
                rows={8}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !newAnswer.trim()}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      답변 등록 중...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      답변 등록
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default QaDetailPage; 