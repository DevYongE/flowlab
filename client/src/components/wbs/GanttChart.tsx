import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { startOfMonth, endOfMonth, addDays, format, differenceInCalendarDays, parseISO, isToday } from 'date-fns';

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
  completedAt?: string | null; // 추가: 완료일
  deadline?: string | null;
  registered_at?: string | null;
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
      // 평면화 + 날짜 필드 매핑
      const flat = (nodes: any[]): WbsItem[] => {
        let arr: WbsItem[] = [];
        nodes.forEach(n => {
          arr.push({
            ...n,
            startDate: n.startDate || n.start_id || n.registered_at || null, // 등록일을 시작일로 활용
            endDate: n.endDate || n.end_id || n.deadline || null,            // deadline을 마감일로 활용
          });
          if (n.children && n.children.length > 0) arr = arr.concat(flat(n.children));
        });
        return arr;
      };
      const data = flat(res.data);
      console.log('WBS for Gantt:', data); // 디버깅용
      setWbs(data);
    });
  }, [projectId, refreshTrigger]);

  // 월간 날짜 배열
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days: Date[] = [];
  for (let d = monthStart; d <= monthEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  // 작업 바 계산 (월 경계 보정 및 마감일까지 포함, gridColumn 인덱스 보정)
  const getBarStyle = (start: string, end: string) => {
    const s = parseISO(start);
    const e = parseISO(end);
    // 월 경계 보정
    const barStart = s < monthStart ? monthStart : s;
    const barEnd = e > monthEnd ? monthEnd : e;
    // 날짜 인덱스 계산 (0-based)
    const left = differenceInCalendarDays(barStart, monthStart);
    const right = differenceInCalendarDays(barEnd, monthStart);
    return {
      gridColumnStart: left + 2, // 1은 작업명, 2부터 날짜
      gridColumnEnd: right + 3,  // 끝나는 날짜 포함, grid는 end-exclusive
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
          <div
            key={d.toISOString()}
            className={`text-xs text-center border-b py-1 ${isToday(d) ? 'bg-orange-200' : ''}`}
            style={isToday(d) ? { background: '#f59e42', color: '#fff', borderRadius: 4 } : {}}
          >
            {format(d, 'd')}
          </div>
        ))}
        {wbs.filter(w => w.startDate || w.endDate || w.deadline || w.registered_at).map(w => {
          const sRaw = w.startDate || w.registered_at || w.deadline;
          const eRaw = w.endDate || w.deadline || w.startDate || w.registered_at;
          const s = sRaw ? sRaw.slice(0, 10) : null;
          const e = eRaw ? eRaw.slice(0, 10) : null;
          if (!s || !e) return null;
          const barColor = w.completedAt ? '#22c55e' : '#3b82f6';
          const style = {
            ...getBarStyle(s, e),
            background: barColor,
            gridRow: 'auto',
          };
          return (
            <React.Fragment key={w.id}>
              <div className="border-r py-1 pr-2 text-xs whitespace-nowrap overflow-hidden overflow-ellipsis" style={{ maxWidth: 180 }}>{w.name || w.content}</div>
              <div style={style}>{w.name || w.content}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default GanttChart; 