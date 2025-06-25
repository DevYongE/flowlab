import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from '../lib/axios';

const ProjectFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [form, setForm] = useState({
    category: 'SI',
    type: 'NEW',
    name: '',
    startDate: '',
    endDate: '',
    os: '',
    memory: '',
    javaVersion: '',
    springVersion: '',
    reactVersion: '',
    vueVersion: '',
    tomcatVersion: '',
    centricVersion: '',
  });

  const [loading, setLoading] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditMode) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/projects/${id}`);
      const project = response.data;
      
      setForm({
        category: project.category || 'SI',
        type: project.type || 'NEW',
        name: project.name || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        os: project.os || '',
        memory: project.memory || '',
        javaVersion: project.details?.java_version || '',
        springVersion: project.details?.spring_version || '',
        reactVersion: project.details?.react_version || '',
        vueVersion: project.details?.vue_version || '',
        tomcatVersion: project.details?.tomcat_version || '',
        centricVersion: project.details?.centric_version || '',
      });
    } catch (error) {
      console.error('프로젝트 정보 로드 실패:', error);
      alert('프로젝트 정보를 불러오는데 실패했습니다.');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!form.name.trim()) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    if (!form.startDate) {
      alert('시작일을 입력해주세요.');
      return;
    }
    if (!form.endDate) {
      alert('종료일을 입력해주세요.');
      return;
    }

    try {
      if (isEditMode) {
        await axios.put(`/projects/${id}`, form);
        alert('수정 완료');
      } else {
        await axios.post('/projects', form);
        alert('등록 완료');
      }
      navigate('/projects');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        (isEditMode ? '프로젝트 수정에 실패했습니다.' : '프로젝트 등록에 실패했습니다.');
      alert(errorMessage);
      console.error('프로젝트 처리 오류:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? '프로젝트 수정' : '+ 프로젝트 등록'}
        </h1>
        <Card>
          <CardContent className="space-y-6 p-6">
            {/* 기본 정보 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">프로젝트 구분 *</label>
                  <select 
                    name="category" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.category} 
                    onChange={handleChange}
                  >
                    <option value="SI">SI</option>
                    <option value="CENTRIC">센트릭</option>
                    <option value="ETC">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">프로젝트 유형 *</label>
                  <select 
                    name="type" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.type} 
                    onChange={handleChange}
                  >
                    <option value="NEW">신규</option>
                    <option value="ADD">추가</option>
                    <option value="COMPLETE">완료</option>
                    <option value="FAIL">실패</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">프로젝트명 *</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.name} 
                    onChange={handleChange}
                    placeholder="프로젝트명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">시작일 *</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.startDate} 
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">종료일 *</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.endDate} 
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">운영체제</label>
                  <input 
                    type="text" 
                    name="os" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.os} 
                    onChange={handleChange}
                    placeholder="예: Windows 10, Ubuntu 20.04"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">메모리</label>
                  <input 
                    type="text" 
                    name="memory" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={form.memory} 
                    onChange={handleChange}
                    placeholder="예: 8GB, 16GB"
                  />
                </div>
              </div>
            </div>

            {/* 버전 정보 */}
            {form.category === 'SI' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">버전 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Java 버전</label>
                    <input 
                      name="javaVersion" 
                      placeholder="예: 11, 17" 
                      value={form.javaVersion} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Spring 버전</label>
                    <input 
                      name="springVersion" 
                      placeholder="예: 2.7.0, 3.0.0" 
                      value={form.springVersion} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">React 버전</label>
                    <input 
                      name="reactVersion" 
                      placeholder="예: 18.0.0" 
                      value={form.reactVersion} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Vue 버전</label>
                    <input 
                      name="vueVersion" 
                      placeholder="예: 3.0.0" 
                      value={form.vueVersion} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Tomcat 버전</label>
                    <input 
                      name="tomcatVersion" 
                      placeholder="예: 9.0.0" 
                      value={form.tomcatVersion} 
                      onChange={handleChange} 
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    />
                  </div>
                </div>
              </div>
            )}

            {form.category === '센트릭' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">센트릭 버전 정보</h2>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">센트릭 소프트웨어 버전</label>
                  <input 
                    name="centricVersion" 
                    placeholder="센트릭 소프트웨어 버전을 입력하세요" 
                    value={form.centricVersion} 
                    onChange={handleChange} 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
              >
                {isEditMode ? '수정' : '등록'}
              </Button>
              <Button 
                onClick={() => navigate('/projects')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectFormPage;
