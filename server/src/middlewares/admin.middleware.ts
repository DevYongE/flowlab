import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: '관리자만 접근 가능합니다.' });
  }
} 