import React, { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import {
  startOfMonth,
  endOfMonth,
  addDays,
  format,
  differenceInCalendarDays,
  parseISO,
  isToday,
  isBefore,
  isAfter,
  isWithinInterval,
  getDay
} from 'date-fns';

/**
 * WBS 항목 타입
 */
interface WbsItem {
  id: number | string;
  name?: string;
  content?: string;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  deadline?: string | null;
  registered_at?: string | null;
}

/**
 * GanttChart 컴포넌트 Props
 */
interface GanttChartProps {
  projectId: string;
  refreshTrigger?: number;
}

/**
 * 날짜 필드에서 유효한 날짜(YYYY-MM-DD)를 추출
 */
function getDateField(item: WbsItem, keys: (keyof WbsItem)[]): string | null {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.length >= 10) return v.slice(0, 10);
  }
  return null;
}

// 한국 공휴일 예시 (YYYY-MM-DD)
const HOLIDAYS = [
  '2024-07-17', // 제헌절
  // 필요시 추가
];

/**
 * 간트 차트 컴포넌트 (최적 구조)
 */
const GanttChart: React.FC<GanttChartProps> = ({ projectId, refreshTrigger }) => {
  const [wbs, setWbs] = useState<WbsItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 드래그로 월 넘기기 상태
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  // 드래그 이벤트 핸들러 (PC)
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragStartX(e.clientX);
    setDragging(true);
  };
  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || dragStartX === null) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 60) { // 60px 이상 드래그 시 월 이동
      if (dx > 0) setCurrentMonth(d => addDays(startOfMonth(d), -1)); // 왼쪽으로 드래그: 이전달
      else setCurrentMonth(d => addDays(endOfMonth(d), 1)); // 오른쪽: 다음달
      setDragging(false);
      setDragStartX(null);
    }
  };
  const handleHeaderMouseUp = () => {
    setDragging(false);
    setDragStartX(null);
  };
  // 드래그 이벤트 핸들러 (모바일)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleHeaderTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleHeaderTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const dx = e.touches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx > 0) setCurrentMonth(d => addDays(startOfMonth(d), -1));
      else setCurrentMonth(d => addDays(endOfMonth(d), 1));
      setTouchStartX(null);
    }
  };
  const handleHeaderTouchEnd = () => {
    setTouchStartX(null);
  };

  useEffect(() => {
    if (!projectId) return;
    axios.get(`/projects/${projectId}/wbs`).then(res => {
      // 평면화 + 날짜 필드 매핑
      const flat = (nodes: any[]): WbsItem[] => {
        let arr: WbsItem[] = [];
        nodes.forEach(n => {
          arr.push({
            ...n,
            startDate: n.startDate || n.start_id || n.registered_at || null,
            endDate: n.endDate || n.end_id || n.deadline || null,
          });
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

  // 작업 바 스타일 계산
  function getBarStyle(start: string, end: string, completed: boolean, deadline?: string | null) {
    const s = parseISO(start);
    const e = parseISO(end);
    // 월 경계 보정
    const barStart = isBefore(s, monthStart) ? monthStart : s;
    const barEnd = isAfter(e, monthEnd) ? monthEnd : e;
    // 날짜 인덱스 계산 (0-based)
    const left = differenceInCalendarDays(barStart, monthStart);
    const right = differenceInCalendarDays(barEnd, monthStart);
    // 색상
    let bg = completed ? '#22c55e' : '#3b82f6';
    if (!completed && deadline) {
      const d = parseISO(deadline);
      if (isWithinInterval(d, { start: monthStart, end: monthEnd }) && isBefore(d, new Date())) {
        bg = '#ef4444'; // 마감일 지남(빨강)
      }
    }
    return {
      gridColumnStart: left + 2, // 1은 작업명, 2부터 날짜
      gridColumnEnd: right + 3,  // 끝나는 날짜 포함, grid는 end-exclusive
      background: bg,
      color: 'white',
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 12,
      minWidth: 40,
      textAlign: 'center',
      zIndex: 2,
      position: 'relative',
    } as React.CSSProperties;
  }

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
      <div
        className="grid"
        style={{
          gridTemplateColumns: `200px repeat(${days.length}, 1fr)`,
          gridAutoRows: '32px',
          alignItems: 'center',
        }}
      >
        {/* 헤더 row */}
        <div
          className="font-bold border-b py-1 bg-gray-50 sticky left-0 z-10"
          style={{ gridRow: 1, gridColumn: 1 }}
        >
          작업명
        </div>
        {days.map((d, i) => {
          const dayNum = getDay(d); // 0:일, 6:토
          const dateStr = format(d, 'yyyy-MM-dd');
          let bg = undefined;
          let color = undefined;
          let borderRadius = isToday(d) ? 4 : undefined;
          if (HOLIDAYS.includes(dateStr)) {
            bg = '#ef4444'; // 공휴일 빨강
            color = '#fff';
          } else if (dayNum === 0) {
            bg = '#fee2e2'; // 일요일 연한 빨강
            color = '#ef4444';
          } else if (dayNum === 6) {
            bg = '#dbeafe'; // 토요일 연한 파랑
            color = '#2563eb';
          } else if (isToday(d)) {
            bg = '#f59e42';
            color = '#fff';
          }
          return (
            <div
              key={d.toISOString()}
              className={`text-xs text-center border-b py-1`}
              style={{
                gridRow: 1,
                gridColumn: i + 2,
                background: bg,
                color,
                borderRadius,
                cursor: 'grab',
                userSelect: 'none',
              }}
              onMouseDown={i === 0 ? handleHeaderMouseDown : undefined}
              onMouseMove={i === 0 ? handleHeaderMouseMove : undefined}
              onMouseUp={i === 0 ? handleHeaderMouseUp : undefined}
              onMouseLeave={i === 0 ? handleHeaderMouseUp : undefined}
              onTouchStart={i === 0 ? handleHeaderTouchStart : undefined}
              onTouchMove={i === 0 ? handleHeaderTouchMove : undefined}
              onTouchEnd={i === 0 ? handleHeaderTouchEnd : undefined}
            >
              {format(d, 'd')}
            </div>
          );
        })}
        {/* 각 작업 row */}
        {wbs
          .filter(w => {
            // 시작/종료일 추출
            const s = getDateField(w, ['startDate', 'registered_at', 'deadline']);
            // 끝나는 날짜: 완료(completedAt)가 있으면 무조건 그 날짜, 없으면 기존 로직
            const e = w.completedAt ? getDateField(w, ['completedAt']) : getDateField(w, ['endDate', 'deadline', 'startDate', 'registered_at']);
            if (!s || !e) return false;
            const startDate = parseISO(s);
            const endDate = parseISO(e);
            if (isBefore(endDate, monthStart)) return false;
            if (isAfter(startDate, monthEnd)) return false;
            return true;
          })
          .map((w, idx) => {
            const s = getDateField(w, ['startDate', 'registered_at', 'deadline']);
            const e = w.completedAt ? getDateField(w, ['completedAt']) : getDateField(w, ['endDate', 'deadline', 'startDate', 'registered_at']);
            if (!s || !e) return null;
            const completed = !!w.completedAt;
            const barStyle = getBarStyle(s, e, completed, w.deadline);
            const displayName = w.name || w.content || '';
            const maxLen = 10;
            const shortName = displayName.length > maxLen ? displayName.slice(0, maxLen) + '...' : displayName;
            return (
              <React.Fragment key={w.id}>
                {/* 작업명 셀 */}
                <div
                  className="border-r py-1 pr-2 text-xs whitespace-nowrap overflow-hidden overflow-ellipsis bg-white sticky left-0 z-10"
                  style={{ gridRow: idx + 2, gridColumn: 1, maxWidth: 120 }}
                  title={displayName}
                >
                  {shortName}
                </div>
                {/* 바 셀 */}
                <div
                  style={{ ...barStyle, gridRow: idx + 2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={`${displayName} (${s} ~ ${e}${completed ? ' (완료)' : ''})`}
                >
                  {shortName}
                </div>
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};

export default GanttChart; 