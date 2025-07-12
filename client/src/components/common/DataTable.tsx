// client/src/components/common/DataTable.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import type { TableColumn, TableProps, PaginationResponse } from '../../types';

interface DataTableProps<T = any> extends TableProps<T> {
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  actions?: {
    label: string;
    onClick: (record: T) => void;
    variant?: 'default' | 'destructive' | 'outline';
    icon?: React.ReactNode;
  }[];
  emptyMessage?: string;
  showCard?: boolean;
}

export const DataTable = <T extends Record<string, any>>({
  title,
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  rowKey = 'id',
  searchable = false,
  searchPlaceholder = '검색...',
  actions = [],
  emptyMessage = '데이터가 없습니다.',
  showCard = true
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  // 검색 필터링
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, searchable]);

  // 정렬
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // 정렬 핸들러
  const handleSort = (columnKey: keyof T, sortable?: boolean) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // 페이지네이션 컨트롤
  const renderPagination = () => {
    if (!pagination || !onPageChange) return null;
    
    const { page, totalPages } = pagination;
    const pages = [];
    
    // 모바일에서는 간단한 이전/다음 버튼만 표시
    if (isMobile) {
      return (
        <div className="flex flex-col items-center space-y-3 mt-4">
          <div className="text-sm text-gray-700 text-center">
            {page} / {totalPages} 페이지 (총 {pagination.total}개)
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="touch-manipulation"
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              className="touch-manipulation"
            >
              다음
            </Button>
          </div>
        </div>
      );
    }
    
    // 데스크톱에서는 전체 페이지네이션 표시
    // 이전 페이지 버튼
    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>
    );
    
    // 페이지 번호 버튼
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // 다음 페이지 버튼
    pages.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    );
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          총 {pagination.total}개 중 {((page - 1) * pagination.limit) + 1}-
          {Math.min(page * pagination.limit, pagination.total)}개 표시
        </div>
        <div className="flex space-x-1">
          {pages}
        </div>
      </div>
    );
  };

  // 모바일 카드 뷰 렌더링
  const renderMobileCards = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">로딩 중...</span>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        sortedData.map((record, index) => (
          <div 
            key={String(record[rowKey]) || index}
            className={`${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick?.(record)}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {columns.map((column) => (
                    <div key={String(column.key)} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">
                        {column.title}:
                      </span>
                      <span className="text-sm text-gray-900 text-right min-w-0 flex-1">
                        {column.render
                          ? column.render(record[column.key], record)
                          : String(record[column.key] || '-')}
                      </span>
                    </div>
                  ))}
                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                      {actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(record);
                          }}
                          className="touch-manipulation"
                        >
                          {action.icon && <span className="mr-1">{action.icon}</span>}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );

  // 테이블 헤더 렌더링
  const renderHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column) => (
          <th
            key={String(column.key)}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
            }`}
            onClick={() => handleSort(column.key, column.sortable)}
            style={{ width: column.width }}
          >
            <div className="flex items-center space-x-1">
              <span>{column.title}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  <svg
                    className={`w-3 h-3 ${
                      sortColumn === column.key && sortDirection === 'asc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                  </svg>
                  <svg
                    className={`w-3 h-3 -mt-1 ${
                      sortColumn === column.key && sortDirection === 'desc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              )}
            </div>
          </th>
        ))}
        {actions.length > 0 && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            액션
          </th>
        )}
      </tr>
    </thead>
  );

  // 테이블 바디 렌더링
  const renderBody = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {loading ? (
        <tr>
          <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">로딩 중...</span>
            </div>
          </td>
        </tr>
      ) : sortedData.length === 0 ? (
        <tr>
          <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
            {emptyMessage}
          </td>
        </tr>
      ) : (
        sortedData.map((record, index) => (
          <tr
            key={String(record[rowKey]) || index}
            className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick?.(record)}
          >
            {columns.map((column) => (
              <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {column.render
                  ? column.render(record[column.key], record)
                  : String(record[column.key] || '-')}
              </td>
            ))}
            {actions.length > 0 && (
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(record);
                      }}
                    >
                      {action.icon && <span className="mr-1">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </td>
            )}
          </tr>
        ))
      )}
    </tbody>
  );

  const tableContent = (
    <div>
      {/* 헤더 */}
      <div className={`flex items-center justify-between mb-4 ${isMobile ? 'flex-col space-y-3' : ''}`}>
        {title && <h2 className={`text-xl font-semibold ${isMobile ? 'text-center' : ''}`}>{title}</h2>}
        {searchable && (
          <div className={`${isMobile ? 'w-full' : 'w-64'}`}>
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* 테이블 또는 카드 */}
      {isMobile ? (
        renderMobileCards()
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {renderHeader()}
            {renderBody()}
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {renderPagination()}
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {tableContent}
        </CardContent>
      </Card>
    );
  }

  return tableContent;
}; 