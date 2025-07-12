// client/src/components/ErrorBoundary.tsx
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 개발 환경에서는 에러 정보를 더 자세히 저장
    if (process.env.NODE_ENV === 'development') {
      this.setState({ error, errorInfo });
    }
    
    // 프로덕션 환경에서는 에러 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // 예: Sentry, LogRocket 등의 에러 로깅 서비스
      // logErrorToService(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  앗! 문제가 발생했어요
                </h2>
                <p className="text-gray-600 mb-6">
                  예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                </p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={this.handleReload}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  페이지 새로고침
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  홈으로 돌아가기
                </Button>
              </div>
              
              {/* 개발 환경에서만 에러 정보 표시 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    에러 정보 보기
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    <div className="font-semibold text-red-600 mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <div className="font-semibold text-gray-600 mb-2">
                          Component Stack:
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// 함수형 컴포넌트를 위한 HOC
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}; 