import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import axios from '../lib/axios';
import { Button } from '../components/ui/button';
// 달력 라이브러리 임포트 (간단한 달력 구현)
import { addMonths, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import GanttChart from '../components/wbs/GanttChart';

const AI_PROMPT = `넌 숙련된 프로젝트 매니저야. 내가 제공하는 프로젝트 요구사항을 기반으로 WBS(Work Breakdown Structure)를 작성해줘.  
※ 현재 등록된 프로젝트의 요구사항을 확인하고, 그에 맞춰 작업을 구조화해줘.

WBS는 다음과 같은 3단계 구조로 작성해:
1. **대분류 (Phase or Major Task)**: 전체 프로젝트를 큰 작업 단위로 나눈다.
2. **중분류 (Deliverables or Sub-task)**: 각 대분류 아래 세부 작업을 나눈다.
3. **소분류 (Work Package or Action Item)**: 실제 작업자들이 수행할 수 있는 최소 단위의 작업이다.

형식은 다음과 같아:
- 1. 대분류 제목  
  - 1.1 중분류 제목  
    - 1.1.1 소분류 작업  
    - 1.1.2 소분류 작업  
  - 1.2 중분류 제목  
    - 1.2.1 소분류 작업  

주의사항:  
- 중복 없이, 논리적 순서에 맞게 정리해줘.  
- 소분류는 되도록 **작업 단위(예: "디자인 시안 작성", "DB 테이블 설계")**로 명확히 작성해.  
- 가능하면 각 작업이 **산출물 중심(deliverable-based)**이 되도록 해줘.  
- **각 작업마다 논리적으로 배분된 시작일(startDate)과 마감일(endDate)도 반드시 포함해서 JSON 트리 구조로 반환해줘.** (예: 2025-07-01 ~ 2025-07-10)
`;

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

    // AI 버튼 클릭 시: 프롬프트 + 프로젝트 설명 조합하여 바로 분석
    const handleAIAnalysis = async () => {
        if (!projectId || !project || !project.description) {
            alert("프로젝트 설명이 없거나 프로젝트 정보를 불러오지 못했습니다.");
            return;
        }
        setIsAnalyzing(true);
        try {
            // 프롬프트 + 프로젝트 설명 조합
            const prompt = `${AI_PROMPT}\n\n프로젝트 요구사항:\n${project.description}`;
            // AI WBS 생성 API 호출
            const aiRes = await axios.post('/ai/generate-wbs', {
                projectId: projectId,
                prompt: prompt,
                projectDescription: project.description
            });
            // AI가 트리 구조 WBS(JSON) 반환한다고 가정
            const aiWbs = aiRes.data.wbs || aiRes.data; // wbs 필드 또는 전체
            if (!aiWbs || !Array.isArray(aiWbs) || aiWbs.length === 0) {
                alert("AI가 WBS를 생성하지 못했습니다. 내용을 다시 확인해주세요.");
                return;
            }
            // bulk 저장 API 호출
            await axios.post(`/projects/${projectId}/notes/bulk`, { notes: aiWbs });
            alert("AI 분석 및 WBS 생성이 완료되었습니다.");
            setRefreshWbsTrigger(prev => prev + 1);
        } catch (error) {
            console.error("AI WBS 생성/저장 실패:", error);
            alert("AI WBS 생성 또는 저장 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
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
                        <Button className="ml-4" onClick={handleAIAnalysis} disabled={isAnalyzing}>
                            {isAnalyzing ? '분석 중...' : 'AI 분석'}
                        </Button>
                    </div>
                </div>

                {/* 탭 버튼들 */}
                {renderTabButtons()}

                {/* 탭 컨텐츠 */}
                {renderTabContent()}
            </div>
        </MainLayout>
    );
};

export default WbsPage; 