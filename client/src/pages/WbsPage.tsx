import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';

const WbsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">잘못된 프로젝트 ID입니다.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🗂️ WBS 보드</h1>
            <p className="text-gray-600">프로젝트 #{projectId}의 작업 분할 구조</p>
          </div>
          <button
            onClick={() => navigate('/wbs')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            ← 프로젝트 목록
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <WbsBoard projectId={projectId} />
        </div>
      </div>
    </MainLayout>
  );
};

export default WbsPage; 