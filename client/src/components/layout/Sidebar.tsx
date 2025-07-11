import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isMini: boolean;
}

const menu = [
  { icon: '📊', label: '대시보드', to: '/dashboard' },
  { icon: '📢', label: '공지사항', to: '/notices' },
  { icon: '🧱', label: '프로젝트', to: '/projects' },
  { icon: '🗂️', label: 'WBS보드', to: '/wbs' },
];

const adminMenu = [
  { icon: '👤', label: '회원관리', to: '/admin/users' },
];

const Sidebar: React.FC<SidebarProps> = ({ isMini }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}'); // 로그인한 유저 정보
  const isAdmin = user?.role_code === 'ADMIN'; // Admin 권한 체크
  
  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 ${isMini ? 'w-20 p-2' : 'w-64 p-6'}`}>
      <div>
        <div className={`flex items-center gap-3 mb-8 ${isMini ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 text-white font-extrabold text-lg flex items-center justify-center shadow-inner shadow-blue-800/40">
            FL
          </div>
          {!isMini && <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">FlowLab</span>}
        </div>
        {!isMini && (
          <div className="text-xs text-gray-400 mb-2">
            👤 <span className="font-semibold">{user?.name || user?.id || '알 수 없음'}</span>
            {user?.position_name && (
              <span className="ml-2 text-blue-300">({user.position_name})</span>
            )}
            {isAdmin && (
              <span className="ml-2 text-red-400 font-bold">[ADMIN]</span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-start">
        {/* 일반 메뉴 */}
        {menu.map((item) => (
          <div
            key={item.to}
            className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-blue-800/40 transition-colors ${location.pathname.startsWith(item.to) ? 'bg-blue-800/60' : ''}`}
            onClick={() => navigate(item.to)}
          >
            <span className="text-lg">{item.icon}</span>
            {!isMini && <span>{item.label}</span>}
          </div>
        ))}
        {/* 관리자 메뉴 그룹 */}
        {isAdmin && !isMini && (
          <>
            <div className="mt-8 mb-2 text-xs text-gray-400 font-bold">관리자</div>
            {adminMenu.map((item) => (
              <div
                key={item.to}
                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-red-800/30 transition-colors ${location.pathname.startsWith(item.to) ? 'bg-red-800/60' : ''}`}
                onClick={() => navigate(item.to)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="flex flex-col items-center mb-2">
        <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-xl font-bold mb-2">
          {user?.name?.[0] || 'U'}
        </div>
        {!isMini && (
          <>
            <div className="text-sm font-semibold">{user?.name || user?.id || '알 수 없음'}</div>
            {user?.position_name && <div className="text-xs text-blue-200">{user.position_name}</div>}
            {isAdmin && <div className="text-xs text-red-300 font-bold">[ADMIN]</div>}
            <button
              onClick={handleLogout}
              className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-1 text-xs font-semibold"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;