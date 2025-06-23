import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import axios from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
  const [calendarDate, setCalendarDate] = useState<Date | null>(new Date());

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
            <h2 className="text-xl font-semibold mb-2">🗂️ WBS (추후 구현 예정)</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-white rounded-lg shadow p-4">
                <Calendar
                  value={calendarDate}
                  onChange={date => setCalendarDate(date as Date)}
                  calendarType="gregory"
                  showNeighboringMonth={false}
                  tileClassName={({ date, view }) => {
                    // 이번 주에 해당하는 날짜만 강조
                    if (view === 'month') {
                      const now = new Date();
                      const startOfWeek = new Date(now);
                      startOfWeek.setDate(now.getDate() - now.getDay());
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6);
                      if (date >= startOfWeek && date <= endOfWeek) {
                        return 'bg-blue-100 font-bold';
                      }
                    }
                    return '';
                  }}
                />
              </div>
              <div className="flex-1 h-64 bg-gray-100 border border-dashed rounded-xl flex items-center justify-center text-gray-500">
                여기에 WBS 구성 요소를 추가할 수 있습니다.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;