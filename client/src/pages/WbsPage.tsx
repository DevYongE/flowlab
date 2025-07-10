import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';

import axios from '../lib/axios';
import { Button } from '../components/ui/button';

const WbsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [projectName, setProjectName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (projectId) {
            axios.get(`/projects/${projectId}`)
                .then(res => setProjectName(res.data.name))
                .catch(err => console.error("프로젝트 이름 로딩 실패:", err));
        }
    }, [projectId]);

    const handleAIAnalysis = async () => {
        if (!projectId) return;
        setIsAnalyzing(true);
        console.log("Starting AI analysis for project:", projectId);
        try {
            // 여기에 실제 AI 분석 로직을 구현합니다.
            // 예: await axios.post('/ai/analyze', { projectId });
            alert("AI 분석이 시작되었습니다. 잠시 후 WBS가 업데이트됩니다.");
        } catch (error) {
            console.error("AI 분석 실패:", error);
            alert("AI 분석 중 오류가 발생했습니다.");
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
                            {projectName || '프로젝트'}
                        </span>
                        <span className="text-gray-400 mx-2">/</span>
                        WBS
                    </h1>
                    <Button className="ml-4" onClick={handleAIAnalysis} disabled={isAnalyzing}>
                        {isAnalyzing ? '분석 중...' : 'AI 분석'}
                    </Button>
                </div>

                <WbsBoard projectId={projectId} />
            </div>
        </MainLayout>
    );
};

export default WbsPage; 