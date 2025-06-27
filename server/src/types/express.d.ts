declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      name: string;
      role: string;
      userCode: string;
      company_code: string;
    };
  }
} 