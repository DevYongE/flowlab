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
  children?: WbsItem[];
  parent_id?: number | string | null;
  depth?: number; // 트리 구조 깊이
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
 * 간트 차트 컴포넌트 (개선된 드래그 기능)
 */
const GanttChart: React.FC<GanttChartProps> = ({ projectId, refreshTrigger }) => {
  const [wbs, setWbs] = useState<WbsItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 개선된 드래그 상태 관리
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 드래그 임계값 (픽셀)
  const DRAG_THRESHOLD = 40;

  // PC 드래그 이벤트 핸들러 (개선됨)
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
    setDragging(true);
  };

  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || dragStartX === null) return;
    
    setDragCurrentX(e.clientX);
    const dx = e.clientX - dragStartX;
    
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      if (dx > 0) {
        // 오른쪽으로 드래그: 이전달로 이동
        setCurrentMonth(d => addDays(startOfMonth(d), -1));
      } else {
        // 왼쪽으로 드래그: 다음달로 이동
        setCurrentMonth(d => addDays(endOfMonth(d), 1));
      }
      setDragging(false);
      setDragStartX(null);
      setDragCurrentX(null);
    }
  };

  const handleHeaderMouseUp = () => {
    setDragging(false);
    setDragStartX(null);
    setDragCurrentX(null);
  };

  // 모바일 터치 이벤트 핸들러 (개선됨)
  const handleHeaderTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setTouchStartX(e.touches[0].clientX);
  };

  const handleHeaderTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    
    const dx = e.touches[0].clientX - touchStartX;
    
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      if (dx > 0) {
        // 오른쪽으로 터치 드래그: 이전달로 이동
        setCurrentMonth(d => addDays(startOfMonth(d), -1));
      } else {
        // 왼쪽으로 터치 드래그: 다음달로 이동
        setCurrentMonth(d => addDays(endOfMonth(d), 1));
      }
      setTouchStartX(null);
    }
  };

  const handleHeaderTouchEnd = () => {
    setTouchStartX(null);
  };

  // 전역 마우스 이벤트 리스너 (드래그 중 마우스가 영역을 벗어나도 추적)
  useEffect(() => {
    if (!dragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragStartX === null) return;
      
      setDragCurrentX(e.clientX);
      const dx = e.clientX - dragStartX;
      
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        if (dx > 0) {
          setCurrentMonth(d => addDays(startOfMonth(d), -1));
        } else {
          setCurrentMonth(d => addDays(endOfMonth(d), 1));
        }
        setDragging(false);
        setDragStartX(null);
        setDragCurrentX(null);
      }
    };

    const handleGlobalMouseUp = () => {
      setDragging(false);
      setDragStartX(null);
      setDragCurrentX(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragging, dragStartX]);

  useEffect(() => {
    if (!projectId) return;
    axios.get(`/projects/${projectId}/wbs`).then(res => {
      // 계층구조 유지하면서 평면화 + 날짜 필드 매핑
      const flatWithHierarchy = (nodes: any[], depth: number = 0): WbsItem[] => {
        let arr: WbsItem[] = [];
        nodes.forEach(n => {
          arr.push({
            ...n,
            startDate: n.startDate || n.start_id || n.registered_at || null,
            endDate: n.endDate || n.end_id || n.deadline || null,
            depth: depth, // 현재 깊이 정보 추가
          });
          if (n.children && n.children.length > 0) {
            arr = arr.concat(flatWithHierarchy(n.children, depth + 1)); // 자식들은 깊이 +1
          }
        });
        return arr;
      };
      const flatData = flatWithHierarchy(res.data);
      setWbs(flatData);
      console.log('📊 간트 차트 데이터 로드:', flatData.length + '개 작업');
      console.log('📅 날짜 정보 요약:', flatData.map((w: WbsItem) => ({
        name: w.name || w.content,
        depth: w.depth,
        start: getDateField(w, ['startDate', 'registered_at', 'deadline']),
        end: w.completedAt ? getDateField(w, ['completedAt']) : getDateField(w, ['endDate', 'deadline', 'startDate', 'registered_at'])
      })));
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
      gridColumnEnd: Math.max(right + 3, left + 4),  // 최소 2일 너비 보장
      background: bg,
      color: 'white',
      borderRadius: 6,
      padding: '4px 8px',
      fontSize: 11,
      minWidth: 60,
      textAlign: 'center',
      zIndex: 2,
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      fontWeight: '500',
    } as React.CSSProperties;
  }

  // 드래그 상태에 따른 스타일 계산
  const getDragFeedbackStyle = () => {
    if (!dragging || dragStartX === null || dragCurrentX === null) {
      return {};
    }

    const dx = dragCurrentX - dragStartX;
    const opacity = Math.min(Math.abs(dx) / DRAG_THRESHOLD, 1) * 0.3 + 0.7;
    
    return {
      opacity,
      transform: `translateX(${Math.max(-10, Math.min(10, dx * 0.1))}px)`,
      transition: 'none',
    };
  };

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold flex items-center">
          <span className="text-blue-600 mr-2">📊</span>
          간트 차트 (계층구조)
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(d => addDays(startOfMonth(d), -1))} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors">◀</button>
          <span className="font-semibold">{format(currentMonth, 'yyyy년 MM월')}</span>
          <button onClick={() => setCurrentMonth(d => addDays(endOfMonth(d), 1))} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors">▶</button>
        </div>
      </div>
      
      {/* 드래그 안내 텍스트 */}
      <div className="text-xs text-gray-500 mb-2 text-center">
        💡 날짜 부분(1,2,3...)을 좌우로 드래그하여 월을 이동할 수 있습니다
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `300px repeat(${days.length}, 1fr)`, // 작업명 컬럼 더 넓게
          gridAutoRows: '36px',
          alignItems: 'center',
          gap: '1px',
        }}
      >
        {/* 헤더 row */}
        <div
          className="font-bold border-b py-1 bg-gray-50 sticky left-0 z-10 select-none flex items-center"
          style={{ gridRow: 1, gridColumn: 1 }}
        >
          <span className="text-blue-600 mr-2">🌲</span>
          <span>작업 구조</span>
        </div>
        
        {/* 날짜 헤더들 (드래그 가능한 영역) */}
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

          // 드래그 중일 때 커서와 배경 스타일 변경
          const isDragActive = dragging;
          const dragCursor = isDragActive ? 'grabbing' : 'grab';

          // 드래그 피드백 스타일을 개별 적용
          const dragFeedback = getDragFeedbackStyle();
          
          return (
            <div
              key={d.toISOString()}
              className={`text-xs text-center border-b py-1 transition-all duration-150 select-none ${isDragActive ? 'scale-95' : 'hover:scale-105'}`}
              style={{
                gridRow: 1,
                gridColumn: i + 2,
                background: isDragActive && !bg ? '#e3f2fd' : bg,
                color,
                borderRadius,
                cursor: dragCursor,
                userSelect: 'none',
                transform: isDragActive ? 'scale(0.98)' : undefined,
                boxShadow: isDragActive ? '0 2px 8px rgba(0,0,0,0.1)' : undefined,
                ...dragFeedback,
              }}
              onMouseDown={handleHeaderMouseDown}
              onMouseMove={handleHeaderMouseMove}
              onMouseUp={handleHeaderMouseUp}
              onMouseLeave={handleHeaderMouseUp}
              onTouchStart={handleHeaderTouchStart}
              onTouchMove={handleHeaderTouchMove}
              onTouchEnd={handleHeaderTouchEnd}
              title="드래그하여 월 이동"
            >
              {format(d, 'd')}
            </div>
          );
        })}
        {/* 각 작업 row */}
        {wbs
          .filter(w => {
            // 모든 작업을 표시하되, 날짜가 있는 경우만 막대 차트 표시
            return true;
          })
          .map((w, idx) => {
            const s = getDateField(w, ['startDate', 'registered_at', 'deadline']);
            const e = w.completedAt ? getDateField(w, ['completedAt']) : getDateField(w, ['endDate', 'deadline', 'startDate', 'registered_at']);
            const displayName = w.name || w.content || '';
            const maxLen = 15; // 작업명 길이 늘림
            const shortName = displayName.length > maxLen ? displayName.slice(0, maxLen) + '...' : displayName;
            
            // 날짜가 있고 현재 월 범위와 겹치는지 확인
            let hasValidDates = false;
            let barStyle = {};
            let dateInfo = '';
            
                        if (s && e) {
              try {
                const startDate = parseISO(s);
                const endDate = parseISO(e);
                // 날짜 범위 확인 (더 관대하게 - 3개월 전후까지 표시)
                const extendedStart = addDays(monthStart, -90);
                const extendedEnd = addDays(monthEnd, 90);
                if (!(isBefore(endDate, extendedStart) || isAfter(startDate, extendedEnd))) {
                  hasValidDates = true;
                  const completed = !!w.completedAt;
                  barStyle = getBarStyle(s, e, completed, w.deadline);
                  dateInfo = `(${s} ~ ${e}${completed ? ' (완료)' : ''})`;
                }
              } catch (error) {
                console.warn('날짜 파싱 오류:', error, { s, e });
              }
            } else if (s && !e) {
              // 시작일만 있는 경우 - 시작일부터 일주일로 설정
              try {
                const startDate = parseISO(s);
                const estimatedEnd = addDays(startDate, 7);
                const eStr = format(estimatedEnd, 'yyyy-MM-dd');
                const extendedStart = addDays(monthStart, -90);
                const extendedEnd = addDays(monthEnd, 90);
                if (!(isBefore(estimatedEnd, extendedStart) || isAfter(startDate, extendedEnd))) {
                  hasValidDates = true;
                  const completed = !!w.completedAt;
                  barStyle = getBarStyle(s, eStr, completed, w.deadline);
                  dateInfo = `(${s} ~ ${eStr} 추정)`;
                }
              } catch (error) {
                console.warn('시작일 파싱 오류:', error, { s });
              }
            } else if (!s && e) {
              // 종료일만 있는 경우 - 일주일 전부터 종료일까지
              try {
                const endDate = parseISO(e);
                const estimatedStart = addDays(endDate, -7);
                const sStr = format(estimatedStart, 'yyyy-MM-dd');
                const extendedStart = addDays(monthStart, -90);
                const extendedEnd = addDays(monthEnd, 90);
                if (!(isBefore(endDate, extendedStart) || isAfter(estimatedStart, extendedEnd))) {
                  hasValidDates = true;
                  const completed = !!w.completedAt;
                  barStyle = getBarStyle(sStr, e, completed, w.deadline);
                  dateInfo = `(${sStr} 추정 ~ ${e})`;
                }
              } catch (error) {
                console.warn('종료일 파싱 오류:', error, { e });
              }
            }
            
            return (
              <React.Fragment key={w.id}>
                {/* 작업명 셀 */}
                <div
                  className="border-r py-1 pr-2 text-xs whitespace-nowrap overflow-hidden overflow-ellipsis bg-white sticky left-0 z-10 select-none flex items-center"
                  style={{ 
                    gridRow: idx + 2, 
                    gridColumn: 1, 
                    maxWidth: 280, // 컬럼 크기에 맞춰 조정
                    cursor: 'default',
                    paddingLeft: `${(w.depth || 0) * 20 + 8}px`, // 들여쓰기 적용
                  }}
                  title={`${displayName}${dateInfo ? ' ' + dateInfo : ' (날짜 없음)'} (레벨: ${w.depth || 0})`}
                >
                  {/* 트리 구조 표시를 위한 인디케이터 */}
                  <div className="flex items-center flex-1">
                    {(w.depth || 0) > 0 && (
                      <div className="flex items-center mr-2">
                        {/* 들여쓰기 선 */}
                        {Array.from({ length: (w.depth || 0) - 1 }, (_, i) => (
                          <span key={i} className="text-gray-300 mr-1">│</span>
                        ))}
                        {/* 마지막 연결선 */}
                        <span className="text-gray-300 mr-1">├</span>
                      </div>
                    )}
                    
                    {/* 레벨에 따른 색상 표시 */}
                    <div 
                      className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                        (w.depth || 0) === 0 ? 'bg-blue-500' :
                        (w.depth || 0) === 1 ? 'bg-green-500' :
                        (w.depth || 0) === 2 ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`}
                    />
                    
                    <span className="flex-1 font-medium" style={{
                      fontSize: `${Math.max(10, 12 - (w.depth || 0))}px`,
                      fontWeight: (w.depth || 0) === 0 ? '600' : '400'
                    }}>
                      {shortName}
                      {!hasValidDates && <span className="text-gray-400 ml-1">(날짜없음)</span>}
                      {(w.depth || 0) === 0 && <span className="text-blue-600 ml-1 text-xs">📁</span>}
                    </span>
                  </div>
                </div>
                
                {/* 바 셀 - 날짜가 있는 경우에만 표시 */}
                {hasValidDates && (
                  <div
                    style={{ 
                      ...barStyle, 
                      gridRow: idx + 2, 
                      maxWidth: 150, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}
                    title={`${displayName} ${dateInfo}`}
                  >
                    {shortName}
                  </div>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};

export default GanttChart; 