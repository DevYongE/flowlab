import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import axios from '../../lib/axios';

// 타입 정의
interface WbsItem {
    id: number | string;
    name: string;
    children: WbsItem[];
    // TODO: assignee_name, start_date, end_date 등 추가 필드
}

interface WbsBoardProps {
    projectId: string;
}

const WbsBoard: React.FC<WbsBoardProps> = ({ projectId }) => {
    const [wbsData, setWbsData] = useState<WbsItem[]>([]);

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

    useEffect(() => {
        fetchWbsData();
    }, [fetchWbsData]);

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        // TODO: 드래그앤드롭 로직 구현
        console.log('Drag ended:', result);
        alert('드래그앤드롭 기능은 구현 중입니다.');
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
                        <span>{item.name}</span>
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
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="flex justify-end mb-4">
                 <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
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
    );
};

export default WbsBoard; 