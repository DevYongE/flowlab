// client/src/services/api.ts
import axios from '../lib/axios';
import type { 
  ApiResponse, 
  PaginationParams, 
  PaginationResponse,
  User,
  Project,
  Notice,
  Post,
  Comment,
  Question,
  Answer,
  Company,
  Department,
  Position,
  Solution,
  Role,
  LoginRequest,
  LoginResponse,
  PostFormData,
  NoticeFormData,
  QuestionFormData
} from '../types';

// 기본 API 클라이언트 클래스
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  // GET 요청
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await axios.get(`${this.baseURL}${url}`, { params });
    return response.data;
  }

  // POST 요청
  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await axios.post(`${this.baseURL}${url}`, data);
    return response.data;
  }

  // PUT 요청
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await axios.put(`${this.baseURL}${url}`, data);
    return response.data;
  }

  // DELETE 요청
  async delete<T = any>(url: string): Promise<T> {
    const response = await axios.delete(`${this.baseURL}${url}`);
    return response.data;
  }

  // PATCH 요청
  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await axios.patch(`${this.baseURL}${url}`, data);
    return response.data;
  }
}

// 인증 관련 API
export class AuthAPI extends ApiClient {
  constructor() {
    super('/auth');
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>('/login', credentials);
  }

  async logout(): Promise<void> {
    return this.post('/logout');
  }

  async refreshToken(): Promise<void> {
    return this.post('/refresh');
  }

  async forgotPassword(data: { id: string; email: string }): Promise<ApiResponse> {
    return this.post('/forgot-password', data);
  }

  async resetPassword(data: { token: string; newPassword: string }): Promise<ApiResponse> {
    return this.post('/reset-password', data);
  }
}

// 사용자 관련 API
export class UserAPI extends ApiClient {
  constructor() {
    super('/users');
  }

  async getUsers(params?: { company_code?: string }): Promise<User[]> {
    return this.get('/', params);
  }

  async getUser(id: string): Promise<User> {
    return this.get(`/${id}`);
  }

  async createUser(userData: any): Promise<User> {
    return this.post('/register', userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    return this.put(`/${id}`, userData);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(`/${id}`);
  }

  async checkIdExists(id: string): Promise<{ exists: boolean }> {
    return this.get(`/check-id?id=${id}`);
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    return this.get(`/check-email?email=${encodeURIComponent(email)}`);
  }
}

// 프로젝트 관련 API
export class ProjectAPI extends ApiClient {
  constructor() {
    super('/projects');
  }

  async getProjects(): Promise<Project[]> {
    return this.get('/');
  }

  async getProject(id: number): Promise<Project> {
    return this.get(`/${id}`);
  }

  async createProject(projectData: any): Promise<Project> {
    return this.post('/', projectData);
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
    return this.put(`/${id}`, projectData);
  }

  async deleteProject(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }

  async getOngoingProjects(): Promise<Project[]> {
    return this.get('/ongoing');
  }

  async getDevNotes(projectId: number): Promise<any[]> {
    return this.get(`/${projectId}/wbs`);
  }

  async createDevNote(projectId: number, noteData: any): Promise<any> {
    return this.post(`/${projectId}/devnotes`, noteData);
  }

  async updateDevNote(projectId: number, noteId: number, noteData: any): Promise<any> {
    return this.put(`/${projectId}/devnotes/${noteId}`, noteData);
  }

  async deleteDevNote(projectId: number, noteId: number): Promise<void> {
    return this.delete(`/${projectId}/devnotes/${noteId}`);
  }
}

// 공지사항 관련 API
export class NoticeAPI extends ApiClient {
  constructor() {
    super('/notices');
  }

  async getNotices(): Promise<Notice[]> {
    return this.get('/');
  }

  async getNotice(id: number): Promise<Notice> {
    return this.get(`/${id}`);
  }

  async createNotice(noticeData: NoticeFormData): Promise<Notice> {
    return this.post('/', noticeData);
  }

  async updateNotice(id: number, noticeData: Partial<NoticeFormData>): Promise<Notice> {
    return this.put(`/${id}`, noticeData);
  }

  async deleteNotice(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }

  async getLatestNotices(limit: number = 5): Promise<Notice[]> {
    return this.get('/latest', { limit });
  }
}

// 게시판 관련 API
export class BoardAPI extends ApiClient {
  constructor() {
    super('/board');
  }

  async getPosts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: Post[]; pagination: PaginationResponse }> {
    return this.get('/', params);
  }

  async getPost(id: number): Promise<{
    post: Post;
    comments: Comment[];
    isLiked: boolean;
  }> {
    return this.get(`/${id}`);
  }

  async createPost(postData: PostFormData): Promise<{ postId: number }> {
    return this.post('/', postData);
  }

  async updatePost(id: number, postData: Partial<PostFormData>): Promise<void> {
    return this.put(`/${id}`, postData);
  }

  async deletePost(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }

  async likePost(id: number): Promise<{ isLiked: boolean; likeCount: number }> {
    return this.post(`/${id}/like`);
  }

  async createComment(postId: number, commentData: { content: string; parentId?: number }): Promise<void> {
    return this.post(`/${postId}/comments`, commentData);
  }

  async deleteComment(commentId: number): Promise<void> {
    return this.delete(`/comments/${commentId}`);
  }
}

