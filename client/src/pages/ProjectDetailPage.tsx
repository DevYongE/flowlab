// pages/ProjectDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import axios from '../lib/axios';
import { getCurrentUser, isAdmin } from '../lib/auth';

interface DevNote {
  id: number;
  content: string;
  registeredAt: string;
  deadline: string | null;
  status: string;
  progress: number;
  authorName: string;
  author_id: string;
}

interface Project {
  id: number;
  category: string;
  type: string;
  name: string;
  author_id: string;
  startDate: string;
  endDate: string;
  os: string;
  memory: string;
  details: {
    java_version: string;
    spring_version: string;
    react_version: string;
    vue_version: string;
    tomcat_version: string;
    centric_version: string;
  };
  devNotes: DevNote[];
}

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<DevNote | null>(null);
  const [newNote, setNewNote] = useState({ content: '', deadline: '', status: 'TODO', progress: 0 });
  const currentUser = getCurrentUser();

  const fetchProject = async () => {
    try {
      const res = await axios.get<Project>(`/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      console.error('프로젝트 정보를 가져오는데 실패했습니다.', error);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingNote) {
      setEditingNote(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setNewNote(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content) {
      alert('내용을 입력하세요.');
      return;
    }
    try {
      await axios.post(`/projects/${id}/notes`, newNote);
      setNewNote({ content: '', deadline: '', status: 'TODO', progress: 0 });
      setShowModal(false);
      fetchProject();
    } catch (error) {
      console.error('노트 추가 실패:', error);
      alert('노트 추가에 실패했습니다.');
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    
    try {
      await axios.put(`/projects/notes/${editingNote.id}`, editingNote);
      alert('업데이트 되었습니다.');
      setEditingNote(null);
      setShowModal(false);
      fetchProject();
    } catch (error) {
      console.error('노트 업데이트 실패:', error);
      alert('노트 업데이트에 실패했습니다.');
    }
  };
  
  const handleDeleteNote = async (noteId: number) => {
    if (window.confirm('정말로 이 노트를 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/projects/notes/${noteId}`);
        fetchProject();
      } catch (error) {
        console.error('노트 삭제 실패:', error);
        alert('노트 삭제에 실패했습니다.');
      }
    }
  };

  const handleProjectDelete = async () => {
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/projects/${project?.id}`);
        alert('프로젝트가 삭제되었습니다.');
        navigate('/projects');
      } catch (error) {
        console.error('프로젝트 삭제 실패:', error);
      }
    }
  };

  const openEditModal = (note: DevNote) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingNote(null);
    setNewNote({ content: '', deadline: '', status: 'TODO', progress: 0 });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO': return 'Todo';
      case 'IN_PROGRESS': return 'In Progress';
      case 'DONE': return 'Done';
      default: return status;
    }
  };

  if (!project) return <div>로딩 중...</div>;
  
  const canEditProject = isAdmin() || currentUser?.id === project.author_id;

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        {/* 프로젝트 상세 정보 */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {canEditProject && (
              <div className="flex gap-2">
                <button onClick={() => navigate(`/projects/edit/${project.id}`)} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                  수정
                </button>
                <button onClick={handleProjectDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  삭제
                </button>
              </div>
            )}
          </div>
          
          {/* 프로젝트 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">구분:</span>
              <p className="font-medium">{project.category}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">유형:</span>
              <p className="font-medium">{project.type}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">운영체제:</span>
              <p className="font-medium">{project.os}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">메모리:</span>
              <p className="font-medium">{project.memory}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">시작일:</span>
              <p className="font-medium">{project.startDate}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">종료일:</span>
              <p className="font-medium">{project.endDate}</p>
            </div>
          </div>

          {/* 버전 정보 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">버전 정보</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <span className="text-sm text-gray-600">Java:</span>
                <p className="font-medium">{project.details?.java_version || '-'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <span className="text-sm text-gray-600">Spring:</span>
                <p className="font-medium">{project.details?.spring_version || '-'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <span className="text-sm text-gray-600">React:</span>
                <p className="font-medium">{project.details?.react_version || '-'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <span className="text-sm text-gray-600">Vue:</span>
                <p className="font-medium">{project.details?.vue_version || '-'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <span className="text-sm text-gray-600">Tomcat:</span>
                <p className="font-medium">{project.details?.tomcat_version || '-'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <span className="text-sm text-gray-600">Centric:</span>
                <p className="font-medium">{project.details?.centric_version || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Todo List</h2>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/projects/${id}/wbs`)}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                WBS 보기
              </button>
              <button onClick={openAddModal} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Todo 추가
              </button>
            </div>
          </div>
          
          {/* Todo 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">내용</th>
                  <th className="py-2 px-4 border-b">등록일</th>
                  <th className="py-2 px-4 border-b">마감일</th>
                  <th className="py-2 px-4 border-b">작성자</th>
                  <th className="py-2 px-4 border-b">상태</th>
                  <th className="py-2 px-4 border-b">진행률</th>
                  <th className="py-2 px-4 border-b">관리</th>
                </tr>
              </thead>
              <tbody>
                {project.devNotes.map((note) => {
                  const canEditNote = isAdmin() || currentUser?.id === note.author_id;
                  return (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">
                        <div className="max-w-xs truncate" title={note.content}>
                          {note.content}
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b text-center text-sm">{note.registeredAt}</td>
                      <td className="py-3 px-4 border-b text-center text-sm">
                        {note.deadline ? note.deadline.split('T')[0] : '-'}
                      </td>
                      <td className="py-3 px-4 border-b text-center text-sm">{note.authorName}</td>
                      <td className="py-3 px-4 border-b text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded ${getStatusColor(note.status)}`}>
                          {getStatusText(note.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${note.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{note.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b text-center">
                        {canEditNote && (
                          <div className="flex gap-1 justify-center">
                            <button 
                              onClick={() => openEditModal(note)} 
                              className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                              수정
                            </button>
                            <button 
                              onClick={() => handleDeleteNote(note.id)} 
                              className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingNote ? 'Todo 수정' : 'Todo 추가'}
              </h3>
              <form onSubmit={editingNote ? handleUpdateNote : handleAddNote}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <input 
                      type="text" 
                      name="content" 
                      value={editingNote ? editingNote.content : newNote.content} 
                      onChange={handleNoteChange} 
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                    <input 
                      type="date" 
                      name="deadline" 
                      value={editingNote ? (editingNote.deadline?.split('T')[0] || '') : newNote.deadline} 
                      onChange={handleNoteChange} 
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select 
                      name="status" 
                      value={editingNote ? editingNote.status : newNote.status} 
                      onChange={handleNoteChange} 
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="TODO">Todo</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">진행률 (%)</label>
                    <input 
                      type="number" 
                      name="progress" 
                      min="0" 
                      max="100" 
                      value={editingNote ? editingNote.progress : newNote.progress} 
                      onChange={handleNoteChange} 
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {editingNote ? '수정' : '추가'}
                  </button>
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProjectDetailPage;
