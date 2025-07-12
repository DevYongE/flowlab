import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;
  
  // Bearer 토큰 또는 쿠키에서 토큰 가져오기 (하위 호환성)
  let token: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (cookieToken) {
    token = cookieToken;
  }
  
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded as any;
    next();
  } catch (err) {
    // 토큰이 만료된 경우, 리프레시 토큰 확인
    if (err instanceof jwt.TokenExpiredError && req.cookies?.refreshToken) {
      try {
        const refreshToken = req.cookies.refreshToken;
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
        
        // 새로운 액세스 토큰 생성
        const newAccessToken = jwt.sign(
          decoded,
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '30m' }
        );
        
        // 새로운 토큰을 쿠키에 설정
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 60 * 1000,
        });
        
        req.user = decoded as any;
        next();
      } catch (refreshErr) {
        res.status(401).json({ message: 'Invalid refresh token' });
      }
    } else {
      res.status(401).json({ message: 'Invalid token' });
    }
  }
};