import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import WbsBoard from '../components/wbs/WbsBoard';
import axios from '../lib/axios';

interface Project {
    id: string;
    name: string;
}

const WbsMainPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

    return (
        <MainLayout>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">🗂️ WBS 보드</h1>

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
            </div>
        </MainLayout>
    );
};

export default WbsMainPage; 