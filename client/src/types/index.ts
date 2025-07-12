// client/src/types/index.ts

// 공통 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 사용자 관련 타입
export interface User {
  id: string;
  name: string;
  email: string;
  role_code: 'USER' | 'MANAGER' | 'ADMIN';
  position_name?: string;
  company_code?: string;
  department?: string;
  user_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

// 프로젝트 관련 타입
export interface Project {
  id: number;
  name: string;
  category: 'SI' | 'CENTRIC' | 'ETC';
  type: 'NEW' | 'ADD' | 'COMPLETE' | 'FAIL';
  startDate: string;
  endDate: string;
  progress: number;
  author_id: string;
  company_code?: string;
  os?: string;
  memory?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectDetails {
  id: number;
  project_id: number;
  java_version?: string;
  spring_version?: string;
  react_version?: string;
  vue_version?: string;
  tomcat_version?: string;
  centric_version?: string;
}

export interface DevNote {
  id: number;
  project_id: number;
  content: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  deadline?: string;
  author_id: string;
  authorName?: string;
  registered_at: string;
  completed_at?: string;
  parent_id?: number;
  order?: number;
}

// 공지사항 관련 타입
export interface Notice {
  notice_id: number;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  is_pinned: boolean;
  notice_type: 'general' | 'urgent' | 'maintenance';
  views: number;
  attachments?: string;
  created_at: string;
  updated_at: string;
}

export interface NoticeFormData {
  title: string;
  content: string;
  is_pinned: boolean;
  notice_type: 'general' | 'urgent' | 'maintenance';
  attachments?: string;
}

// 게시글 관련 타입
export interface Post {
  id: number;
  title: string;
  content: string;
  category: 'free' | 'info' | 'question' | 'notice';
  views: number;
  likes: number;
  is_pinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  author_id: string;
  commentCount: number;
}

export interface Comment {
  id: number;
  content: string;
  parent_id?: number;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  author_id: string;
  post_id?: number;
}

export interface PostFormData {
  title: string;
  content: string;
  category: 'free' | 'info' | 'question' | 'notice';
}

// QA 관련 타입
export interface Question {
  id: number;
  title: string;
  content: string;
  category: 'GENERAL' | 'TECHNICAL' | 'BUG' | 'FEATURE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  tags: string[];
  view_count: number;
  vote_count: number;
  accepted_answer_id?: number;
  createdAt: string;
  updatedAt: string;
  author_id: string;
  authorName: string;
  projectId: number;
  projectName: string;
  answerCount: number;
}

export interface Answer {
  id: number;
  content: string;
  is_accepted: boolean;
  vote_count: number;
  createdAt: string;
  updatedAt: string;
  author_id: string;
  authorName: string;
  question_id: number;
}

export interface QuestionFormData {
  title: string;
  content: string;
  category: 'GENERAL' | 'TECHNICAL' | 'BUG' | 'FEATURE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  projectId: string;
  tags: string[];
  attachments: File[];
}

// 회사 관련 타입
export interface Company {
  company_id: number;
  company_name: string;
  company_code: string;
  company_info?: string;
  company_type?: string;
  industry_type?: string;
  founded_at?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  department_name: string;
  description?: string;
  company_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: number;
  position_code: string;
  name: string;
  company_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Solution {
  id: number;
  solution_name: string;
  description?: string;
  version?: string;
  company_code: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  role_code: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// 폼 관련 타입
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

export interface FormErrors {
  [key: string]: string;
}

// 통계 관련 타입
export interface DashboardStats {
  totalProjects: number;
  ongoingProjects: number;
  completedProjects: number;
  totalUsers: number;
  recentNotices: Notice[];
  ongoingProjectsList: Project[];
}

// 검색 및 필터 관련 타입
export interface SearchFilters {
  search?: string;
  category?: string;
  status?: string;
  author?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// 이벤트 핸들러 타입
export interface EventHandlers {
  onSubmit?: (data: any) => void | Promise<void>;
  onCancel?: () => void;
  onDelete?: (id: number) => void | Promise<void>;
  onEdit?: (id: number) => void;
  onView?: (id: number) => void;
}

// 상태 관리 타입
export interface LoadingState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// 모달 관련 타입
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// 테이블 관련 타입
export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationResponse;
  onPageChange?: (page: number) => void;
  onRowClick?: (record: T) => void;
  rowKey?: keyof T;
}

// 유틸리티 타입
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 