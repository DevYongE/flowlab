import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { X } from 'lucide-react';
import flowLabLogo from '../../assets/flowLabLogo.png';


interface SidebarProps {
  isMini: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

const menu = [
  { icon: '📊', label: '대시보드', to: '/dashboard' },
  { icon: '📢', label: '공지사항', to: '/notices' },
  { icon: '🧱', label: '프로젝트', to: '/projects' },
  { icon: '🗂️', label: 'WBS보드', to: '/wbs' },
  { icon: '❓', label: 'QA게시판', to: '/qa' },
  { icon: '🗣️', label: '자유게시판', to: '/board' },
];

const adminMenu = [
  { icon: '👤', label: '회원관리', to: '/admin/users' },
];

const Sidebar: React.FC<SidebarProps> = memo(({ isMini, isMobile = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  
  const isAdmin = useMemo(() => user?.role_code === 'ADMIN', [user?.role_code]);
  
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // 로그아웃 후 로그인 페이지로 이동
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      // 오류가 발생해도 로그인 페이지로 이동
      navigate('/login');
    }
  }, [logout, navigate]);

  const handleMenuClick = useCallback((to: string) => {
    navigate(to);
    // 모바일에서는 메뉴 클릭 시 사이드바 닫기
    if (isMobile && onClose) {
      onClose();
    }
  }, [navigate, isMobile, onClose]);

  const userInitial = useMemo(() => user?.name?.[0] || 'U', [user?.name]);

  return (
    <div className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 ${
      isMobile ? 'w-64 p-4' : (isMini ? 'w-20 p-2' : 'w-64 p-6')
    }`}>
      {/* 모바일 전용 헤더 */}
      {isMobile && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center justify-center">
            <img src={flowLabLogo} alt="FlowLab Logo" className="h-24 w-full object-contain px-2" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors touch-manipulation"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* 데스크톱 전용 헤더 */}
      {!isMobile && (
        <div>
          <div className={`flex items-center justify-center mb-8`}>
            <img src={flowLabLogo} alt="FlowLab Logo" className={`object-contain ${isMini ? 'h-12 w-full px-1' : 'h-28 w-full px-2'}`} />
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
      )}

      {/* 모바일 전용 사용자 정보 */}
      {isMobile && (
        <div className="text-sm text-gray-400 mb-6 p-3 bg-gray-800 rounded-lg">
          👤 <span className="font-semibold text-white">{user?.name || user?.id || '알 수 없음'}</span>
          {user?.position_name && (
            <div className="text-blue-300 text-xs mt-1">({user.position_name})</div>
          )}
          {isAdmin && (
            <div className="text-red-400 font-bold text-xs mt-1">[ADMIN]</div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-start">
        {/* 일반 메뉴 */}
        {menu.map((item) => (
          <div
            key={item.to}
            className={`flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer hover:bg-blue-800/40 transition-all duration-200 mb-1 touch-manipulation ${
              location.pathname.startsWith(item.to) ? 'bg-blue-800/60 shadow-lg' : ''
            }`}
            onClick={() => handleMenuClick(item.to)}
          >
            <span className="text-xl">{item.icon}</span>
            {(!isMini || isMobile) && <span className="font-medium">{item.label}</span>}
          </div>
        ))}

        {/* 관리자 메뉴 그룹 */}
        {isAdmin && (!isMini || isMobile) && (
          <>
            <div className="mt-6 mb-3 text-xs text-gray-400 font-bold px-3">관리자</div>
            {adminMenu.map((item) => (
              <div
                key={item.to}
                className={`flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer hover:bg-red-800/30 transition-all duration-200 mb-1 touch-manipulation ${
                  location.pathname.startsWith(item.to) ? 'bg-red-800/60 shadow-lg' : ''
                }`}
                onClick={() => handleMenuClick(item.to)}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 하단 사용자 정보 및 로그아웃 */}
      <div className="flex flex-col items-center mt-4">
        <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-xl font-bold mb-3">
          {userInitial}
        </div>
        {(!isMini || isMobile) && (
          <>
            <div className="text-sm font-semibold text-center">{user?.name || user?.id || '알 수 없음'}</div>
            {user?.position_name && <div className="text-xs text-blue-200 text-center">{user.position_name}</div>}
            {isAdmin && <div className="text-xs text-red-300 font-bold text-center">[ADMIN]</div>}
            <button
              onClick={handleLogout}
              className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 px-4 text-sm font-semibold transition-colors touch-manipulation"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;