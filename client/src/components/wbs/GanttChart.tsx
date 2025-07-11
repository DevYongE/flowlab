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

  // 간트 바 스타일 계산 - 마감일까지 표시하고 완료 부분은 색상으로 구분
  function getBarStyle(startStr: string, deadlineStr: string, completed: boolean, completedStr?: string | null, rowIndex: number = 0) {
    try {
      const startDate = parseISO(startStr);
      const deadlineDate = parseISO(deadlineStr);
      
      // 현재 월 범위 내에서의 시작/끝 날짜 계산
      const barStart = isBefore(startDate, monthStart) ? monthStart : startDate;
      const barEnd = isAfter(deadlineDate, monthEnd) ? monthEnd : deadlineDate;
      
      // 그리드 컬럼 위치 계산 (1-based, 첫 번째 컬럼은 작업명)
      const startColumn = differenceInCalendarDays(barStart, monthStart) + 2;
      const endColumn = differenceInCalendarDays(barEnd, monthStart) + 3;
      
      // 최소 1일 폭 보장
      const finalEndColumn = Math.max(endColumn, startColumn + 1);
      
      // 기본 색상 결정 (마감일 기준)
      let backgroundColor = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; // 기본 파란색 그라데이션
      let borderColor = '#1d4ed8';
      let textShadow = '0 1px 2px rgba(0,0,0,0.3)';
      
      if (isBefore(deadlineDate, new Date()) && !completed) {
        backgroundColor = 'linear-gradient(135deg, #ef4444, #dc2626)'; // 마감일 지난 작업은 빨간색 그라데이션
        borderColor = '#dc2626';
      } else if (completed) {
        backgroundColor = 'linear-gradient(135deg, #22c55e, #16a34a)'; // 완료된 작업은 초록색 그라데이션
        borderColor = '#16a34a';
      }
      
      console.log(`바 스타일 계산:`, {
        작업: startStr + ' ~ ' + deadlineStr,
        컬럼범위: `${startColumn} ~ ${finalEndColumn}`,
        색상: backgroundColor,
        완료: completed
      });
      
      return {
        gridColumnStart: startColumn,
        gridColumnEnd: finalEndColumn,
        gridRow: rowIndex + 2, // 헤더 다음부터 시작
        background: backgroundColor,
        color: 'white',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        textAlign: 'center' as const,
        zIndex: 1,
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
        border: `3px solid ${borderColor}`,
        margin: '4px 2px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        textShadow,
        position: 'relative' as const
      };
    } catch (error) {
      console.error('바 스타일 계산 오류:', error);
      return {};
    }
  }

  // 완료 진행도 바 스타일 계산 (완료된 부분만 표시)
  function getCompletedBarStyle(startStr: string, deadlineStr: string, completedStr: string, rowIndex: number = 0) {
    try {
      const startDate = parseISO(startStr);
      const completedDate = parseISO(completedStr);
      
      // 현재 월 범위 내에서의 시작/완료 날짜 계산
      const barStart = isBefore(startDate, monthStart) ? monthStart : startDate;
      const barEnd = isAfter(completedDate, monthEnd) ? monthEnd : completedDate;
      
      // 그리드 컬럼 위치 계산
      const startColumn = differenceInCalendarDays(barStart, monthStart) + 2;
      const endColumn = differenceInCalendarDays(barEnd, monthStart) + 3;
      
      // 최소 1일 폭 보장
      const finalEndColumn = Math.max(endColumn, startColumn + 1);
      
      return {
        gridColumnStart: startColumn,
        gridColumnEnd: finalEndColumn,
        gridRow: rowIndex + 2,
        background: 'linear-gradient(135deg, #10b981, #059669)', // 완료된 부분은 에메랄드 그라데이션
        color: 'white',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '700',
        textAlign: 'center' as const,
        zIndex: 2, // 기본 바보다 위에 표시
        minHeight: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 12px rgba(0,0,0,0.2), 0 4px 8px rgba(16,185,129,0.3)',
        border: '3px solid #059669',
        margin: '4px 2px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        position: 'relative' as const,
        animation: 'pulse 2s infinite'
      };
    } catch (error) {
      console.error('완료 바 스타일 계산 오류:', error);
      return {};
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes slideIn {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .gantt-task-row {
          animation: slideIn 0.3s ease-out;
        }
        .gantt-header {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }
      `}</style>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center text-gray-800">
          <span className="text-blue-600 mr-3 text-3xl">📊</span>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            간트 차트 (계층구조)
          </span>
        </h2>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))} 
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            ◀ 이전월
          </button>
          <span className="font-bold text-xl px-6 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-gray-800 shadow-sm">
            {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
          </span>
          <button 
            onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))} 
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            다음월 ▶
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-6 text-center bg-blue-50 p-3 rounded-lg border border-blue-200">
        💡 <strong>팁:</strong> 날짜 헤더를 좌우로 드래그하여 월을 이동할 수 있습니다
      </div>

      <div
        className="grid gap-0 border-2 border-gray-300 rounded-lg overflow-hidden"
        style={{
          gridTemplateColumns: `350px repeat(${days.length}, 1fr)`,
          gridAutoRows: '50px',
          minHeight: '400px'
        }}
      >
        {/* 헤더 - 작업명 컬럼 */}
        <div
          className="font-bold text-center py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-2 border-blue-800 flex items-center justify-center shadow-lg"
          style={{ gridRow: 1, gridColumn: 1 }}
        >
          <span className="text-blue-200 mr-2 text-lg">🌲</span>
          <span className="text-lg">작업 구조</span>
        </div>
        
        {/* 헤더 - 날짜 컬럼들 */}
        {days.map((day, index) => {
          const dayNum = getDay(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          
          let bgColor = 'bg-gray-100';
          let textColor = 'text-gray-700';
          let borderColor = 'border-gray-300';
          
          if (HOLIDAYS.includes(dateStr)) {
            bgColor = 'bg-red-200';
            textColor = 'text-red-700';
            borderColor = 'border-red-300';
          } else if (dayNum === 0) { // 일요일
            bgColor = 'bg-red-100';
            textColor = 'text-red-600';
            borderColor = 'border-red-200';
          } else if (dayNum === 6) { // 토요일
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-600';
            borderColor = 'border-blue-200';
          } else if (isToday(day)) {
            bgColor = 'bg-orange-200';
            textColor = 'text-orange-700';
            borderColor = 'border-orange-300';
          }
          
          return (
            <div
              key={day.toISOString()}
              className={`text-sm text-center py-3 border-r-2 ${borderColor} cursor-grab hover:bg-opacity-80 transition-all duration-200 ${bgColor} ${textColor} shadow-sm`}
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
              <div className="font-bold text-lg">{format(day, 'd')}</div>
              <div className="text-xs opacity-80 font-medium">{format(day, 'E', { locale: ko })}</div>
            </div>
          );
        })}
        
        {/* 작업 행들 */}
        {wbs.map((task, index) => {
          // 날짜 추출
          const startDate = getDateField(task, ['startDate', 'registered_at']);
          const deadline = getDateField(task, ['deadline', 'endDate']);
          const completedAt = task.completedAt ? getDateField(task, ['completedAt']) : null;
          
          const displayName = task.name || task.content || '무제';
          const isCompleted = !!completedAt;
          
          // 현재 월 범위에 있는지 확인
          let showBar = false;
          let actualStartDate = startDate;
          let actualDeadline = deadline;
          
          if (startDate && deadline) {
            try {
              const start = parseISO(startDate);
              const end = parseISO(deadline);
              // 작업 기간이 현재 월과 겹치는지 확인
              if (!(isBefore(end, monthStart) || isAfter(start, monthEnd))) {
                showBar = true;
              }
            } catch (e) {
              console.warn('날짜 파싱 오류:', e);
            }
          } else if (startDate && !deadline) {
            // 시작일만 있는 경우 7일 기간으로 가정
            try {
              const start = parseISO(startDate);
              const estimatedEnd = addDays(start, 7);
              actualDeadline = format(estimatedEnd, 'yyyy-MM-dd');
              if (!(isBefore(estimatedEnd, monthStart) || isAfter(start, monthEnd))) {
                showBar = true;
              }
            } catch (e) {
              console.warn('시작일 파싱 오류:', e);
            }
          } else if (!startDate && deadline) {
            // 마감일만 있는 경우 7일 기간으로 가정
            try {
              const end = parseISO(deadline);
              const estimatedStart = addDays(end, -7);
              actualStartDate = format(estimatedStart, 'yyyy-MM-dd');
              if (!(isBefore(end, monthStart) || isAfter(estimatedStart, monthEnd))) {
                showBar = true;
              }
            } catch (e) {
              console.warn('마감일 파싱 오류:', e);
            }
          }
          
          // 바 스타일 계산 (마감일까지 표시)
          const barStyle = showBar && actualStartDate && actualDeadline ? 
            getBarStyle(actualStartDate, actualDeadline, isCompleted, completedAt, index) : 
            {};
          
          // 완료 바 스타일 계산 (완료된 부분만 표시)
          const completedBarStyle = showBar && actualStartDate && actualDeadline && completedAt ? 
            getCompletedBarStyle(actualStartDate, actualDeadline, completedAt, index) : 
            {};
          
          console.log(`작업 ${index}:`, {
            이름: displayName,
            시작일: actualStartDate,
            마감일: actualDeadline,
            완료일: completedAt,
            바표시: showBar,
            완료여부: isCompleted
          });
          
          return (
            <React.Fragment key={`task-${task.id}`}>
              {/* 작업명 셀 */}
              <div
                className={`gantt-task-row px-4 py-3 text-sm border-r-2 border-b border-gray-200 flex items-center transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } hover:bg-blue-50 hover:shadow-md`}
                style={{
                  gridRow: index + 2,
                  gridColumn: 1,
                  paddingLeft: `${(task.depth || 0) * 20 + 16}px`,
                  animationDelay: `${index * 0.05}s`
                }}
                title={`${displayName} (${actualStartDate || '시작일 없음'} ~ ${actualDeadline || '마감일 없음'}${completedAt ? ` | 완료: ${completedAt}` : ''})`}
              >
                {/* 계층 구조 표시 */}
                <div className="flex items-center flex-1">
                  {(task.depth || 0) > 0 && (
                    <div className="flex items-center mr-3">
                      {Array.from({ length: (task.depth || 0) - 1 }, (_, i) => (
                        <span key={i} className="text-gray-400 mr-1 text-lg">│</span>
                      ))}
                      <span className="text-gray-400 mr-1 text-lg">├</span>
                    </div>
                  )}
                  
                  <div 
                    className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 shadow-sm ${
                      (task.depth || 0) === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      (task.depth || 0) === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      (task.depth || 0) === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                  />
                  
                  <span 
                    className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}
                    style={{
                      fontSize: `${Math.max(12, 14 - (task.depth || 0))}px`,
                      fontWeight: (task.depth || 0) === 0 ? '600' : '500'
                    }}
                  >
                    {displayName.length > 28 ? displayName.slice(0, 28) + '...' : displayName}
                    {!showBar && <span className="text-gray-400 text-xs ml-2">(기간없음)</span>}
                    {(task.depth || 0) === 0 && <span className="text-blue-600 ml-2 text-lg">📁</span>}
                    {isCompleted && <span className="text-green-600 ml-2 text-lg">✅</span>}
                  </span>
                </div>
              </div>
              
              {/* 간트 바 (마감일까지 표시) */}
              {showBar && actualStartDate && actualDeadline && (
                <div
                  style={barStyle}
                  title={`${displayName}: ${actualStartDate} ~ ${actualDeadline}${isCompleted ? ` | 완료: ${completedAt}` : ''}`}
                >
                  {displayName.length > 15 ? displayName.slice(0, 15) + '...' : displayName}
                </div>
              )}
              
              {/* 완료 바 (완료된 부분만 표시) */}
              {showBar && actualStartDate && actualDeadline && completedAt && (
                <div
                  style={completedBarStyle}
                  title={`${displayName}: 완료 (${completedAt})`}
                >
                  ✅ 완료
                </div>
              )}
            </React.Fragment>
          );
        })}
        
        {/* 빈 상태 메시지 */}
        {wbs.length === 0 && (
          <div 
            className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-lg"
            style={{ gridColumn: `1 / -1` }}
          >
            <div className="text-6xl mb-4">📊</div>
            <div className="text-lg font-medium">WBS 데이터가 없습니다.</div>
            <div className="text-sm text-gray-400 mt-2">프로젝트에 작업을 추가해보세요.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart; 