import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import axios from '../lib/axios';
import { Sparkles } from 'lucide-react'; // Sparkles 아이콘 추가

interface Project {
    id: string;
    name: string;
}

interface WbsItem {
    content: string;
    deadline?: string;
    parent_id?: number | string | null;
    order?: number;
}

const WbsMainPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [showAIModal, setShowAIModal] = useState(false); // AI 모달 상태
    const [aiInputText, setAIInputText] = useState(''); // AI 입력 텍스트
    const [isAnalyzing, setIsAnalyzing] = useState(false); // AI 분석 중 상태

    useEffect(() => {
        axios.get('/projects')
            .then(res => {
                const fetchedProjects = res.data;
                setProjects(fetchedProjects);
                // 첫 번째 프로젝트를 기본으로 활성화
                if (fetchedProjects.length > 0) {
                    setActiveProjectId(fetchedProjects[0].id);
                }
            })
            .catch(err => {
                console.error("프로젝트 목록 로딩 실패:", err);
                alert("프로젝트 목록을 불러오는데 실패했습니다.");
            });
    }, []);

    const handleAIAssist = () => {
        setShowAIModal(true);
    };

    const handleAiAnalysis = async () => {
        if (!activeProjectId) {
            alert("프로젝트를 선택해주세요.");
            return;
        }
        setIsAnalyzing(true);
        try {
            // 1. AI 분석 API 호출
            const aiResponse = await axios.post('/ai/generate-wbs', { projectDescription: aiInputText });
            const aiWbsData: WbsItem[] = aiResponse.data.wbs; // AI가 반환한 WBS 데이터

            if (!aiWbsData || aiWbsData.length === 0) {
                alert("AI가 WBS를 생성하지 못했습니다. 내용을 다시 확인해주세요.");
                return;
            }

            // 2. AI가 생성한 WBS를 일괄 저장 API 호출
            await axios.post(`/projects/${activeProjectId}/notes/bulk`, { notes: aiWbsData });

            alert("AI 분석 및 WBS 생성이 완료되었습니다.");
            setShowAIModal(false);
            setAIInputText('');
            // WBSBoard를 새로고침하기 위해 activeProjectId를 잠시 null로 설정 후 다시 설정
            const currentActiveProjectId = activeProjectId;
            setActiveProjectId(null);
            setTimeout(() => setActiveProjectId(currentActiveProjectId), 0);

        } catch (error) {
            console.error("AI 분석 또는 WBS 생성 실패:", error);
            alert("AI 분석 또는 WBS 생성에 실패했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <MainLayout>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">🗂️ WBS 보드</h1>
                    {activeProjectId && ( // 프로젝트가 선택되었을 때만 AI 버튼 표시
                        <button
                            onClick={handleAIAssist}
                            className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 flex items-center justify-center transition-transform transform hover:scale-110"
                            title="AI로 WBS 생성"
                        >
                            <Sparkles className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="flex border-b mb-6">
                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => setActiveProjectId(project.id)}
                            className={`py-2 px-4 text-sm font-medium ${
                                activeProjectId === project.id
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {project.name}
                        </button>
                    ))}
                </div>

                <div>
                    {activeProjectId ? (
                        <WbsBoard projectId={activeProjectId} />
                    ) : (
                        <div className="text-center text-gray-500 py-20">
                            <p>프로젝트를 선택해주세요.</p>
                            {projects.length === 0 && <p className="mt-2">표시할 프로젝트가 없습니다.</p>}
                        </div>
                    )}
                </div>

                {/* AI 요구사항 분석 모달 */}
                {showAIModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                                AI로 WBS 생성하기
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                프로젝트에 대한 내용을 자유롭게 작성하거나 문서를 붙여넣으세요. AI가 핵심 내용을 분석하여 WBS를 생성합니다.
                            </p>
                            <textarea
                                value={aiInputText}
                                onChange={(e) => setAIInputText(e.target.value)}
                                placeholder="예: 새로운 웹사이트를 개발해야 합니다. 사용자 인증, 상품 목록, 장바구니, 결제 기능을 포함해야 합니다."
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
                                    onClick={handleAiAnalysis}
                                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400 flex items-center"
                                    disabled={isAnalyzing || !aiInputText.trim()}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            분석 중...
                                        </>
                                    ) : 'WBS 생성'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default WbsMainPage; 