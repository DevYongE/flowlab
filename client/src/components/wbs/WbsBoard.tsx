import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import axios from '../../lib/axios';

// 타입 정의
interface WbsItem {
    id: number | string;
    name: string;
    content?: string;
    children: WbsItem[];
    // TODO: assignee_name, start_date, end_date 등 추가 필드
}

interface User {
    id: string;
    name: string;
}

interface WbsBoardProps {
    projectId: string;
}

const WbsBoard: React.FC<WbsBoardProps> = ({ projectId }) => {
    const [wbsData, setWbsData] = useState<WbsItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '',
        assignee: '',
        startDate: '',
        endDate: '',
        status: '미완료',
        progress: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchWbsData = useCallback(async () => {
        if (!projectId) return;
        try {
            const wbsRes = await axios.get(`/projects/${projectId}/wbs`);
            setWbsData(wbsRes.data);
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

    // 트리 구조에서 아이템을 이동시키는 유틸 함수
    function moveItemInTree(tree: WbsItem[], source: { droppableId: string, index: number }, destination: { droppableId: string, index: number }) {
        // 1. source에서 아이템 꺼내기
        let item: WbsItem | null = null;
        let newTree = [...tree];
        function removeItem(nodes: WbsItem[], id: string | number): WbsItem | null {
            for (let i = 0; i < nodes.length; i++) {
                if (String(nodes[i].id) === String(id)) {
                    return nodes.splice(i, 1)[0];
                }
                if (nodes[i].children) {
                    const found = removeItem(nodes[i].children, id);
                    if (found) return found;
                }
            }
            return null;
        }
        // source droppableId에서 source.index의 아이템 id 찾기
        let sourceList = newTree;
        if (source.droppableId !== 'droppable-root') {
            const parentId = source.droppableId.replace('droppable-', '');
            const findParent = (nodes: WbsItem[], id: string | number): WbsItem | null => {
                for (const n of nodes) {
                    if (String(n.id) === String(id)) return n;
                    if (n.children) {
                        const found = findParent(n.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };
            const parent = findParent(newTree, parentId);
            if (parent) sourceList = parent.children;
        }
        item = sourceList[source.index];
        if (!item) return newTree;
        // 2. 아이템 제거
        removeItem(newTree, item.id);
        // 3. destination에 삽입
        let destList = newTree;
        if (destination.droppableId !== 'droppable-root') {
            const parentId = destination.droppableId.replace('droppable-', '');
            const findParent = (nodes: WbsItem[], id: string | number): WbsItem | null => {
                for (const n of nodes) {
                    if (String(n.id) === String(id)) return n;
                    if (n.children) {
                        const found = findParent(n.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };
            const parent = findParent(newTree, parentId);
            if (parent) destList = parent.children;
        }
        destList.splice(destination.index, 0, item);
        return newTree;
    }

    // 트리 구조를 서버에 보낼 평탄화(flat) 구조로 변환
    function flattenTree(nodes: WbsItem[], parentId: string | number | null = null): any[] {
        let arr: any[] = [];
        nodes.forEach((node, idx) => {
            arr.push({ id: node.id, parent_id: parentId, order: idx });
            if (node.children && node.children.length > 0) {
                arr = arr.concat(flattenTree(node.children, node.id));
            }
        });
        return arr;
    }

    const handleOnDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        if (
            result.source.droppableId === result.destination.droppableId &&
            result.source.index === result.destination.index
        ) {
            return;
        }
        // 1. 트리에서 아이템 이동
        const newTree = moveItemInTree(wbsData, result.source, result.destination);
        // 2. 평탄화 구조로 변환
        const flat = flattenTree(newTree);
        try {
            await axios.patch(`/projects/notes/structure/${projectId}`, { structure: flat });
            fetchWbsData();
        } catch (e) {
            alert('순서/계층 변경 실패');
        }
    };

    const handleAddClick = () => {
        setAddForm({
            name: '',
            assignee: '',
            startDate: '',
            endDate: '',
            status: '미완료',
            progress: 0
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
            await axios.post(`/projects/${projectId}/notes`, {
                content: addForm.name,
                assignee: addForm.assignee,
                start_date: addForm.startDate,
                end_date: addForm.endDate,
                status: addForm.status,
                progress: Number(addForm.progress)
            });
            setShowAddModal(false);
            fetchWbsData();
        } catch (error) {
            alert('작업 추가 실패');
        } finally {
            setLoading(false);
        }
    };

    const renderWbsItem = (item: WbsItem, index: number) => (
        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
            {(provided, snapshot) => (
                <div>
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-3 my-2 rounded-md shadow-sm ${snapshot.isDragging ? 'bg-blue-100' : 'bg-white'} border flex justify-between items-center`}
                    >
                        <span>{item.name || item.content}</span>
                        <div className="flex gap-2">
                            <button className="text-xs text-gray-500 hover:text-gray-800">추가</button>
                            <button className="text-xs text-gray-500 hover:text-gray-800">수정</button>
                            <button className="text-xs text-red-500 hover:text-red-800">삭제</button>
                        </div>
                    </div>
                    {item.children && item.children.length > 0 && (
                        <div className="ml-6 border-l-2 pl-4">
                            <Droppable droppableId={`droppable-${item.id}`} type="ITEM">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {item.children.map((child, childIndex) => renderWbsItem(child, childIndex))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );

    return (
        <>
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="flex justify-end mb-4">
                 <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={handleAddClick}>
                    + 최상위 작업 추가
                </button>
            </div>
            <Droppable droppableId="droppable-root" type="ITEM">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-50 p-4 rounded-lg min-h-[300px]">
                        {wbsData.length > 0 ? (
                            wbsData.map((item, index) => renderWbsItem(item, index))
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                WBS가 비어있습니다. 작업을 추가해주세요.
                            </div>
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
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