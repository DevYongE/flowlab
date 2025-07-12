// client/src/hooks/useAccessibility.ts
import { useEffect, useRef, useState } from 'react';

// 키보드 탐색을 위한 훅
export const useKeyboardNavigation = (
  items: string[] | HTMLElement[],
  onSelect?: (index: number) => void
) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setCurrentIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setCurrentIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentIndex >= 0 && onSelect) {
            onSelect(currentIndex);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setCurrentIndex(-1);
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [items.length, currentIndex, onSelect]);

  return { currentIndex, setCurrentIndex, containerRef };
};

// 포커스 트랩을 위한 훅
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // 첫 번째 요소에 포커스 설정
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
};

// 스크린 리더 알림을 위한 훅
export const useScreenReader = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // 이전 메시지 클리어
    setTimeout(() => setAnnouncement(message), 100);
    
    // 일정 시간 후 메시지 클리어
    setTimeout(() => setAnnouncement(''), 3000);
  };

  // DOM 요소를 직접 생성하는 방식으로 변경
  const createAnnouncementElement = () => {
    const element = document.createElement('div');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    element.className = 'sr-only';
    element.setAttribute('role', 'status');
    element.textContent = announcement;
    return element;
  };

  return { announce, announcement };
};

// 미디어 쿼리를 위한 훅
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// 다크모드/라이트모드 감지를 위한 훅
export const useColorScheme = () => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');

  return {
    prefersDark,
    prefersReducedMotion,
    prefersHighContrast,
  };
};

// 요소가 화면에 보이는지 감지하는 훅
export const useIntersectionObserver = (
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}; 