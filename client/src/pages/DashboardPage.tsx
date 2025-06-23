import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import axios from '../lib/axios';
import { useNavigate } from 'react-router-dom';

interface StatusSummary {
  status: string;
  count: number;
}

interface LatestNotice {
  notice_id: number;
  title: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([]);
  const [notices, setNotices] = useState<LatestNotice[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 프로젝트 현황 데이터 가져오기
    axios.get<StatusSummary[]>('/projects/status-summary')
      .then(res => {
        const statusOrder = ['미완료', '진행중', '완료'];
        const fetchedData: StatusSummary[] = res.data;
        const dataMap = new Map(fetchedData.map((item) => [item.status, item]));
        const sortedData: StatusSummary[] = statusOrder.map(status => 
            dataMap.get(status) || { status, count: 0 }
        );
        setStatusSummary(sortedData);
      })
      .catch(err => console.error('프로젝트 현황 로딩 실패:', err));

    // 최신 공지사항 데이터 가져오기
    axios.get('/notices/latest')
      .then(res => setNotices(res.data))
      .catch(err => console.error('최신 공지사항 로딩 실패:', err));
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

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const weekDates = getWeekDates(calendarDate);

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 대시보드</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">📈 전체 프로젝트 현황</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={statusSummary}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis unit="개" allowDecimals={false} />
                  <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/>
                  <Legend />
                  <Bar dataKey="count" name="프로젝트 수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">📢 최신 공지사항</h2>
              {notices.length > 0 ? (
                <ul className="space-y-3">
                  {notices.map((notice) => (
                    <li 
                      key={notice.notice_id}
                      onClick={() => navigate(`/notices/detail/${notice.notice_id}`)}
                      className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <span className="font-medium text-gray-700 truncate">{notice.title}</span>
                      <span className="text-sm text-gray-500">{notice.createdAt}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  표시할 공지사항이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">🗂️ WBS (주간 일정)</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - 7))} className="px-2 py-1 rounded hover:bg-gray-200">◀</button>
                  <span className="font-bold text-lg">{weekDates[0].getFullYear()}년 {weekDates[0].getMonth() + 1}월 {weekDates[0].getDate()}일 ~ {weekDates[6].getMonth() + 1}월 {weekDates[6].getDate()}일</span>
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() + 7))} className="px-2 py-1 rounded hover:bg-gray-200">▶</button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-500">{d}</div>
                  ))}
                  {weekDates.map((d, i) => {
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={i}
                        className={`h-14 flex flex-col items-center justify-center rounded-lg border ${isToday ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold' : 'bg-white border-gray-200'}`}
                      >
                        <span>{d.getDate()}</span>
                        {/* WBS 일정이 들어갈 공간 (예: <div>작업명</div>) */}
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