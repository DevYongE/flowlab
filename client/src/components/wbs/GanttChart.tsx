import React from 'react';

interface GanttChartProps {
  projectId: string;
  refreshTrigger?: number;
}

const GanttChart: React.FC<GanttChartProps> = ({ projectId, refreshTrigger }) => {
  // TODO: WBS 데이터 fetch 및 간트 차트 렌더링 구현
  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold mb-4">간트 차트 (준비중)</h2>
      <p>프로젝트 ID: {projectId}</p>
      {/* 실제 간트 차트 구현 예정 */}
    </div>
  );
};

export default GanttChart; 