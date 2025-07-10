import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';

import axios from '../lib/axios';
import { Button } from '../components/ui/button';

const WbsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [refreshWbsTrigger, setRefreshWbsTrigger] = useState(0);

    useEffect(() => {
        if (projectId) {
            axios.get(`/projects/${projectId}`)
                .then(res => setProject(res.data))
                .catch(err => console.error("프로젝트 정보 로딩 실패:", err));
        }
    }, [projectId]);

    const handleAIAnalysis = async () => {
        if (!projectId || !project || !project.description) {
            alert("프로젝트 설명이 없거나 프로젝트 정보를 불러오지 못했습니다.");
            return;
        }
        setIsAnalyzing(true);
        console.log("Starting AI analysis for project:", projectId);
        try {
            await axios.post('/ai/generate-wbs', {
                projectId: projectId,
                projectDescription: project.description
            });
            alert("AI 분석이 완료되었습니다. WBS가 업데이트되었습니다.");
            setRefreshWbsTrigger(prev => prev + 1); // Trigger WBS board refresh
        } catch (error) {
            console.error("AI WBS 생성 실패:", error);
            alert("AI WBS 생성 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!projectId) {
        // 혹은 에러 페이지로 리디렉션
        return <div>잘못된 접근입니다.</div>;
    }

    return (
        <MainLayout>
            <div className="container mx-auto p-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">
                        <span className="text-gray-500 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${projectId}`)}>
                            {project?.name || '프로젝트'}
                        </span>
                        <span className="text-gray-400 mx-2">/</span>
                        WBS
                    </h1>
                    <Button className="ml-4" onClick={handleAIAnalysis} disabled={isAnalyzing}>
                        {isAnalyzing ? '분석 중...' : 'AI 분석'}
                    </Button>
                </div>

                <WbsBoard projectId={projectId} refreshTrigger={refreshWbsTrigger} />
            </div>
        </MainLayout>
    );
};

export default WbsPage; 