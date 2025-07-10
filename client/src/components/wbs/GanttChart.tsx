import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { startOfMonth, endOfMonth, addDays, format, differenceInCalendarDays, isWithinInterval, parseISO } from 'date-fns';

interface GanttChartProps {
  projectId: string;
  refreshTrigger?: number;
}

interface WbsItem {
  id: number | string;
  name?: string;
  content?: string;
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * WBS 간트 차트 컴포넌트
 * @param projectId - 프로젝트 ID
 * @param refreshTrigger - WBS 새로고침 트리거
 */
const GanttChart: React.FC<GanttChartProps> = ({ projectId, refreshTrigger }) => {
  const [wbs, setWbs] = useState<WbsItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!projectId) return;
    axios.get(`/projects/${projectId}/wbs`).then(res => {
      // 평면화
      const flat = (nodes: any[]): WbsItem[] => {
        let arr: WbsItem[] = [];
        nodes.forEach(n => {
          arr.push(n);
          if (n.children && n.children.length > 0) arr = arr.concat(flat(n.children));
        });
        return arr;
      };
      setWbs(flat(res.data));
    });
  }, [projectId, refreshTrigger]);

  // 월간 날짜 배열
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days: Date[] = [];
  for (let d = monthStart; d <= monthEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  // 작업 바 계산
  const getBarStyle = (start: string, end: string) => {
    const s = parseISO(start);
    const e = parseISO(end);
    const left = differenceInCalendarDays(s, monthStart);
    const width = differenceInCalendarDays(e, s) + 1;
    return {
      gridColumnStart: left + 1,
      gridColumnEnd: left + width + 1,
      background: '#3b82f6',
      color: 'white',
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 12,
      minWidth: 40,
      textAlign: 'center',
    } as React.CSSProperties;
  };

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">간트 차트</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(d => addDays(startOfMonth(d), -1))} className="px-2 py-1 rounded bg-gray-100">◀</button>
          <span className="font-semibold">{format(currentMonth, 'yyyy년 MM월')}</span>
          <button onClick={() => setCurrentMonth(d => addDays(endOfMonth(d), 1))} className="px-2 py-1 rounded bg-gray-100">▶</button>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}>
        <div className="font-bold border-b py-1">작업명</div>
        {days.map(d => (
          <div key={d.toISOString()} className="text-xs text-center border-b py-1">
            {format(d, 'd')}
          </div>
        ))}
        {wbs.filter(w => w.startDate && w.endDate).map(w => (
          <React.Fragment key={w.id}>
            <div className="border-r py-1 pr-2 text-xs whitespace-nowrap overflow-hidden overflow-ellipsis" style={{ maxWidth: 180 }}>{w.name || w.content}</div>
            <div className="col-span-full flex items-center" style={{ gridColumn: `2 / span ${days.length}` }}>
              {/* 바 표시 */}
              {(() => {
                const s = w.startDate!;
                const e = w.endDate!;
                if (!s || !e) return null;
                // 바가 월 범위 내에 있는지 체크
                const sDate = parseISO(s);
                const eDate = parseISO(e);
                if (
                  isWithinInterval(sDate, { start: monthStart, end: monthEnd }) ||
                  isWithinInterval(eDate, { start: monthStart, end: monthEnd }) ||
                  (sDate < monthStart && eDate > monthEnd)
                ) {
                  // 바 스타일 계산
                  const style = getBarStyle(s < format(monthStart, 'yyyy-MM-dd') ? format(monthStart, 'yyyy-MM-dd') : s, e > format(monthEnd, 'yyyy-MM-dd') ? format(monthEnd, 'yyyy-MM-dd') : e);
                  return <div style={style}>{w.name || w.content}</div>;
                }
                return null;
              })()}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default GanttChart; 