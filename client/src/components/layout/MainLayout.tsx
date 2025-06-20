import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ContentWrapper from './ContentWrapper';
import Footer from './Footer';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMini, setIsMini] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 1. 사이드바 */}
      <Sidebar isMini={isMini} />

      {/* 2. 메인 콘텐츠 영역 (콘텐츠 + 푸터) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 헤더 (메뉴 버튼 포함) */}
        <header className="flex justify-between items-center p-4 bg-white border-b">
          <button onClick={() => setIsMini(!isMini)} className="p-2 rounded-md hover:bg-gray-100">
            <Menu size={20} />
          </button>
          {/* 필요시 여기에 다른 헤더 콘텐츠 추가 */}
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