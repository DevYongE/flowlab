import React, { useState, useEffect } from 'react';
import { X, Upload, Tag, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface QaQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: any) => void;
  editingQuestion?: any;
  projects: Array<{ id: number; name: string }>;
}

const QaQuestionModal: React.FC<QaQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingQuestion,
  projects
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    projectId: '',
    tags: [] as string[],
    attachments: [] as File[]
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        title: editingQuestion.title || '',
        content: editingQuestion.content || '',
        category: editingQuestion.category || 'GENERAL',
        priority: editingQuestion.priority || 'NORMAL',
        projectId: editingQuestion.projectId || '',
        tags: editingQuestion.tags || [],
        attachments: []
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'NORMAL',
        projectId: '',
        tags: [],
        attachments: []
      });
    }
    setErrors({});
  }, [editingQuestion, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));
    }
  };

  const handleFileRemove = (fileToRemove: File) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(file => file !== fileToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }
    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    }
    if (!formData.projectId) {
      newErrors.projectId = '프로젝트를 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">
              {editingQuestion ? '질문 수정' : '새 질문 등록'}
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
              {errors.projectId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.projectId}
                </p>
              )}
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
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
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
                rows={8}
                placeholder="질문 내용을 상세히 입력하세요"
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.content}
                </p>
              )}
            </div>

            {/* 태그 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="태그를 입력하세요"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagAdd();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTagAdd}
                  className="flex items-center gap-1"
                >
                  <Tag className="w-4 h-4" />
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

            {/* 파일 첨부 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                파일 첨부
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    파일을 선택하거나 여기에 드래그하세요
                  </span>
                </label>
              </div>
              {formData.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(file)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="default"
              >
                {editingQuestion ? '수정' : '등록'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QaQuestionModal; 