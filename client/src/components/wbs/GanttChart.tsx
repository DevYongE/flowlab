import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  parseISO, 
  isBefore, 
  isAfter, 
  addDays, 
  getDay, 
  isToday,
  differenceInCalendarDays
} from 'date-fns';
import { ko } from 'date-fns/locale';
import axios from '../../lib/axios';

const HOLIDAYS = [
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
  '2025-03-01', '2025-05-05', '2025-06-06', '2025-08-15',
  '2025-10-03', '2025-10-09', '2025-12-25'
];

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
  depth?: number;
}

interface GanttChartProps {
  projectId: string;
  refreshTrigger?: number;
}

// 날짜 필드 우선순위에 따라 가져오기
function getDateField(item: WbsItem, keys: (keyof WbsItem)[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (value && typeof value === 'string' && value.trim() !== '') {
      // 날짜 형식 검증
      try {
        parseISO(value);
        return value;
      } catch {
        continue;
      }
    }
  }
  return null;
}

const GanttChart: React.FC<GanttChartProps> = ({ projectId, refreshTrigger }) => {
  const [wbs, setWbs] = useState<WbsItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const DRAG_THRESHOLD = 40;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 드래그 핸들러들은 기존과 동일하므로 생략...
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragStartX(e.clientX);
  };

  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging && dragStartX !== null) {
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        const direction = dx > 0 ? 1 : -1;
        const newMonth = addDays(startOfMonth(currentMonth), direction > 0 ? 32 : -1);
        setCurrentMonth(newMonth);
        setDragging(false);
        setDragStartX(null);
      }
    }
  };

  const handleHeaderMouseUp = () => {
    setDragging(false);
    setDragStartX(null);
  };

  // WBS 데이터 로드
  useEffect(() => {
    const fetchWbs = async () => {
      try {
        const response = await axios.get(`/projects/${projectId}/wbs`);
        const rawData = response.data || [];
        
        // 계층구조로 변환
        const flatWithHierarchy = (nodes: any[], depth: number = 0): WbsItem[] => {
          return nodes.reduce((acc: WbsItem[], node: any) => {
            const item: WbsItem = {
              id: node.id,
              name: node.name,
              content: node.content,
              startDate: node.startDate,
              endDate: node.endDate,
              completedAt: node.completedAt,
              deadline: node.deadline,
              registered_at: node.registered_at,
              parent_id: node.parent_id,
              depth
            };
            acc.push(item);
            if (node.children && node.children.length > 0) {
              acc.push(...flatWithHierarchy(node.children, depth + 1));
            }
            return acc;
          }, []);
        };

        const hierarchicalData = flatWithHierarchy(rawData);
        setWbs(hierarchicalData);
        console.log('WBS 데이터 로드 완료:', hierarchicalData);
      } catch (error) {
        console.error('WBS 데이터 로드 실패:', error);
      }
    };

    if (projectId) {
      fetchWbs();
    }
  }, [projectId, refreshTrigger]);

  // 간트 바 스타일 계산 - 완전히 새로 작성
  function getBarStyle(startStr: string, endStr: string, completed: boolean, deadline?: string | null, rowIndex: number = 0) {
    try {
      const startDate = parseISO(startStr);
      const endDate = parseISO(endStr);
      
      // 현재 월 범위 내에서의 시작/끝 날짜 계산
      const barStart = isBefore(startDate, monthStart) ? monthStart : startDate;
      const barEnd = isAfter(endDate, monthEnd) ? monthEnd : endDate;
      
      // 그리드 컬럼 위치 계산 (1-based, 첫 번째 컬럼은 작업명)
      const startColumn = differenceInCalendarDays(barStart, monthStart) + 2;
      const endColumn = differenceInCalendarDays(barEnd, monthStart) + 3;
      
      // 최소 1일 폭 보장
      const finalEndColumn = Math.max(endColumn, startColumn + 1);
      
      // 색상 결정
      let backgroundColor = '#3b82f6'; // 기본 파란색
      if (completed) {
        backgroundColor = '#22c55e'; // 완료된 작업은 초록색
      } else if (deadline) {
        try {
          const deadlineDate = parseISO(deadline);
          if (isBefore(deadlineDate, new Date())) {
            backgroundColor = '#ef4444'; // 마감일 지난 작업은 빨간색
          }
        } catch (e) {
          // deadline 파싱 실패 시 기본 색상 유지
        }
      }
      
      console.log(`바 스타일 계산:`, {
        작업: startStr + ' ~ ' + endStr,
        컬럼범위: `${startColumn} ~ ${finalEndColumn}`,
        색상: backgroundColor
      });
      
      return {
        gridColumnStart: startColumn,
        gridColumnEnd: finalEndColumn,
        gridRow: rowIndex + 2, // 헤더 다음부터 시작
        backgroundColor,
        color: 'white',
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: '500',
        textAlign: 'center' as const,
        zIndex: 1,
        minHeight: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const
      };
    } catch (error) {
      console.error('바 스타일 계산 오류:', error);
      return {};
    }
  }

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <span className="text-blue-600 mr-2">📊</span>
          간트 차트 (계층구조)
        </h2>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} 
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ◀ 이전월
          </button>
          <span className="font-semibold text-lg px-4">
            {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
          </span>
          <button 
            onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} 
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            다음월 ▶
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-4 text-center">
        💡 날짜 헤더를 좌우로 드래그하여 월을 이동할 수 있습니다
      </div>

      <div
        className="grid gap-0 border border-gray-200"
        style={{
          gridTemplateColumns: `280px repeat(${days.length}, 1fr)`,
          gridAutoRows: '32px',
          minHeight: '400px'
        }}
      >
        {/* 헤더 - 작업명 컬럼 */}
        <div
          className="font-bold text-center py-2 bg-gray-100 border-r border-gray-200 flex items-center justify-center"
          style={{ gridRow: 1, gridColumn: 1 }}
        >
          <span className="text-blue-600 mr-2">🌲</span>
          <span>작업 구조</span>
        </div>
        
        {/* 헤더 - 날짜 컬럼들 */}
        {days.map((day, index) => {
          const dayNum = getDay(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          
          let bgColor = 'bg-gray-50';
          let textColor = 'text-gray-700';
          
          if (HOLIDAYS.includes(dateStr)) {
            bgColor = 'bg-red-100';
            textColor = 'text-red-600';
          } else if (dayNum === 0) { // 일요일
            bgColor = 'bg-red-50';
            textColor = 'text-red-500';
          } else if (dayNum === 6) { // 토요일
            bgColor = 'bg-blue-50';
            textColor = 'text-blue-500';
          } else if (isToday(day)) {
            bgColor = 'bg-orange-100';
            textColor = 'text-orange-600';
          }
          
          return (
            <div
              key={day.toISOString()}
              className={`text-xs text-center py-2 border-r border-gray-200 cursor-grab hover:bg-gray-200 transition-colors ${bgColor} ${textColor}`}
              style={{
                gridRow: 1,
                gridColumn: index + 2
              }}
              onMouseDown={handleHeaderMouseDown}
              onMouseMove={handleHeaderMouseMove}
              onMouseUp={handleHeaderMouseUp}
              onMouseLeave={handleHeaderMouseUp}
              title={`${format(day, 'yyyy-MM-dd')} (${format(day, 'E', { locale: ko })})`}
            >
              <div className="font-semibold">{format(day, 'd')}</div>
              <div className="text-xs opacity-75">{format(day, 'E', { locale: ko })}</div>
            </div>
          );
        })}
        
        {/* 작업 행들 */}
        {wbs.map((task, index) => {
          // 날짜 추출
          const startDate = getDateField(task, ['startDate', 'registered_at']);
          const endDate = task.completedAt ? 
            getDateField(task, ['completedAt']) : 
            getDateField(task, ['endDate', 'deadline']);
          
          const displayName = task.name || task.content || '무제';
          const isCompleted = !!task.completedAt;
          
          // 현재 월 범위에 있는지 확인
          let showBar = false;
          let actualStartDate = startDate;
          let actualEndDate = endDate;
          
          if (startDate && endDate) {
            try {
              const start = parseISO(startDate);
              const end = parseISO(endDate);
              // 작업 기간이 현재 월과 겹치는지 확인
              if (!(isBefore(end, monthStart) || isAfter(start, monthEnd))) {
                showBar = true;
              }
            } catch (e) {
              console.warn('날짜 파싱 오류:', e);
            }
          } else if (startDate && !endDate) {
            // 시작일만 있는 경우 3일 기간으로 가정
            try {
              const start = parseISO(startDate);
              const estimatedEnd = addDays(start, 3);
              actualEndDate = format(estimatedEnd, 'yyyy-MM-dd');
              if (!(isBefore(estimatedEnd, monthStart) || isAfter(start, monthEnd))) {
                showBar = true;
              }
            } catch (e) {
              console.warn('시작일 파싱 오류:', e);
            }
          } else if (!startDate && endDate) {
            // 종료일만 있는 경우 3일 기간으로 가정
            try {
              const end = parseISO(endDate);
              const estimatedStart = addDays(end, -3);
              actualStartDate = format(estimatedStart, 'yyyy-MM-dd');
              if (!(isBefore(end, monthStart) || isAfter(estimatedStart, monthEnd))) {
                showBar = true;
              }
            } catch (e) {
              console.warn('종료일 파싱 오류:', e);
            }
          }
          
          const barStyle = showBar && actualStartDate && actualEndDate ? 
            getBarStyle(actualStartDate, actualEndDate, isCompleted, task.deadline, index) : 
            {};
          
          console.log(`작업 ${index}:`, {
            이름: displayName,
            시작일: actualStartDate,
            종료일: actualEndDate,
            바표시: showBar,
            스타일: barStyle
          });
          
          return (
            <React.Fragment key={`task-${task.id}`}>
              {/* 작업명 셀 */}
              <div
                className="px-2 py-1 text-xs border-r border-b border-gray-200 bg-white flex items-center"
                style={{
                  gridRow: index + 2,
                  gridColumn: 1,
                  paddingLeft: `${(task.depth || 0) * 16 + 8}px`
                }}
                title={`${displayName} (${actualStartDate || '시작일 없음'} ~ ${actualEndDate || '종료일 없음'})`}
              >
                {/* 계층 구조 표시 */}
                <div className="flex items-center flex-1">
                  {(task.depth || 0) > 0 && (
                    <div className="flex items-center mr-2">
                      {Array.from({ length: (task.depth || 0) - 1 }, (_, i) => (
                        <span key={i} className="text-gray-300 mr-1">│</span>
                      ))}
                      <span className="text-gray-300 mr-1">├</span>
                    </div>
                  )}
                  
                  <div 
                    className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                      (task.depth || 0) === 0 ? 'bg-blue-500' :
                      (task.depth || 0) === 1 ? 'bg-green-500' :
                      (task.depth || 0) === 2 ? 'bg-orange-500' : 'bg-gray-400'
                    }`}
                  />
                  
                  <span 
                    className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : ''}`}
                    style={{
                      fontSize: `${Math.max(10, 12 - (task.depth || 0))}px`,
                      fontWeight: (task.depth || 0) === 0 ? '600' : '400'
                    }}
                  >
                    {displayName.length > 20 ? displayName.slice(0, 20) + '...' : displayName}
                    {!showBar && <span className="text-gray-400 text-xs ml-1">(기간없음)</span>}
                    {(task.depth || 0) === 0 && <span className="text-blue-600 ml-1">📁</span>}
                  </span>
                </div>
              </div>
              
              {/* 간트 바 */}
              {showBar && actualStartDate && actualEndDate && (
                <div
                  style={barStyle}
                  title={`${displayName}: ${actualStartDate} ~ ${actualEndDate}${isCompleted ? ' (완료)' : ''}`}
                >
                  {displayName.length > 10 ? displayName.slice(0, 10) + '...' : displayName}
                </div>
              )}
            </React.Fragment>
          );
        })}
        
        {/* 빈 상태 메시지 */}
        {wbs.length === 0 && (
          <div 
            className="col-span-full text-center text-gray-500 py-8"
            style={{ gridColumn: `1 / -1` }}
          >
            WBS 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart; 