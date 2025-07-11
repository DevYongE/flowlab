import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import axios from '../lib/axios';

interface Project {
  id: number;
  name: string;
  category: string;
  type: string;
  startDate: string;
  endDate: string;
  author_id: string;
  company_code: string;
}

const WbsMainPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('프로젝트 목록을 가져오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId: number) => {
    navigate(`/wbs/${projectId}`);
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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗂️ WBS 보드</h1>
          <p className="text-gray-600">프로젝트를 선택하여 WBS 보드를 확인하세요.</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">등록된 프로젝트가 없습니다.</div>
            <button
              onClick={() => navigate('/projects/new')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              프로젝트 생성하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {project.category}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>유형:</span>
                      <span className="font-medium">{project.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>시작일:</span>
                      <span>{project.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>종료일:</span>
                      <span>{project.endDate}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                      WBS 보드 열기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WbsMainPage; 