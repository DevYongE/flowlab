import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import axios from '../lib/axios';
import { Button } from '../components/ui/button';
// 달력 라이브러리 임포트 (간단한 달력 구현)
import { addMonths, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import GanttChart from '../components/wbs/GanttChart';
import { Sparkles } from 'lucide-react';

// 탭 타입 정의
type TabType = 'tree' | 'gantt' | 'schedule';

// 작업 항목 타입
interface TaskItem {
    id: number | string;
    name?: string;
    content?: string;
    startDate?: string | null;
    endDate?: string | null;
    completedAt?: string | null;
    deadline?: string | null;
    registered_at?: string | null;
    assignee?: string | null;
    status?: string | null;
    progress?: number | null;
}

const WbsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [refreshWbsTrigger, setRefreshWbsTrigger] = useState(0);
    
    // 탭 상태
    const [activeTab, setActiveTab] = useState<TabType>('tree');
    
    // 달력 및 일정 상태
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayTasks, setDayTasks] = useState<TaskItem[]>([]);

    // AI 분석 모달 상태
    const [showAIModal, setShowAIModal] = useState(false);
    const [currentRequirements, setCurrentRequirements] = useState<TaskItem[]>([]);
    const [aiOptions, setAiOptions] = useState({
        clearExisting: false,
        customPrompt: '',
        includeTimeline: true,
        detailLevel: 'medium' as 'basic' | 'medium' | 'detailed'
    });

    // 요구사항(DevNote) 목록을 AI 프롬프트로 전달하여 WBS 재구성
    const [showRebuildModal, setShowRebuildModal] = useState(false);
    const [rebuildLoading, setRebuildLoading] = useState(false);
    const [rebuildDeleteOld, setRebuildDeleteOld] = useState(true);
    const [rebuildResult, setRebuildResult] = useState<string | null>(null);

    useEffect(() => {
        if (projectId) {
            axios.get(`/projects/${projectId}`)
                .then(res => setProject(res.data))
                .catch(err => console.error("프로젝트 정보 로딩 실패:", err));
        }
    }, [projectId]);

    // 선택된 날짜의 작업들을 가져오기
    useEffect(() => {
        if (projectId && selectedDate && activeTab === 'schedule') {
            fetchDayTasks();
        }
    }, [projectId, selectedDate, activeTab, refreshWbsTrigger]);

    const fetchDayTasks = async () => {
        try {
            const res = await axios.get(`/projects/${projectId}/wbs`);
            const allTasks = flattenWbsItems(res.data);
            
            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            const tasksForDay = allTasks.filter(task => {
                const startDate = getDateField(task, ['startDate', 'registered_at']);
                const endDate = task.completedAt 
                    ? getDateField(task, ['completedAt'])
                    : getDateField(task, ['endDate', 'deadline']);
                
                if (!startDate || !endDate) return false;
                
                return isWithinInterval(parseISO(selectedDateStr), {
                    start: parseISO(startDate),
                    end: parseISO(endDate)
                });
            });
            
            setDayTasks(tasksForDay);
        } catch (error) {
            console.error('일정 로딩 실패:', error);
        }
    };

    // WBS 데이터를 평면화하는 함수
    const flattenWbsItems = (nodes: any[]): TaskItem[] => {
        let arr: TaskItem[] = [];
        nodes.forEach(n => {
            arr.push({
                id: n.id,
                name: n.name,
                content: n.content,
                startDate: n.startDate || n.start_id || n.registered_at || null,
                endDate: n.endDate || n.end_id || n.deadline || null,
                completedAt: n.completedAt,
                assignee: n.assignee,
                status: n.status,
                progress: n.progress
            });
            if (n.children && n.children.length > 0) {
                arr = arr.concat(flattenWbsItems(n.children));
            }
        });
        return arr;
    };

    // 날짜 필드에서 유효한 날짜 추출
    const getDateField = (item: TaskItem, keys: (keyof TaskItem)[]): string | null => {
        for (const k of keys) {
            const v = item[k];
            if (typeof v === 'string' && v.length >= 10) return v.slice(0, 10);
        }
        return null;
    };

    // AI 분석 버튼 클릭 (모달 열기)
    const handleAIAnalysisClick = async () => {
        // 프로젝트 ID 확인
        if (!projectId) {
            alert("❌ 프로젝트 ID를 찾을 수 없습니다. 페이지를 새로고침해보세요.");
            return;
        }

        // 프로젝트 정보 로딩 확인
        if (!project) {
            alert("⏳ 프로젝트 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        try {
            // 현재 프로젝트의 요구사항들을 가져와서 확인
            const wbsResponse = await axios.get(`/projects/${projectId}/wbs`);
            const existingRequirements = flattenWbsItems(wbsResponse.data);
            
            if (existingRequirements.length === 0) {
                const userWantsToAdd = window.confirm(
                    "📝 분석할 요구사항이 없습니다.\n\n" +
                    "AI가 WBS를 생성하려면 기존 요구사항이나 프로젝트 설명이 필요합니다.\n" +
                    "프로젝트 상세 페이지에서 요구사항을 추가하시겠습니까?"
                );
                
                if (userWantsToAdd) {
                    navigate(`/projects/${projectId}`);
                }
                return;
            }

            // 요구사항들을 상태에 저장하고 모달 열기
            setCurrentRequirements(existingRequirements);
            setShowAIModal(true);
            
        } catch (error) {
            console.error("요구사항 조회 실패:", error);
            alert("❌ 요구사항을 불러오는 중 오류가 발생했습니다.");
        }
    };

    // AI 분석 실행
    const handleAIAnalysis = async () => {
        setShowAIModal(false);
        setIsAnalyzing(true);

        try {
            // 현재 프로젝트의 요구사항들을 가져오기
            const wbsResponse = await axios.get(`/projects/${projectId}/wbs`);
            const existingRequirements = flattenWbsItems(wbsResponse.data);
            
            // 요구사항들을 텍스트로 변환
            let requirementsText = "";
            if (existingRequirements.length > 0) {
                requirementsText = "현재 등록된 요구사항 목록:\n\n";
                existingRequirements.forEach((req, index) => {
                    const content = req.name || req.content || `요구사항 ${index + 1}`;
                    const assignee = req.assignee ? ` (담당자: ${req.assignee})` : '';
                    const status = req.status ? ` [${req.status}]` : '';
                    requirementsText += `${index + 1}. ${content}${assignee}${status}\n`;
                });
            }

            // 사용자 추가 요구사항이 있으면 포함
            if (aiOptions.customPrompt.trim()) {
                requirementsText += `\n\n사용자 추가 요구사항:\n${aiOptions.customPrompt.trim()}`;
            }

            // 프로젝트 설명도 있으면 포함
            if (project?.description?.trim()) {
                requirementsText += `\n\n프로젝트 개요:\n${project.description.trim()}`;
            }

            if (!requirementsText.trim()) {
                alert("❌ 분석할 요구사항이 없습니다. 요구사항을 먼저 등록해주세요.");
                setIsAnalyzing(false);
                setShowAIModal(true);
                return;
            }

            // 기존 WBS 삭제 (옵션 선택 시)
            if (aiOptions.clearExisting) {
                await axios.delete(`/projects/${projectId}/wbs/clear`);
            }

            // AI 프롬프트 구성
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
            const currentYear = new Date().getFullYear();
            
            let detailPrompt = `당신은 숙련된 프로젝트 매니저이자 WBS(Work Breakdown Structure) 전문가입니다. 
제공된 요구사항 목록을 분석하여 체계적인 WBS로 재구성해주세요.

**중요한 날짜 정보:**
- 오늘 날짜: ${today}
- 현재 연도: ${currentYear}
- 모든 마감일은 오늘 날짜 이후로 설정해주세요.

**중요**: 기존 요구사항들을 그대로 복사하지 말고, 논리적으로 분류하고 구조화해서 새로운 WBS를 만들어주세요.

WBS는 다음과 같은 3단계 구조로 작성해주세요:
1. **대분류 (Phase or Major Task)**: 전체 프로젝트를 큰 작업 단위로 나눕니다.
2. **중분류 (Deliverables or Sub-task)**: 각 대분류 아래 세부 작업을 나눕니다.
3. **소분류 (Work Package or Activity)**: 실제 작업자들이 수행할 수 있는 최소 단위의 작업입니다.

각 WBS 항목은 다음을 포함해야 합니다:
- 'content': 작업 설명 (한국어)
- 'deadline': 마감일 (YYYY-MM-DD 형식, 오늘 날짜 이후로 설정)
- 'parent_id': 상위 작업 ID (최상위는 null)
- 'order': 같은 레벨에서의 순서

출력은 반드시 "wbs" 키를 가진 JSON 객체여야 하며, 그 값은 WBS 항목들의 배열이어야 합니다.

**날짜 설정 가이드:**
- 마감일은 반드시 오늘(${today}) 이후로 설정해주세요.
- 작업의 복잡도와 의존관계를 고려하여 현실적인 기간을 할당해주세요.
- 연속된 작업들은 논리적 순서에 맞게 일정을 배치해주세요.`;

            // 상세도에 따른 프롬프트 조정
            if (aiOptions.detailLevel === 'basic') {
                detailPrompt += "\n\n**추가 지시사항**: WBS를 간단하게 2-3레벨로만 구성하고, 각 레벨당 3-5개 항목으로 제한해주세요.";
            } else if (aiOptions.detailLevel === 'detailed') {
                detailPrompt += "\n\n**추가 지시사항**: WBS를 매우 상세하게 4-5레벨까지 구성하고, 실제 개발 작업 단위까지 세분화해주세요. 각 작업의 예상 소요시간도 고려해주세요.";
            }

            // 타임라인 포함 옵션
            if (aiOptions.includeTimeline) {
                detailPrompt += `\n\n**타임라인 지시사항**: 각 작업에 현실적인 시작일과 마감일을 포함해주세요. 오늘(${today})부터 시작하여 논리적 순서를 고려하여 일정을 배분해주세요. 모든 날짜는 ${currentYear}년 이후로 설정해주세요.`;
            }

            // AI WBS 생성 및 저장 API 호출
            const response = await axios.post('/ai/generate-wbs', {
                projectId: projectId,
                prompt: detailPrompt,
                projectDescription: requirementsText
            });

            const { message, itemsCreated } = response.data;
            alert(`✅ ${message}\n📝 생성된 항목: ${itemsCreated}개`);
            
            // WBS 데이터 새로고침
            setRefreshWbsTrigger(prev => prev + 1);
            
            // 트리구조 탭으로 자동 전환하여 결과 확인
            setActiveTab('tree');
            
        } catch (error: any) {
            console.error("AI WBS 생성 실패:", error);
            
            let errorMessage = "AI WBS 생성 중 오류가 발생했습니다.";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(`❌ ${errorMessage}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 요구사항(DevNote) 목록을 AI 프롬프트로 전달하여 WBS 재구성
    const handleRebuildWbs = async () => {
        if (!projectId) return;
        setRebuildLoading(true);
        setRebuildResult(null);
        try {
            // 1. 기존 요구사항(DevNote) 목록 가져오기
            const devNotesRes = await axios.get(`/projects/${projectId}`);
            const devNotes = devNotesRes.data?.devNotes || [];
            if (!devNotes.length) {
                setRebuildResult('요구사항(DevNote)이 없습니다.');
                setRebuildLoading(false);
                return;
            }
            // 2. 프롬프트 구성
            let prompt = '아래 요구사항(DevNote) 목록을 논리적으로 그룹핑/계층화하여 WBS(Work Breakdown Structure) 트리(최상위~하위)로 만들어주세요.\n\n';
            devNotes.forEach((note: any, idx: number) => {
                prompt += `${idx + 1}. ${note.content}\n`;
            });
            prompt += '\n- 각 항목은 content, deadline(YYYY-MM-DD, 없으면 null), parent_id(최상위 null), order(동일레벨 순서) 필드를 포함해야 합니다.';
            // 3. 기존 WBS 삭제(옵션)
            if (rebuildDeleteOld) {
                await axios.delete(`/projects/${projectId}/wbs/clear`);
            }
            // 4. AI WBS 생성 및 저장
            const aiRes = await axios.post('/ai/generate-wbs', {
                projectId,
                prompt,
                projectDescription: prompt
            });
            setRebuildResult(`✅ WBS ${aiRes.data.itemsCreated || 0}개 생성 완료!`);
            setRefreshWbsTrigger(prev => prev + 1);
        } catch (err: any) {
            setRebuildResult('❌ 오류: ' + (err.response?.data?.message || err.message));
        } finally {
            setRebuildLoading(false);
        }
    };

    if (!projectId) {
        return <div>잘못된 접근입니다.</div>;
    }

    // 탭 렌더링
    const renderTabButtons = () => (
        <div className="flex border-b border-gray-200 mb-6">
            <button
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'tree'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('tree')}
            >
                🌳 트리구조
            </button>
            <button
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'gantt'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('gantt')}
            >
                📊 간트차트
            </button>
            <button
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'schedule'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('schedule')}
            >
                📅 일정
            </button>
        </div>
    );

    // 달력 렌더링 함수
    const renderHeader = () => (
        <div className="flex justify-between items-center mb-4">
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
                &lt;
            </Button>
            <span className="font-bold text-lg">{format(currentMonth, 'yyyy년 MM월')}</span>
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
                &gt;
            </Button>
        </div>
    );

    const renderDays = () => {
        const days: React.ReactElement[] = [];
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        weekDays.forEach((day, i) => {
            days.push(
                <div className={`text-center font-semibold py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-700'}`} key={i}>
                    {day}
                </div>
            );
        });
        return <div className="grid grid-cols-7 mb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const rows: React.ReactElement[] = [];
        let days: React.ReactElement[] = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                
                days.push(
                    <div
                        className={`p-3 text-center rounded cursor-pointer transition-colors ${
                            !isCurrentMonth 
                                ? 'text-gray-300' 
                                : isSelected 
                                ? 'bg-blue-500 text-white' 
                                : isToday
                                ? 'bg-orange-100 text-orange-700 font-bold'
                                : 'hover:bg-gray-100'
                        } ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}
                        key={day.toString()}
                        onClick={() => {
                            setSelectedDate(cloneDay);
                            if (activeTab !== 'schedule') {
                                setActiveTab('schedule');
                            }
                        }}
                    >
                        {formattedDate}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    // 일정 탭 렌더링
    const renderScheduleTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 달력 */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">달력</h3>
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>
            
            {/* 선택된 날짜의 작업들 */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                    {format(selectedDate, 'yyyy년 MM월 dd일')} 작업 목록
                </h3>
                
                {dayTasks.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">📝</div>
                        <p>선택된 날짜에 진행 중인 작업이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dayTasks.map((task) => {
                            const isCompleted = !!task.completedAt;
                            const startDate = getDateField(task, ['startDate', 'registered_at']);
                            const endDate = task.completedAt 
                                ? getDateField(task, ['completedAt'])
                                : getDateField(task, ['endDate', 'deadline']);
                            
                            return (
                                <div key={task.id} className={`p-4 rounded-lg border-l-4 ${
                                    isCompleted 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-blue-500 bg-blue-50'
                                }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-blue-800'}`}>
                                                {task.name || task.content}
                                            </h4>
                                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                {task.assignee && (
                                                    <div>👤 담당자: <span className="font-medium">{task.assignee}</span></div>
                                                )}
                                                {startDate && endDate && (
                                                    <div>📅 기간: {startDate} ~ {endDate}</div>
                                                )}
                                                {task.progress !== null && (
                                                    <div>📈 진행률: {task.progress}%</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-2xl ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                                            {isCompleted ? '✅' : '⏳'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // 탭 컨텐츠 렌더링
    const renderTabContent = () => {
        switch (activeTab) {
            case 'tree':
                return <WbsBoard projectId={projectId} refreshTrigger={refreshWbsTrigger} selectedDate={selectedDate} />;
            case 'gantt':
                return <GanttChart projectId={projectId} refreshTrigger={refreshWbsTrigger} />;
            case 'schedule':
                return renderScheduleTab();
            default:
                return null;
        }
    };

    return (
        <MainLayout>
            <div className="container mx-auto p-4">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">
                        <span className="text-gray-500 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${projectId}`)}>
                            {project?.name || '프로젝트'}
                        </span>
                        <span className="text-gray-400 mx-2">/</span>
                        WBS
                    </h1>
                    <div className="flex gap-2">
                        {/* 기존 AI 분석 버튼 */}
                        <Button 
                            className="ml-4 relative bg-purple-600 hover:bg-purple-700 text-white shadow-lg" 
                            onClick={handleAIAnalysisClick} 
                            disabled={isAnalyzing || !project}
                            variant={isAnalyzing ? "outline" : "default"}
                            title={!project ? "프로젝트 정보를 불러오는 중..." : "현재 요구사항들을 분석하여 WBS를 생성합니다"}
                        >
                            {isAnalyzing && (
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                </div>
                            )}
                            <span className={isAnalyzing ? "ml-6" : ""}>
                                {isAnalyzing ? '🤖 AI 분석 중...' : !project ? '⏳ 로딩 중...' : '🤖 AI WBS 생성'}
                            </span>
                        </Button>
                        {/* 새로 추가: 요구사항 기반 WBS 재구성 버튼 */}
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center gap-2 text-lg font-bold p-4"
                            onClick={() => setShowRebuildModal(true)}
                            disabled={!project}
                            title="현재 등록된 요구사항(DevNote) 기반으로 WBS를 자동 계층화합니다."
                        >
                            <Sparkles className="h-6 w-6" />
                            🔥 AI WBS 재구성(요구사항 기반) 🔥
                        </Button>
                    </div>
                </div>

                {/* 탭 버튼들 */}
                {renderTabButtons()}

                {/* 탭 컨텐츠 */}
                {renderTabContent()}

                {/* AI 분석 설정 모달 */}
                {showAIModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                🤖 AI WBS 생성 설정
                            </h3>
                            
                            <div className="space-y-4">
                                {/* 기존 WBS 처리 */}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={aiOptions.clearExisting}
                                            onChange={(e) => setAiOptions(prev => ({
                                                ...prev,
                                                clearExisting: e.target.checked
                                            }))}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">기존 WBS 항목을 모두 삭제하고 새로 생성</span>
                                    </label>
                                    <p className="text-xs text-gray-500 ml-6">
                                        체크 해제 시 기존 항목에 추가로 생성됩니다
                                    </p>
                                </div>

                                {/* 상세도 선택 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">WBS 상세도</label>
                                    <select
                                        value={aiOptions.detailLevel}
                                        onChange={(e) => setAiOptions(prev => ({
                                            ...prev,
                                            detailLevel: e.target.value as 'basic' | 'medium' | 'detailed'
                                        }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    >
                                        <option value="basic">간단 (2-3레벨, 빠른 생성)</option>
                                        <option value="medium">보통 (3-4레벨, 균형잡힌 구조)</option>
                                        <option value="detailed">상세 (4-5레벨, 실무 단위까지)</option>
                                    </select>
                                </div>

                                {/* 타임라인 포함 */}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={aiOptions.includeTimeline}
                                            onChange={(e) => setAiOptions(prev => ({
                                                ...prev,
                                                includeTimeline: e.target.checked
                                            }))}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">시작일/마감일 자동 설정</span>
                                    </label>
                                    <p className="text-xs text-gray-500 ml-6">
                                        프로젝트 일정에 맞춰 작업별 타임라인을 생성합니다
                                    </p>
                                </div>

                                {/* 추가 분석 요청사항 */}
                                {currentRequirements.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">추가 분석 요청사항 (선택)</label>
                                        <textarea
                                            value={aiOptions.customPrompt}
                                            onChange={(e) => setAiOptions(prev => ({
                                                ...prev,
                                                customPrompt: e.target.value
                                            }))}
                                            placeholder="기존 요구사항에 추가로 고려할 사항을 입력해주세요...&#10;예: 보안 관련 작업 강화, 모바일 우선 설계, 성능 최적화 등"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20 resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            💡 기존 요구사항 외에 AI가 추가로 고려할 사항이 있으면 입력해주세요.
                                        </p>
                                    </div>
                                )}

                                {/* 현재 요구사항 미리보기 */}
                                <div className="bg-gray-50 rounded p-3">
                                    <h4 className="text-sm font-medium mb-2">분석할 현재 요구사항:</h4>
                                    {currentRequirements.length > 0 ? (
                                        <div>
                                            <div className="max-h-32 overflow-y-auto mb-2">
                                                {currentRequirements.slice(0, 10).map((req, index) => (
                                                    <div key={req.id} className="text-xs text-gray-600 mb-1 flex items-start">
                                                        <span className="text-blue-500 mr-1 flex-shrink-0">{index + 1}.</span>
                                                        <span className="flex-1">
                                                            {req.name || req.content}
                                                            {req.assignee && <span className="text-green-600 ml-1">({req.assignee})</span>}
                                                            {req.status && <span className="text-amber-600 ml-1">[{req.status}]</span>}
                                                        </span>
                                                    </div>
                                                ))}
                                                {currentRequirements.length > 10 && (
                                                    <div className="text-xs text-gray-500 italic">
                                                        ... 외 {currentRequirements.length - 10}개 더
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-green-600">
                                                ✅ {currentRequirements.length}개의 요구사항이 있습니다
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-red-500 mb-2">
                                                ❌ 분석할 요구사항이 없습니다.
                                            </p>
                                            <textarea
                                                value={aiOptions.customPrompt}
                                                onChange={(e) => setAiOptions(prev => ({
                                                    ...prev,
                                                    customPrompt: e.target.value
                                                }))}
                                                placeholder="요구사항을 여기에 입력해주세요...&#10;예:&#10;- 사용자 회원가입/로그인 기능&#10;- 상품 목록 및 상세보기&#10;- 장바구니 및 결제 시스템&#10;- 주문 관리 시스템"
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-xs h-24 resize-none"
                                            />
                                            <div className="mt-1 text-xs text-amber-600">
                                                💡 위에 요구사항을 입력하면 AI가 분석할 수 있습니다.
                                            </div>
                                        </div>
                                    )}

                                    {/* 프로젝트 설명이 있으면 추가 정보로 표시 */}
                                    {project?.description?.trim() && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <h5 className="text-xs font-medium mb-1 text-gray-700">추가 참고 정보 (프로젝트 개요):</h5>
                                            <p className="text-xs text-gray-600 max-h-16 overflow-y-auto whitespace-pre-wrap">
                                                {project.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 버튼들 */}
                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAIModal(false)}
                                    disabled={isAnalyzing}
                                >
                                    취소
                                </Button>
                                <Button
                                    onClick={handleAIAnalysis}
                                    disabled={isAnalyzing || (currentRequirements.length === 0 && !aiOptions.customPrompt.trim())}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                                    title={
                                        (currentRequirements.length === 0 && !aiOptions.customPrompt.trim()) 
                                            ? "분석할 요구사항이 없습니다" 
                                            : "AI 분석을 시작합니다"
                                    }
                                >
                                    🤖 AI 분석 시작
                                    {(currentRequirements.length === 0 && !aiOptions.customPrompt.trim()) && (
                                        <span className="ml-1 text-xs opacity-75">(요구사항 필요)</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {/* 요구사항 기반 WBS 재구성 모달 */}
                {showRebuildModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                                AI WBS 재구성 (요구사항 기반)
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">현재 프로젝트에 등록된 요구사항(DevNote)들을 AI가 논리적으로 그룹핑/계층화하여 WBS 트리로 자동 생성합니다.</p>
                            <label className="flex items-center mb-4">
                                <input type="checkbox" checked={rebuildDeleteOld} onChange={e => setRebuildDeleteOld(e.target.checked)} className="mr-2" />
                                기존 WBS(DevNote) 모두 삭제 후 생성
                            </label>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleRebuildWbs} disabled={rebuildLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                    {rebuildLoading ? 'AI 생성 중...' : 'AI로 WBS 재구성'}
                                </Button>
                                <Button onClick={() => setShowRebuildModal(false)} disabled={rebuildLoading} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white">
                                    취소
                                </Button>
                            </div>
                            {rebuildResult && <div className="mt-4 text-center text-sm">{rebuildResult}</div>}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default WbsPage; 