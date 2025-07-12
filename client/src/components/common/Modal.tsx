// client/src/components/common/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { useFocusTrap } from '../../hooks/useAccessibility';
import type { ModalProps } from '../../types';

interface ExtendedModalProps extends ModalProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export const Modal: React.FC<ExtendedModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  ariaLabelledBy,
  ariaDescribedBy
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap(isOpen);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const contentId = useRef(`modal-content-${Math.random().toString(36).substr(2, 9)}`);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // 모달 열릴 때 body 스크롤 방지 및 ARIA 속성 설정
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('aria-hidden', 'true');
      
      // 모달에 포커스 설정
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('aria-hidden');
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('aria-hidden');
    };
  }, [isOpen]);

  // 오버레이 클릭 핸들러
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // 크기별 클래스
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* 모달 컨텐츠 */}
      <div
        ref={(node) => {
          if (node) {
            modalRef.current = node;
            focusTrapRef.current = node;
          }
        }}
        className={`relative bg-white rounded-lg shadow-xl w-full mx-4 ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || (title ? titleId.current : undefined)}
        aria-describedby={ariaDescribedBy || contentId.current}
        tabIndex={-1}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h3 
                id={titleId.current}
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-auto"
                aria-label="모달 닫기"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* 바디 */}
        <div id={contentId.current} className="p-6">
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// 확인 모달 컴포넌트 (접근성 개선)
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'info'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const iconColors = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const icons = {
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    danger: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  };

  const confirmButtonVariant = type === 'danger' ? 'destructive' : 'default';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || '확인'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={confirmButtonVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${iconColors[type]}`} aria-hidden="true">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
    </Modal>
  );
}; 