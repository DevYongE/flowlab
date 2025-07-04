import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import axios from '../lib/axios';

const WbsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [projectName, setProjectName] = useState('');

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
                </div>

                <WbsBoard projectId={projectId} />
            </div>
        </MainLayout>
    );
};

export default WbsPage; 