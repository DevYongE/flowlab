import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from '../lib/axios';

interface Project {
  id: number;
  category: string; // SI, 센트릭, 기타
  type: string; // 신규, 추가, 완료, 실패
  name: string;
  startDate: string;
  endDate: string;
  progress: number; // 0 ~ 100
}

const ProjectListPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/projects')
      .then((res) => setProjects(res.data))
      .catch(() => alert('프로젝트 목록을 불러올 수 없습니다.'));
  }, []);

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">🧱 프로젝트 목록</h1>
        <Button onClick={() => navigate('/projects/new')}>+ 프로젝트 등록</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-center w-16">번호</th>
                  <th className="px-6 py-3">구분</th>
                  <th className="px-6 py-3">유형</th>
                  <th className="px-6 py-3">프로젝트명</th>
                  <th className="px-6 py-3">기간</th>
                  <th className="px-6 py-3 w-48">진행률</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map((proj, idx) => (
                  <tr key={proj.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">{idx + 1}</td>
                    <td className="px-6 py-4">{proj.category}</td>
                    <td className="px-6 py-4">{proj.type}</td>
                    <td className="px-6 py-4">
                      <span 
                        className="cursor-pointer hover:text-blue-600 hover:underline font-medium"
                        onClick={() => navigate(`/projects/${proj.id}`)}
                      >
                        {proj.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{proj.startDate} ~ {proj.endDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${proj.progress}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{proj.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ProjectListPage;
