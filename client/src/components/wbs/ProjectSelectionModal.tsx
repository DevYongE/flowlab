import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Button } from '../ui/button';

interface Project {
    id: string;
    name: string;
}

interface ProjectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProject: (projectId: string) => void;
}

const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({ isOpen, onClose, onSelectProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            axios.get('/projects')
                .then(res => setProjects(res.data))
                .catch(err => console.error("프로젝트 로딩 실패:", err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-2xl font-bold mb-4">프로젝트 선택</h2>
                <div className="max-h-60 overflow-y-auto mb-4">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedProject === project.id ? 'bg-blue-100' : ''}`}
                            onClick={() => setSelectedProject(project.id)}
                        >
                            {project.name}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button onClick={onClose} variant="outline">취소</Button>
                    <Button onClick={() => selectedProject && onSelectProject(selectedProject)} disabled={!selectedProject}>
                        선택
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelectionModal;
