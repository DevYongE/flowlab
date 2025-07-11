import React from 'react';
import { MessageSquare, ThumbsUp, Eye, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface QaCardProps {
  question: {
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
  };
  onClick: () => void;
}

const QaCard: React.FC<QaCardProps> = ({ question, onClick }) => {
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
      case 'OPEN': return <AlertTriangle className="w-3 h-3" />;
      case 'IN_PROGRESS': return <Clock className="w-3 h-3" />;
      case 'RESOLVED': return <CheckCircle className="w-3 h-3" />;
      case 'CLOSED': return <CheckCircle className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
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

  return (
    <div 
      className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
      onClick={onClick}
    >
      <Card>
        <CardContent className="p-4">
        {/* 헤더 - 상태, 우선순위, 카테고리 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}>
              {getStatusIcon(question.status)}
              <span className="ml-1">{question.status}</span>
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(question.priority)}`}>
              {question.priority}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
              {question.category}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(question.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {question.title}
        </h3>

        {/* 내용 미리보기 */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {question.content}
        </p>

        {/* 태그 */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {question.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border"
              >
                #{tag}
              </span>
            ))}
            {question.tags.length > 5 && (
              <span className="text-xs text-gray-500">
                +{question.tags.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* 푸터 - 통계 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{question.viewCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span>{question.voteCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{question.answerCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">프로젝트:</span>
            <span className="text-xs font-medium text-blue-600">{question.projectName}</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs font-medium">{question.authorName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default QaCard; 