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
  assignedUsers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

// 프로젝트 유형 한글 변환 함수
const getTypeText = (type: string) => {
  switch (type) {
    case 'NEW': return '신규';
    case 'ADD': return '추가';
    case 'COMPLETE': return '완료';
    case 'FAIL': return '실패';
    default: return type;
  }
};

// 프로젝트 구분 한글 변환 함수
const getCategoryText = (category: string) => {
  switch (category) {
    case 'SI': return 'SI';
    case 'CENTRIC': return '센트릭';
    case 'ETC': return '기타';
    default: return category;
  }
};

const ProjectListPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/projects');
        if (Array.isArray(res.data)) {
          // 각 프로젝트의 할당된 사용자 정보도 함께 가져오기
          const projectsWithAssignees = await Promise.all(
            res.data.map(async (project: Project) => {
              try {
                const assigneesRes = await axios.get(`/projects/${project.id}/assignees`);
                return {
                  ...project,
                  assignedUsers: assigneesRes.data || []
                };
              } catch (error) {
                return {
                  ...project,
                  assignedUsers: []
                };
              }
            })
          );
          setProjects(projectsWithAssignees);
        } else {
          setProjects([]);
          console.error('프로젝트 목록 응답이 배열이 아님:', res.data);
        }
      } catch (error) {
        alert('프로젝트 목록을 불러올 수 없습니다.');
      }
    };

    fetchProjects();
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
                  <th className="px-6 py-3">할당된 사용자</th>
                  <th className="px-6 py-3 w-32">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Array.isArray(projects) ? projects : []).map((proj, idx) => (
                  <tr key={proj.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center">{idx + 1}</td>
                    <td className="px-6 py-4">{getCategoryText(proj.category)}</td>
                    <td className="px-6 py-4">{getTypeText(proj.type)}</td>
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
                    <td className="px-6 py-4">
                      {proj.assignedUsers && proj.assignedUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {proj.assignedUsers.slice(0, 2).map(user => (
                            <span key={user.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {user.name}
                            </span>
                          ))}
                          {proj.assignedUsers.length > 2 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              +{proj.assignedUsers.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">할당 없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          className="text-xs"
                        >
                          상세
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/projects/${proj.id}#assign`)}
                          className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          할당
                        </Button>
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
