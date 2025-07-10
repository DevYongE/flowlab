import React, { useState, useEffect, useCallback } from 'react';
import { Tree } from '@minoru/react-dnd-treeview';
import type { NodeModel } from '@minoru/react-dnd-treeview';
import axios from '../../lib/axios';

// 타입 정의
interface WbsItem {
    id: number | string;
    name: string;
    content?: string;
    parent_id?: number | string | null;
    children?: WbsItem[];
    completedAt?: string;
    // TODO: assignee_name, start_date, end_date 등 추가 필드
}

interface User {
    id: string;
    name: string;
}

interface WbsBoardProps {
    projectId: string;
}

const SafeTree = Tree as any;

const WbsBoard: React.FC<WbsBoardProps> = ({ projectId }) => {
    const [treeData, setTreeData] = useState<NodeModel[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        assignee: '',
        startDate: '',
        endDate: '',
        status: '미완료',
        progress: 0,
        parent: 0 as number,
        completedAt: ''
    });
    const [loading, setLoading] = useState(false);
    const [openIds, setOpenIds] = useState<number[]>([]);

    // 트리형 WBS 데이터를 flat 구조로 변환
    function flattenTree(nodes: WbsItem[], parentId: number = 0): NodeModel[] {
        let arr: NodeModel[] = [];
        nodes.forEach((node) => {
            arr.push({
                id: node.id,
                parent: parentId,
                text: node.name || node.content || '',
                droppable: true,
                data: node
            });
            if (node.children && node.children.length > 0) {
                arr = arr.concat(flattenTree(node.children, Number(node.id)));
            }
        });
        return arr;
    }

    const fetchWbsData = useCallback(async () => {
        if (!projectId) return;
        try {
            const wbsRes = await axios.get(`/projects/${projectId}/wbs`);
            setTreeData(flattenTree(wbsRes.data));
        } catch (error) {
            console.error(`WBS 데이터 로딩 실패 (Project ID: ${projectId}):`, error);
            alert("WBS 데이터를 불러오는데 실패했습니다.");
        }
    }, [projectId]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('사용자 목록 로딩 실패:', error);
        }
    }, []);

    useEffect(() => {
        fetchWbsData();
        fetchUsers();
    }, [fetchWbsData, fetchUsers]);

    // 트리뷰 드래그앤드롭 핸들러
    const handleDrop = async (newTree: NodeModel[]) => {
        setTreeData(newTree);
        // 서버에 구조 저장
        // parent, order 정보만 추출해서 평탄화 구조로 보냄
        const structure = newTree.map((n, idx) => ({
            id: n.id,
            parent_id: n.parent === 0 ? null : n.parent,
            order: idx
        }));
        try {
            await axios.patch(`/projects/notes/structure/${projectId}`, { structure });
            fetchWbsData();
        } catch (e) {
            alert('순서/계층 변경 실패');
        }
    };

    const handleAddClick = (parent: number | string = 0) => {
        setAddForm({
            name: '',
            assignee: '',
            startDate: '',
            endDate: '',
            status: '미완료',
            progress: 0,
            parent: Number(parent),
            completedAt: '' // 이 부분을 추가합니다.
        });
        setShowAddModal(true);
    };

    const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAddForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            console.log('completedAt value:', addForm.completedAt); // 추가할 로그
            await axios.post(`/projects/${projectId}/notes`, {
                content: addForm.name,
                assignee: addForm.assignee,
                start_id: addForm.startDate,
                end_id: addForm.endDate,
                status: addForm.status,
                progress: Number(addForm.progress),
                parent_id: addForm.parent === 0 ? null : addForm.parent,
                completedAt: addForm.completedAt || null
            });
            setShowAddModal(false);
            fetchWbsData();
        } catch (error) {
            alert('작업 추가 실패');
        } finally {
            setLoading(false);
        }
    };

    // 트리 노드 렌더링
    const renderNode = (node: NodeModel, { isOpen, onToggle, depth }: any) => {
        const item = node.data as WbsItem;
        return (
            <div
                className="flex items-center justify-between w-full p-2 border rounded bg-white my-1"
                style={{ paddingLeft: depth > 0 ? `${depth * 24}px` : 0 }}
            >
                <div className="flex items-center gap-2">
                    {node.droppable && (
                        <button type="button" onClick={onToggle} className="focus:outline-none">
                            {isOpen ? '▼' : '▶'}
                        </button>
                    )}
                    <span>{node.text}</span>
                    {item.completedAt && (
                        <span className="text-xs text-gray-500 ml-2">완료일: {item.completedAt.split('T')[0]}</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="text-xs text-gray-500 hover:text-gray-800" onClick={() => handleAddClick(node.id)}>추가</button>
                    <button className="text-xs text-gray-500 hover:text-gray-800">수정</button>
                    <button className="text-xs text-red-500 hover:text-red-800">삭제</button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => handleAddClick(0)}>
                    + 최상위 작업 추가
                </button>
            </div>
            <SafeTree
                tree={treeData}
                rootId={0}
                render={renderNode}
                dragPreviewRender={(monitor: { item: NodeModel }) => <div>{monitor.item.text}</div>}
                onDrop={handleDrop}
                controlledProps={{
                    openIds,
                    onExpand: (id: number) => setOpenIds(ids => [...ids, id]),
                    onCollapse: (id: number) => setOpenIds(ids => ids.filter(openId => openId !== id)),
                }}
                classes={{
                    root: 'bg-gray-50 p-4 rounded-lg min-h-[300px]',
                    dropTarget: 'bg-blue-50',
                    draggingSource: 'opacity-50',
                    placeholder: 'bg-blue-100'
                }}
            />
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-lg shadow-lg min-w-[350px] space-y-4">
                        <h2 className="text-lg font-bold mb-2">작업 추가</h2>
                        <div>
                            <label className="block text-sm mb-1">이름 *</label>
                            <input name="name" value={addForm.name} onChange={handleAddFormChange} className="w-full border rounded p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">담당자</label>
                            <select name="assignee" value={addForm.assignee} onChange={handleAddFormChange} className="w-full border rounded p-2">
                                <option value="">선택</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm mb-1">시작일</label>
                                <input type="date" name="startDate" value={addForm.startDate} onChange={handleAddFormChange} className="w-full border rounded p-2" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm mb-1">마감일</label>
                                <input type="date" name="endDate" value={addForm.endDate} onChange={handleAddFormChange} className="w-full border rounded p-2" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm mb-1">완료일</label>
                                <input type="date" name="completedAt" value={addForm.completedAt} onChange={handleAddFormChange} className="w-full border rounded p-2" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm mb-1">상태</label>
                                <select name="status" value={addForm.status} onChange={handleAddFormChange} className="w-full border rounded p-2">
                                    <option value="미완료">미완료</option>
                                    <option value="진행중">진행중</option>
                                    <option value="완료">완료</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm mb-1">진척률(%)</label>
                                <input type="number" name="progress" value={addForm.progress} onChange={handleAddFormChange} min={0} max={100} className="w-full border rounded p-2" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">취소</button>
                            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>{loading ? '저장중...' : '저장'}</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default WbsBoard; 