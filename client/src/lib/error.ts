// client/src/lib/error.ts
import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ErrorResponse {
  message: string;
  error?: any;
  code?: string;
}

// 에러 메시지 표준화
export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};

// 에러 코드별 메시지 맵핑
const errorCodeMessages: Record<string, string> = {
  'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
  'TIMEOUT': '요청 시간이 초과되었습니다.',
  'UNAUTHORIZED': '인증이 필요합니다.',
  'FORBIDDEN': '권한이 없습니다.',
  'NOT_FOUND': '요청하신 정보를 찾을 수 없습니다.',
  'VALIDATION_ERROR': '입력하신 정보를 확인해주세요.',
  'SERVER_ERROR': '서버에서 오류가 발생했습니다.',
};

// 에러 코드에 따른 메시지 반환
export const getErrorMessageByCode = (code: string): string => {
  return errorCodeMessages[code] || '알 수 없는 오류가 발생했습니다.';
};

// 토스트 에러 알림
export const showErrorToast = (error: any): void => {
  const message = getErrorMessage(error);
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#FEF2F2',
      color: '#DC2626',
      border: '1px solid #FECACA',
    },
  });
};

// 토스트 성공 알림
export const showSuccessToast = (message: string): void => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#F0FDF4',
      color: '#059669',
      border: '1px solid #BBF7D0',
    },
  });
};

// 토스트 정보 알림
export const showInfoToast = (message: string): void => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#EFF6FF',
      color: '#1D4ED8',
      border: '1px solid #DBEAFE',
    },
  });
};

// 토스트 경고 알림
export const showWarningToast = (message: string): void => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#FFFBEB',
      color: '#D97706',
      border: '1px solid #FED7AA',
    },
  });
};

// 로딩 토스트
export const showLoadingToast = (message: string = '처리 중...'): string => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

// 로딩 토스트 완료
export const dismissLoadingToast = (toastId: string): void => {
  toast.dismiss(toastId);
};

// 폼 검증 에러 처리
export const handleValidationError = (errors: Record<string, string>): void => {
  const errorMessages = Object.values(errors).filter(Boolean);
  if (errorMessages.length > 0) {
    showErrorToast(errorMessages[0]);
  }
};

// API 에러 처리
export const handleApiError = (error: any, customMessage?: string): void => {
  console.error('API Error:', error);
  
  if (customMessage) {
    showErrorToast(customMessage);
    return;
  }
  
  // 상태 코드별 처리
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        showErrorToast('잘못된 요청입니다. 입력 정보를 확인해주세요.');
        break;
      case 401:
        showErrorToast('인증이 필요합니다. 다시 로그인해주세요.');
        break;
      case 403:
        showErrorToast('접근 권한이 없습니다.');
        break;
      case 404:
        showErrorToast('요청하신 정보를 찾을 수 없습니다.');
        break;
      case 409:
        showErrorToast('이미 존재하는 데이터입니다.');
        break;
      case 422:
        showErrorToast('입력 정보를 확인해주세요.');
        break;
      case 500:
        showErrorToast('서버에서 오류가 발생했습니다.');
        break;
      default:
        showErrorToast(error);
    }
  } else {
    showErrorToast(error);
  }
}; 