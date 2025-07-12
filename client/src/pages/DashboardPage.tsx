import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import axios from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { handleApiError } from '../lib/error';

interface StatusSummary {
  status: string;
  count: number;
}

interface LatestNotice {
  notice_id: number;
  title: string;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

const DashboardPage: React.FC = () => {
  const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([]);
  const [notices, setNotices] = useState<LatestNotice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🏠 Dashboard component mounted, starting data load...');
    
    // 토큰 체크 로직 제거하고 바로 API 요청 시작
    const loadDashboardData = () => {
      console.log('✅ Dashboard - Loading data without token check...');
      
      // 프로젝트 현황 데이터 가져오기
      setLoadingStatus(true);
      console.log('📊 Requesting status summary...');
      axios.get<StatusSummary[]>('/projects/status-summary')
        .then(res => {
          console.log('📊 Status summary response:', res.data);
          console.log('📊 Status summary response length:', res.data.length);
          
          if (!Array.isArray(res.data)) {
            console.error('📊 Status summary response is not array:', res.data);
            setStatusSummary([]);
            return;
          }
          
          const statusOrder = ['미완료', '진행중', '완료'];
          const fetchedData: StatusSummary[] = res.data;
          const dataMap = new Map(fetchedData.map((item) => [item.status, item]));
          const sortedData: StatusSummary[] = statusOrder.map(status => 
              dataMap.get(status) || { status, count: 0 }
          );
          
          console.log('📊 Processed status data:', sortedData);
          setStatusSummary(sortedData);
        })
        .catch(err => {
          console.error('프로젝트 현황 로딩 실패:', err);
          console.error('프로젝트 현황 에러 상세:', err.response?.data);
          handleApiError(err, '프로젝트 현황을 불러오는데 실패했습니다.');
        })
        .finally(() => setLoadingStatus(false));

      // 최신 공지사항 데이터 가져오기
      setLoadingNotices(true);
      console.log('📢 Requesting latest notices...');
      axios.get('/notices/latest')
        .then(res => {
          console.log('📢 Latest notices response:', res.data);
          setNotices(res.data);
        })
        .catch(err => {
          console.error('최신 공지사항 로딩 실패:', err);
          handleApiError(err, '최신 공지사항을 불러오는데 실패했습니다.');
        })
        .finally(() => setLoadingNotices(false));

      // 프로젝트 목록 및 첫 번째 프로젝트의 WBS 불러오기
      setLoadingProjects(true);
      console.log('📁 Requesting projects...');
      axios.get<Project[]>('/projects')
        .then(res => {
          console.log('📁 Projects response:', res.data);
          if (Array.isArray(res.data)) {
            setProjects(res.data);
          } else {
            setProjects([]);
            console.error('프로젝트 목록 응답이 배열이 아님:', res.data);
          }
        })
        .catch(err => {
          console.error('프로젝트 목록 로딩 실패:', err);
          handleApiError(err, '프로젝트 목록을 불러오는데 실패했습니다.');
          setProjects([]);
        })
        .finally(() => setLoadingProjects(false));
    };
    
    // 컴포넌트 마운트 시 즉시 실행
    loadDashboardData();
  }, []);

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // 일요일
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  // 날짜별 프로젝트 일정 매핑
  function getProjectsForDate(date: Date): Project[] {
    const dayStr = date.toISOString().slice(0, 10);
    return Array.isArray(projects)
      ? projects.filter(proj => dayStr >= proj.startDate && dayStr <= proj.endDate)
      : [];
  }

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const weekDates = getWeekDates(calendarDate);

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 대시보드</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">📈 전체 프로젝트 현황</h2>
              {loadingStatus ? (
                <div className="flex items-center justify-center h-[200px] md:h-[300px]">
                  <div className="text-gray-500 text-sm md:text-base">프로젝트 현황 로딩 중...</div>
                </div>
              ) : statusSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 200 : 300}>
                  <BarChart 
                    data={statusSummary}
                    margin={{ 
                      top: 5, 
                      right: window.innerWidth < 768 ? 10 : 20, 
                      left: window.innerWidth < 768 ? -20 : -10, 
                      bottom: 5 
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="status" 
                      tick={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                    />
                    <YAxis 
                      unit="개" 
                      allowDecimals={false}
                      tick={{ fontSize: window.innerWidth < 768 ? 12 : 14 }}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}
                      contentStyle={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }} />
                    <Bar dataKey="count" name="프로젝트 수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] md:h-[300px]">
                  <div className="text-gray-500 text-sm md:text-base">프로젝트 현황 데이터가 없습니다.</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">📢 최신 공지사항</h2>
              {loadingNotices ? (
                <div className="flex items-center justify-center h-[200px] md:h-[300px]">
                  <div className="text-gray-500 text-sm md:text-base">공지사항 로딩 중...</div>
                </div>
              ) : notices.length > 0 ? (
                <ul className="space-y-2 md:space-y-3">
                  {notices.map((notice) => (
                    <li 
                      key={notice.notice_id}
                      onClick={() => navigate(`/notices/detail/${notice.notice_id}`)}
                      className="flex flex-col md:flex-row md:justify-between md:items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors touch-manipulation"
                    >
                      <span className="font-medium text-gray-700 text-sm md:text-base mb-1 md:mb-0 truncate">{notice.title}</span>
                      <span className="text-xs md:text-sm text-gray-500 self-start md:self-auto">{notice.createdAt}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-[200px] md:h-[300px] text-gray-500 text-sm md:text-base">
                  표시할 공지사항이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">🗂️ WBS (주간 일정)</h2>
            <div className="flex flex-col gap-4 md:gap-6 items-start">
              <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - 7))} 
                    className="px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation text-sm md:text-base"
                  >
                    ◀
                  </button>
                  <span className="font-bold text-sm md:text-lg text-center flex-1 mx-2">
                    {weekDates[0].getFullYear()}년 {weekDates[0].getMonth() + 1}월 {weekDates[0].getDate()}일 ~ {weekDates[6].getMonth() + 1}월 {weekDates[6].getDate()}일
                  </span>
                  <button 
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() + 7))} 
                    className="px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation text-sm md:text-base"
                  >
                    ▶
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-500 p-1">{d}</div>
                  ))}
                  {weekDates.map((d, i) => {
                    const isToday = d.toDateString() === new Date().toDateString();
                    const projectsForDay = getProjectsForDate(d);
                    return (
                      <div
                        key={i}
                        className={`min-h-16 md:min-h-20 flex flex-col items-center justify-start rounded-lg border px-1 py-1 ${
                          isToday ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold' : 'bg-white border-gray-200'
                        }`}
                      >
                        <span className="mb-1 text-xs md:text-sm">{d.getDate()}</span>
                        {loadingProjects ? (
                          <span className="text-xs text-gray-400">로딩...</span>
                        ) : projectsForDay.length === 0 ? (
                          <span className="text-xs text-gray-300">-</span>
                        ) : (
                          projectsForDay.map(proj => (
                            <div key={proj.id} className="w-full mb-1 px-1 py-0.5 rounded bg-green-50 border border-green-200 text-xs text-green-800 flex flex-col items-start">
                              <span className="font-semibold truncate w-full text-xs">{proj.name}</span>
                              <span className="text-[10px] text-gray-500 hidden md:block">{proj.startDate} ~ {proj.endDate}</span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;