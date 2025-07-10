import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import axios from '../lib/axios';
import { Button } from '../components/ui/button';
// 달력 라이브러리 임포트 (간단한 달력 구현)
import { addMonths, subMonths, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
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
- 소분류는 되도록 **작업 단위(예: “디자인 시안 작성”, “DB 테이블 설계”)**로 명확히 작성해.  
- 가능하면 각 작업이 **산출물 중심(deliverable-based)**이 되도록 해줘.  `;

const WbsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [refreshWbsTrigger, setRefreshWbsTrigger] = useState(0);
    // 달력 상태
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showGantt, setShowGantt] = useState(false);

    useEffect(() => {
        if (projectId) {
            axios.get(`/projects/${projectId}`)
                .then(res => setProject(res.data))
                .catch(err => console.error("프로젝트 정보 로딩 실패:", err));
        }
    }, [projectId]);

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

    // 달력 렌더링 함수
    const renderHeader = () => (
        <div className="flex justify-between items-center mb-2">
            <Button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</Button>
            <span className="font-bold text-lg">{format(currentMonth, 'yyyy년 MM월')}</span>
            <Button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</Button>
        </div>
    );
    const renderDays = () => {
        const days = [];
        const dateFormat = 'E';
        const startDate = startOfWeek(currentMonth, { weekStartsOn: 0 });
        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="text-center font-semibold" key={i}>
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-1">{days}</div>;
    };
    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';
        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                days.push(
                    <div
                        className={`p-2 text-center rounded cursor-pointer ${isSameMonth(day, monthStart) ? '' : 'text-gray-400'} ${isSameDay(day, selectedDate) ? 'bg-blue-200' : ''}`}
                        key={day.toString()}
                        onClick={() => setSelectedDate(cloneDay)}
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
                        <Button variant="outline" onClick={() => setShowGantt(v => !v)}>
                            {showGantt ? '트리 보기' : '간트 차트'}
                        </Button>
                    </div>
                </div>
                {/* 달력 UI */}
                <div className="mb-8 bg-white rounded shadow p-4 max-w-lg mx-auto">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>
                {showGantt ? (
                    <GanttChart projectId={projectId} refreshTrigger={refreshWbsTrigger} />
                ) : (
                    <WbsBoard projectId={projectId} refreshTrigger={refreshWbsTrigger} selectedDate={selectedDate} />
                )}
            </div>
        </MainLayout>
    );
};

export default WbsPage; 