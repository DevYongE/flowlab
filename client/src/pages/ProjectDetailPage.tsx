// pages/ProjectDetailPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare } from 'lucide-react';
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
  completedAt: string | null;
}

interface Comment {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
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
  company_code: string;
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
  const [newNote, setNewNote] = useState({ content: '', deadline: '', status: 'TODO', progress: 0, completedAt: '' as string | null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingProgressNoteId, setEditingProgressNoteId] = useState<number | null>(null);
  const [inlineProgressValue, setInlineProgressValue] = useState(0);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInputText, setAIInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DevNote | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getCurrentUser();
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
  const [recentlyUpdatedNoteId, setRecentlyUpdatedNoteId] = useState<number | null>(null);

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

  useEffect(() => {
    if (project && project.company_code) {
      axios.get(`/users?company_code=${project.company_code}`)
        .then(res => setCompanyUsers(res.data))
        .catch(() => setCompanyUsers([]));
      axios.get(`/projects/${project.id}/assignees`)
        .then(res => setAssignedUsers(res.data))
        .catch(() => setAssignedUsers([]));
    }
  }, [project]);

  // URL 해시 확인하여 할당 섹션으로 스크롤
  useEffect(() => {
    if (window.location.hash === '#assign') {
      const assignSection = document.getElementById('assign-section');
      if (assignSection) {
        assignSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [project]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value: rawValue } = e.target;

    let value: string | number = rawValue;
    if (name === 'progress') {
      value = parseInt(rawValue, 10);
      if (isNaN(value)) value = 0;
    }

    // prev.status와 prev.progress는 editingNote 또는 newNote의 현재 상태를 참조해야 합니다.
    // 여기서는 editingNote 또는 newNote의 현재 값을 사용하여 newStatus와 newProgress를 계산합니다.
    const currentStatus = editingNote ? editingNote.status : newNote.status;
    const currentProgress = editingNote ? editingNote.progress : newNote.progress;

    let newStatus = name === 'status' ? String(value) : currentStatus;
    let newProgress = name === 'progress' ? Number(value) : currentProgress;
    let newCompletedAt = editingNote ? editingNote.completedAt : newNote.completedAt;

    // completedAt 필드가 직접 변경된 경우
    if (name === 'completedAt') {
      newCompletedAt = value === '' ? null : String(value);
    } else if (name === 'status') {
      if (value === 'DONE') {
        newProgress = 100;
        newCompletedAt = new Date().toISOString().split('T')[0];
      } else if (value === 'TODO') {
        newProgress = 0;
        newCompletedAt = null;
      }
    } else if (name === 'progress') {
      if (value === 100) {
        newStatus = 'DONE';
        newCompletedAt = new Date().toISOString().split('T')[0];
      } else if (Number(value) > 0 && currentStatus === 'TODO') {
        newStatus = 'IN_PROGRESS';
        newCompletedAt = null;
      } else if (value === 0 && currentStatus !== 'TODO') {
        newStatus = 'TODO';
        newCompletedAt = null;
      }
    }

    if (editingNote) {
      setEditingNote(prev => prev ? { ...prev, [name]: value, status: newStatus, progress: newProgress, completedAt: newCompletedAt } : null);
    } else {
      setNewNote(prev => ({ ...prev, [name]: value, status: newStatus, progress: newProgress, completedAt: newCompletedAt }));
    }
  };
  
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content) {
      alert('내용을 입력하세요.');
      return;
    }
    try {
      await axios.post(`/projects/${id}/notes`, {
        ...newNote,
        status: newNote.status,
        completedAt: newNote.completedAt || null,
      });
      setNewNote({ content: '', deadline: '', status: 'TODO', progress: 0, completedAt: '' });
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
    if (window.confirm('정말로 이 요구사항을 삭제하시겠습니까?')) {
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
    setNewNote({ content: '', deadline: '', status: 'TODO', progress: 0, completedAt: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
  };

  const handleAIAssist = () => {
    setShowAIModal(true);
  };

  const handleAiAnalysis = async (text: string) => {
    try {
      setIsAnalyzing(true);
      const res = await axios.post(`/ai/analyze-dev-note`, { text });
      
      const newDevNotes = res.data.requirements; 

      if (Array.isArray(newDevNotes)) {
        for (const note of newDevNotes) {
          try {
            await axios.post(`/projects/${id}/notes`, {
              content: note.content,
              deadline: note.deadline ? note.deadline : null,
              status: 'TODO',
              progress: 0,
              parent_id: null,
              order: 0
            });
          } catch (err) {
            console.error('노트 생성 실패:', note, err);
            alert(`노트 생성 중 오류가 발생했습니다.\n내용: ${note.content}`);
            break;
          }
        }
      } else {
        console.error('AI 분석 결과가 배열이 아닙니다:', res.data);
      }

      setAIInputText('');
      setShowAIModal(false);
      fetchProject();
    } catch (error) {
      console.error('AI 분석 또는 요구사항 생성 실패:', error);
      // 사용자에게 에러 알림 UI 추가하면 좋음
    } finally {
      setIsAnalyzing(false);
    }
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
      case 'TODO': return '미결';
      case 'IN_PROGRESS': return '진행중';
      case 'DONE': return '완료';
      default: return status;
    }
  };

  // 필터링 및 정렬된 요구사항 목록
  const getFilteredAndSortedNotes = () => {
    if (!project) return [];
    
    let filteredNotes = project.devNotes.filter(note => {
      // 검색어 필터링
      const matchesSearch = (note.content ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (note.authorName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // 상태 필터링
      const matchesStatus = statusFilter === 'ALL' || note.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // 정렬: 진행중 -> 미완료 -> 완료 순서 (완료된 항목도 상단에 보이도록)
    filteredNotes.sort((a, b) => {
      const statusOrder = { 'IN_PROGRESS': 0, 'TODO': 1, 'DONE': 2 };
      const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      
      // 같은 상태끼리는 등록일 기준으로 최신순 정렬
      if (statusDiff === 0) {
        return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
      }
      
      return statusDiff;
    });

    return filteredNotes;
  };

  const cycleStatus = (status: string): string => {
    const statusOrder = ['TODO', 'IN_PROGRESS', 'DONE'];
    const currentIndex = statusOrder.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    return statusOrder[nextIndex];
  };

  const handleStatusClick = async (note: DevNote) => {
    const newStatus = cycleStatus(note.status);
    let newProgress = note.progress;
    let newCompletedAt = note.completedAt;

    if (newStatus === 'DONE') {
      newProgress = 100;
      newCompletedAt = new Date().toISOString().split('T')[0];
      console.log('완료 상태로 변경, 완료일 설정:', newCompletedAt);
    } else if (newStatus === 'TODO') {
      newProgress = 0;
      newCompletedAt = null;
    } else if (newStatus === 'IN_PROGRESS' && note.status === 'DONE') {
      newProgress = 50;
      newCompletedAt = null;
    }
    
    const updatedNote = { ...note, status: newStatus, progress: newProgress, completedAt: newCompletedAt };
    console.log('상태 변경된 노트:', updatedNote);
    await handleNoteUpdate(updatedNote);
  };

  const handleProgressBarClick = async (e: React.MouseEvent<HTMLDivElement>, note: DevNote) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let newProgress = Math.round((x / rect.width) * 100);
    newProgress = Math.max(0, Math.min(100, newProgress)); // 0-100 범위 유지

    let newStatus = note.status;
    let newCompletedAt = note.completedAt;
    
    if (newProgress === 100) {
      newStatus = 'DONE';
      newCompletedAt = new Date().toISOString().split('T')[0];
    } else if (newProgress === 0) {
      newStatus = 'TODO';
      newCompletedAt = null;
    } else {
      newStatus = 'IN_PROGRESS';
      newCompletedAt = null;
    }

    const updatedNote = { ...note, progress: newProgress, status: newStatus, completedAt: newCompletedAt };
    await handleNoteUpdate(updatedNote);
  };

  const handleProgressTextClick = (note: DevNote) => {
    setEditingProgressNoteId(note.id);
    setInlineProgressValue(note.progress);
  };

  const handleInlineProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setInlineProgressValue(Math.max(0, Math.min(100, isNaN(value) ? 0 : value)));
  };

  const handleInlineProgressUpdate = async () => {
    if (editingProgressNoteId === null) return;
    
    const note = project?.devNotes.find(n => n.id === editingProgressNoteId);
    if (!note) return;

    const newProgress = inlineProgressValue;
    let newStatus = note.status;
    let newCompletedAt = note.completedAt;

    if (newProgress === 100) {
      newStatus = 'DONE';
      newCompletedAt = new Date().toISOString().split('T')[0];
    } else if (newProgress === 0) {
      newStatus = 'TODO';
      newCompletedAt = null;
    } else {
      newStatus = 'IN_PROGRESS';
      newCompletedAt = null;
    }
    
    const updatedNote = { ...note, progress: newProgress, status: newStatus, completedAt: newCompletedAt };
    await handleNoteUpdate(updatedNote);

    setEditingProgressNoteId(null);
  };

  const handleNoteUpdate = async (note: DevNote) => {
    try {
      console.log('업데이트 전 노트:', note);
      const response = await axios.put(`/projects/notes/${note.id}`, note);
      console.log('서버 응답:', response.data);
      
      // 업데이트된 노트를 잠시 하이라이트
      setRecentlyUpdatedNoteId(Number(note.id));
      setTimeout(() => setRecentlyUpdatedNoteId(null), 2000);

      // 서버에서 최신 데이터를 다시 가져와서 동기화 문제 해결
      await fetchProject();
      
    } catch (error) {
      console.error('노트 업데이트 실패:', error);
      alert('노트 업데이트에 실패했습니다.');
      fetchProject(); // 에러 발생 시 데이터 다시 동기화
    }
  };

  const openCommentModal = async (note: DevNote) => {
    setSelectedNote(note);
    setShowCommentModal(true);
    try {
      const res = await axios.get(`/projects/notes/${note.id}/comments`);
      setComments(res.data);
      setTimeout(() => commentInputRef.current?.focus(), 100);
    } catch (error) {
      console.error("댓글 로딩 실패:", error);
      alert("댓글을 불러오는데 실패했습니다.");
    }
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedNote(null);
    setComments([]);
    setNewComment('');
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedNote) return;

    try {
      const res = await axios.post(`/projects/notes/${selectedNote.id}/comments`, {
        content: newComment,
      });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) return;
    try {
      await axios.post(`/projects/${project?.id}/assign-user`, { userId: selectedUserId });
      axios.get(`/projects/${project?.id}/assignees`).then(res => setAssignedUsers(res.data));
      setSelectedUserId('');
      alert('회원이 할당되었습니다.');
    } catch (err) {
      alert('회원 할당 실패');
    }
  };

  if (!project) return <div>로딩 중...</div>;
  
  const canEditProject = isAdmin() || currentUser?.id === project.author_id;
  const filteredNotes = getFilteredAndSortedNotes();

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
          {/* 회원 할당 UI */}
          <div id="assign-section" className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">👥 프로젝트 할당</h3>
            <div className="flex gap-2 items-center mb-3">
              <select
                className="border rounded p-2 flex-1"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">회원 선택</option>
                {companyUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400" 
                onClick={handleAssignUser}
                disabled={!selectedUserId}
              >
                할당
              </button>
            </div>
            {/* 할당된 회원 목록 */}
            <div>
              <span className="font-semibold text-blue-800">할당된 회원:</span>
              {assignedUsers.length === 0 ? (
                <span className="ml-2 text-gray-400">없음</span>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignedUsers.map(u => (
                    <span key={u.id} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {u.name} ({u.email})
                    </span>
                  ))}
                </div>
              )}
            </div>
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

        {/* 요구사항 리스트 */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">요구 사항 리스트</h2>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigate(`/projects/${id}/wbs`)}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
              >
                WBS 보기
              </button>
              <button onClick={openAddModal} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                요구사항 추가
              </button>
              <button 
                onClick={handleAIAssist} 
                className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 flex items-center justify-center transition-transform transform hover:scale-110"
                title="AI로 요구사항 생성"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="mb-4 flex flex-col md:flex-row gap-4 justify-end">
            <div className="md:w-80">
              <input
                type="text"
                placeholder="요구사항 내용이나 작성자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="ALL">전체</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="TODO">미결</option>
                <option value="DONE">완료</option>
              </select>
            </div>
          </div>
          
          {/* 요구사항 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">내용</th>
                  <th className="py-2 px-4 border-b">등록일</th>
                  <th className="py-2 px-4 border-b">마감일</th>
                  <th className="py-2 px-4 border-b">완료일</th>
                  <th className="py-2 px-4 border-b">작성자</th>
                  <th className="py-2 px-4 border-b">상태</th>
                  <th className="py-2 px-4 border-b">진행률</th>
                  <th className="py-2 px-4 border-b">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'ALL' ? '검색 결과가 없습니다.' : '요구사항이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredNotes.map((note) => {
                    const canEditNote = isAdmin() || currentUser?.id === note.author_id;
                    return (
                      <tr key={note.id} className={`hover:bg-gray-50 transition-colors ${
                        recentlyUpdatedNoteId === Number(note.id) ? 'bg-green-100 border-green-300' : 
                        note.status === 'DONE' ? 'bg-green-50' : ''
                      }`}>
                        <td className="py-3 px-4 border-b">
                          <div className="max-w-xs truncate" title={note.content}>
                            {note.content}
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b text-center text-sm">{note.registeredAt}</td>
                        <td className="py-3 px-4 border-b text-center text-sm">
                          {note.deadline ? note.deadline.split('T')[0] : '-'}
                        </td>
                        <td className="py-3 px-4 border-b text-center text-sm">
                          {note.completedAt ? note.completedAt.split('T')[0] : '-'}
                        </td>
                        <td className="py-3 px-4 border-b text-center text-sm">{note.authorName}</td>
                        <td className="py-3 px-4 border-b text-center">
                          <span 
                            className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded cursor-pointer ${getStatusColor(note.status)}`}
                            onClick={() => handleStatusClick(note)}
                          >
                            {getStatusText(note.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-b">
                          <div className="flex items-center">
                            <div 
                              className="w-24 bg-gray-200 rounded-full h-4 mr-2 cursor-pointer relative"
                              onClick={(e) => handleProgressBarClick(e, note)}
                            >
                              <div 
                                className="bg-blue-600 h-4 rounded-full transition-all duration-100" 
                                style={{ width: `${note.progress}%` }}
                              ></div>
                            </div>
                            {editingProgressNoteId === note.id ? (
                              <input
                                type="number"
                                value={inlineProgressValue}
                                onChange={handleInlineProgressChange}
                                onBlur={handleInlineProgressUpdate}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleInlineProgressUpdate();
                                  if (e.key === 'Escape') setEditingProgressNoteId(null);
                                }}
                                className="w-14 text-center border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="text-sm text-gray-600 w-14 text-center cursor-pointer"
                                onClick={() => handleProgressTextClick(note)}
                              >
                                {note.progress}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b text-center">
                          {canEditNote && (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => openCommentModal(note)}
                                className="text-sm bg-gray-500 text-white p-1 rounded hover:bg-gray-600"
                                title="코멘트 보기/작성"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingNote ? '요구사항 수정' : '요구사항 추가'}
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
                      <option value="TODO">미결</option>
                      <option value="IN_PROGRESS">진행중</option>
                      <option value="DONE">완료</option>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">완료일</label>
                    <input 
                      type="date" 
                      name="completedAt" 
                      value={editingNote ? (editingNote.completedAt?.split('T')[0] || '') : (newNote.completedAt || '')} 
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

        {/* 코멘트 모달 */}
        {showCommentModal && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg flex flex-col" style={{ height: '70vh' }}>
              <h3 className="text-lg font-semibold mb-2">
                코멘트: <span className="font-normal text-gray-700">{selectedNote.content}</span>
              </h3>
              <div className="flex-1 overflow-y-auto mb-4 pr-2">
                {comments.length > 0 ? (
                  <ul className="space-y-4">
                    {comments.map(comment => (
                      <li key={comment.id} className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.authorName}</span>
                          <span className="text-xs text-gray-500">{comment.createdAt}</span>
                        </div>
                        <p className="bg-gray-100 p-2 rounded-md mt-1 text-sm">{comment.content}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 pt-8">작성된 코멘트가 없습니다.</p>
                )}
              </div>
              <form onSubmit={handleCommentSubmit}>
                <div className="flex gap-2">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="코멘트를 입력하세요..."
                    className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={!newComment.trim()}
                  >
                    작성
                  </button>
                </div>
              </form>
              <button 
                type="button" 
                onClick={closeCommentModal} 
                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* AI 요구사항 분석 모달 */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                AI로 요구사항 분석하기
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                요구사항에 대한 내용을 자유롭게 작성하거나 문서를 붙여넣으세요. AI가 핵심 내용과 마감일을 추출하여 요구사항 목록에 바로 추가합니다.
              </p>
              <textarea
                value={aiInputText}
                onChange={(e) => setAIInputText(e.target.value)}
                placeholder="예: 다음 주 수요일까지 사용자 인증 기능을 개발해야 합니다. JWT 토큰 기반으로 로그인, 로그아웃 API를 구현해주세요."
                className="w-full h-40 border border-gray-300 rounded-md shadow-sm p-3 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  disabled={isAnalyzing}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAnalysis(aiInputText)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400 flex items-center"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      분석 중...
                    </>
                  ) : '분석하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProjectDetailPage;
