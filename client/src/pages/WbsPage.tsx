import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import ProjectSelectionModal from '../components/wbs/ProjectSelectionModal';
import axios from '../lib/axios';
import { Button } from '../components/ui/button';

const WbsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [projectName, setProjectName] = useState('');
    const [showProjectSelectionModal, setShowProjectSelectionModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (projectId) {
            axios.get(`/projects/${projectId}`)
                .then(res => setProjectName(res.data.name))
                .catch(err => console.error("프로젝트 이름 로딩 실패:", err));
        }
    }, [projectId]);

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
                    <Button className="ml-4" onClick={() => setShowProjectSelectionModal(true)}>AI 분석</Button>
                </div>

                <WbsBoard projectId={projectId} />
            </div>
            <ProjectSelectionModal
                isOpen={showProjectSelectionModal}
                onClose={() => setShowProjectSelectionModal(false)}
                onSelectProject={(id) => {
                    setSelectedProjectId(id);
                    setShowProjectSelectionModal(false);
                    // 여기에 선택된 프로젝트 ID를 가지고 AI 분석을 시작하는 로직 추가
                    console.log("Selected project for AI analysis:", id);
                }}
            />
        </MainLayout>
    );
};

export default WbsPage; 