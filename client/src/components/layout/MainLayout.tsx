import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ContentWrapper from './ContentWrapper';
import Footer from './Footer';
import { Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMini, setIsMini] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 화면 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 모바일에서 메뉴 토글
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 데스크톱에서 사이드바 토글
  const toggleDesktopSidebar = () => {
    setIsMini(!isMini);
  };

  // 모바일에서 메뉴 닫기
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 모바일 오버레이 */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* 사이드바 */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      }`}>
        <Sidebar 
          isMini={isMobile ? false : isMini} 
          isMobile={isMobile}
          onClose={closeMobileMenu}
        />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="flex justify-between items-center p-3 md:p-4 bg-white border-b shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={isMobile ? toggleMobileMenu : toggleDesktopSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              aria-label={isMobile ? "메뉴 열기" : "사이드바 토글"}
            >
              {isMobile ? <Menu size={20} /> : <Menu size={20} />}
            </button>
            
            {/* 모바일에서 로고 표시 */}
            {isMobile && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 text-white font-bold text-sm flex items-center justify-center">
                  FL
                </div>
                <span className="text-lg font-bold text-gray-800">FlowLab</span>
              </div>
            )}
          </div>
          
          {/* 필요시 여기에 추가 헤더 콘텐츠 */}
        </header>

        {/* 콘텐츠 (스크롤 가능) */}
        <main className="flex-1 overflow-y-auto">
          <ContentWrapper>
            {children}
          </ContentWrapper>
        </main>
        
        {/* 푸터 */}
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;