// QA 관련 API
export class QaAPI extends ApiClient {
  constructor() {
    super('/qa');
  }

  async getQuestions(params?: {
    search?: string;
    project?: string;
    category?: string;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Question[]> {
    return this.get('/questions', params);
  }

  async getQuestion(id: number): Promise<{
    question: Question;
    answers: Answer[];
    userVotes: Record<string, string>;
  }> {
    return this.get(`/questions/${id}`);
  }

  async createQuestion(questionData: QuestionFormData): Promise<{ questionId: number }> {
    return this.post('/questions', questionData);
  }

  async updateQuestion(id: number, questionData: Partial<QuestionFormData>): Promise<void> {
    return this.put(`/questions/${id}`, questionData);
  }

  async deleteQuestion(id: number): Promise<void> {
    return this.delete(`/questions/${id}`);
  }

  async voteQuestion(id: number, voteType: 'UP' | 'DOWN'): Promise<void> {
    return this.post(`/questions/${id}/vote`, { voteType });
  }

  async createAnswer(questionId: number, answerData: { content: string }): Promise<void> {
    return this.post(`/questions/${questionId}/answers`, answerData);
  }

  async voteAnswer(id: number, voteType: 'UP' | 'DOWN'): Promise<void> {
    return this.post(`/answers/${id}/vote`, { voteType });
  }

  async acceptAnswer(id: number): Promise<void> {
    return this.post(`/answers/${id}/accept`);
  }

  async deleteAnswer(id: number): Promise<void> {
    return this.delete(`/answers/${id}`);
  }
}

// 회사 관련 API
export class CompanyAPI extends ApiClient {
  constructor() {
    super('/companies');
  }

  async getCompanies(): Promise<Company[]> {
    return this.get('/');
  }

  async getCompany(id: number): Promise<Company> {
    return this.get(`/${id}`);
  }

  async createCompany(companyData: any): Promise<Company> {
    return this.post('/', companyData);
  }

  async updateCompany(id: number, companyData: any): Promise<Company> {
    return this.put(`/${id}`, companyData);
  }

  async deleteCompany(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }
}

// 부서 관련 API
export class DepartmentAPI extends ApiClient {
  constructor() {
    super('/departments');
  }

  async getDepartments(params?: { company_code?: string }): Promise<Department[]> {
    return this.get('/', params);
  }

  async createDepartment(departmentData: any): Promise<Department> {
    return this.post('/', departmentData);
  }

  async updateDepartment(id: number, departmentData: any): Promise<Department> {
    return this.put(`/${id}`, departmentData);
  }

  async deleteDepartment(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }
}

// 직책 관련 API
export class PositionAPI extends ApiClient {
  constructor() {
    super('/positions');
  }

  async getPositions(params?: { company_code?: string }): Promise<Position[]> {
    return this.get('/', params);
  }

  async createPosition(positionData: any): Promise<Position> {
    return this.post('/', positionData);
  }

  async updatePosition(id: number, positionData: any): Promise<Position> {
    return this.put(`/${id}`, positionData);
  }

  async deletePosition(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }
}

// 솔루션 관련 API
export class SolutionAPI extends ApiClient {
  constructor() {
    super('/solutions');
  }

  async getSolutions(params?: { company_code?: string }): Promise<Solution[]> {
    return this.get('/', params);
  }

  async createSolution(solutionData: any): Promise<Solution> {
    return this.post('/', solutionData);
  }

  async updateSolution(id: number, solutionData: any): Promise<Solution> {
    return this.put(`/${id}`, solutionData);
  }

  async deleteSolution(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }
}

// 역할 관련 API
export class RoleAPI extends ApiClient {
  constructor() {
    super('/roles');
  }

  async getRoles(): Promise<Role[]> {
    return this.get('/');
  }

  async createRole(roleData: any): Promise<Role> {
    return this.post('/', roleData);
  }

  async updateRole(id: number, roleData: any): Promise<Role> {
    return this.put(`/${id}`, roleData);
  }

  async deleteRole(id: number): Promise<void> {
    return this.delete(`/${id}`);
  }
}

// AI 관련 API
export class AiAPI extends ApiClient {
  constructor() {
    super('/ai');
  }

  async analyzeRequirement(text: string): Promise<any> {
    return this.post('/analyze', { text });
  }

  async generateWbs(projectId: number, projectDescription: string): Promise<any> {
    return this.post('/generate-wbs', { projectId, projectDescription });
  }
}

// API 인스턴스 생성
export const authAPI = new AuthAPI();
export const userAPI = new UserAPI();
export const projectAPI = new ProjectAPI();
export const noticeAPI = new NoticeAPI();
export const boardAPI = new BoardAPI();
export const qaAPI = new QaAPI();
export const companyAPI = new CompanyAPI();
export const departmentAPI = new DepartmentAPI();
export const positionAPI = new PositionAPI();
export const solutionAPI = new SolutionAPI();
export const roleAPI = new RoleAPI();
export const aiAPI = new AiAPI();

// 전체 API 객체
export const api = {
  auth: authAPI,
  user: userAPI,
  project: projectAPI,
  notice: noticeAPI,
  board: boardAPI,
  qa: qaAPI,
  company: companyAPI,
  department: departmentAPI,
  position: positionAPI,
  solution: solutionAPI,
  role: roleAPI,
  ai: aiAPI,
}; 