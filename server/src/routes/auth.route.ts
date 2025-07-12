// server/src/routes/auth.routes.ts
import express from 'express';
import { loginUser, forgotPassword, resetPassword, refreshToken, logoutUser, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// 로그인 라우트
router.post('/login', loginUser);

// 토큰 리프레시 라우트
router.post('/refresh', refreshToken);

// 로그아웃 라우트
router.post('/logout', logoutUser);

// 현재 사용자 정보 조회 라우트
router.get('/me', authenticate, getCurrentUser);

// 비밀번호 찾기 라우트
router.post('/forgot-password', forgotPassword);

// 비밀번호 재설정 라우트
router.post('/reset-password', resetPassword);

export default router;