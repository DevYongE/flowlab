// client/src/components/common/Form.tsx
import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import type { FormField, FormErrors } from '../../types';

interface FormProps {
  title?: string;
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  className?: string;
  showCard?: boolean;
}

export const Form: React.FC<FormProps> = ({
  title,
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  submitText = '저장',
  cancelText = '취소',
  className = '',
  showCard = true
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 값 변경 핸들러
  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // 필드 블러 핸들러
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  }, [values]);

  // 개별 필드 검증
  const validateField = useCallback((name: string, value: any) => {
    const field = fields.find(f => f.name === name);
    if (!field) return;

    let error = '';

    // 필수 필드 검증
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      error = `${field.label}은(는) 필수 입력 항목입니다.`;
    }

    // 최소/최대 길이 검증
    if (value && typeof value === 'string') {
      if (field.validation?.min && value.length < field.validation.min) {
        error = `${field.label}은(는) 최소 ${field.validation.min}자 이상이어야 합니다.`;
      }
      if (field.validation?.max && value.length > field.validation.max) {
        error = `${field.label}은(는) 최대 ${field.validation.max}자까지 입력 가능합니다.`;
      }
    }

    // 패턴 검증
    if (value && field.validation?.pattern && !field.validation.pattern.test(value)) {
      error = `${field.label} 형식이 올바르지 않습니다.`;
    }

    // 커스텀 검증
    if (value && field.validation?.custom) {
      const customResult = field.validation.custom(value);
      if (typeof customResult === 'string') {
        error = customResult;
      } else if (!customResult) {
        error = `${field.label}이(가) 유효하지 않습니다.`;
      }
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  }, [fields]);

  // 전체 폼 검증
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const value = values[field.name];
      let error = '';

      // 필수 필드 검증
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        error = `${field.label}은(는) 필수 입력 항목입니다.`;
        isValid = false;
      }

      // 기타 검증 로직...
      if (value && typeof value === 'string') {
        if (field.validation?.min && value.length < field.validation.min) {
          error = `${field.label}은(는) 최소 ${field.validation.min}자 이상이어야 합니다.`;
          isValid = false;
        }
        if (field.validation?.max && value.length > field.validation.max) {
          error = `${field.label}은(는) 최대 ${field.validation.max}자까지 입력 가능합니다.`;
          isValid = false;
        }
      }

      if (value && field.validation?.pattern && !field.validation.pattern.test(value)) {
        error = `${field.label} 형식이 올바르지 않습니다.`;
        isValid = false;
      }

      if (value && field.validation?.custom) {
        const customResult = field.validation.custom(value);
        if (typeof customResult === 'string') {
          error = customResult;
          isValid = false;
        } else if (!customResult) {
          error = `${field.label}이(가) 유효하지 않습니다.`;
          isValid = false;
        }
      }

      newErrors[field.name] = error;
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, values]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [validateForm, onSubmit, values]);

  // 필드 렌더링
  const renderField = useCallback((field: FormField) => {
    const value = values[field.name] || '';
    const error = errors[field.name];
    const isTouched = touched[field.name];

    const commonProps = {
      id: field.name,
      name: field.name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(field.name, e.target.value),
      onBlur: () => handleBlur(field.name),
      placeholder: field.placeholder,
      disabled: loading,
      className: `w-full ${error && isTouched ? 'border-red-500' : ''}`,
    };

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select {...commonProps}>
              <option value="">선택해주세요</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && isTouched && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              {...commonProps}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error && isTouched ? 'border-red-500' : ''}`}
            />
            {error && isTouched && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                onBlur={() => handleBlur(field.name)}
                disabled={loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
            {error && isTouched && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              {...commonProps}
              type={field.type}
              className={error && isTouched ? 'border-red-500' : ''}
            />
            {error && isTouched && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        );
    }
  }, [values, errors, touched, loading, handleChange, handleBlur]);

  const formContent = (
    <div className={className}>
      {title && <h2 className="text-xl font-semibold mb-6">{title}</h2>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(renderField)}
        
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '처리 중...' : submitText}
          </Button>
        </div>
      </form>
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardContent className="p-6">
          {formContent}
        </CardContent>
      </Card>
    );
  }

  return formContent;
}; 