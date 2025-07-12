// server/src/types/index.ts
import { Request, Response, NextFunction } from 'express';

// 공통 응답 타입
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 사용자 관련 타입
export interface UserPayload {
  id: string;
  name: string;
  role: string;
  userCode: string;
  company_code: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role_code: 'USER' | 'MANAGER' | 'ADMIN';
  position_code?: string;
  position_name?: string;
  company_code?: string;
  department?: string;
  user_code?: string;
  birth?: string;
  join_date?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface RegisterRequest {
  id: string;
  password: string;
  email: string;
  name: string;
  birth: string;
  company_code: string;
  position_code: string;
  department: string;
  join_date: string;
}

// 프로젝트 관련 타입
export interface Project {
  id: number;
  name: string;
  category: 'SI' | 'CENTRIC' | 'ETC';
  type: 'NEW' | 'ADD' | 'COMPLETE' | 'FAIL';
  start_date: string;
  end_date: string;
  progress: number;
  author_id: string;
  company_code?: string;
  os?: string;
  memory?: string;
  created_at?: Date;
  updated_at?: Date;
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
  registered_at: Date;
  completed_at?: Date;
  parent_id?: number;
  order?: number;
}

export interface CreateProjectRequest {
  category: string;
  type: string;
  name: string;
  startDate: string;
  endDate: string;
  os?: string;
  memory?: string;
  javaVersion?: string;
  springVersion?: string;
  reactVersion?: string;
  vueVersion?: string;
  tomcatVersion?: string;
  centricVersion?: string;
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
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoticeRequest {
  title: string;
  content: string;
  is_pinned?: boolean;
  notice_type?: 'general' | 'urgent' | 'maintenance';
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
  created_at: Date;
  updated_at: Date;
  author_id: string;
  authorName?: string;
  commentCount?: number;
}

export interface Comment {
  id: number;
  content: string;
  parent_id?: number;
  created_at: Date;
  updated_at: Date;
  author_id: string;
  authorName?: string;
  post_id: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: 'free' | 'info' | 'question' | 'notice';
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
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
  created_at: Date;
  updated_at: Date;
  author_id: string;
  authorName?: string;
  project_id: number;
  projectName?: string;
  answerCount?: number;
}

export interface Answer {
  id: number;
  content: string;
  is_accepted: boolean;
  vote_count: number;
  created_at: Date;
  updated_at: Date;
  author_id: string;
  authorName?: string;
  question_id: number;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  category: 'GENERAL' | 'TECHNICAL' | 'BUG' | 'FEATURE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  projectId: number;
  tags: string[];
}

export interface CreateAnswerRequest {
  content: string;
}

// 회사 관련 타입
export interface Company {
  company_id: number;
  company_name: string;
  company_code: string;
  company_info?: string;
  company_type?: string;
  industry_type?: string;
  founded_at?: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Department {
  id: number;
  department_name: string;
  description?: string;
  company_code: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Position {
  id: number;
  position_code: string;
  name: string;
  company_code?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Solution {
  id: number;
  solution_name: string;
  description?: string;
  version?: string;
  company_code: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Role {
  id: number;
  role_code: string;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 검색 및 필터 관련 타입
export interface SearchParams {
  search?: string;
  category?: string;
  status?: string;
  author?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// 데이터베이스 쿼리 결과 타입
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// 에러 타입
export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

// 미들웨어 타입
export interface AuthMiddleware {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void;
}

export interface AdminMiddleware {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void;
}

// 유틸리티 타입
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 