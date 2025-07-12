// server/src/routes/auth.routes.ts
import express from 'express';
import { loginUser, forgotPassword, resetPassword, refreshToken, logoutUser } from '../controllers/auth.controller';

const router = express.Router();

// 로그인 라우트
router.post('/login', loginUser);

// 토큰 리프레시 라우트
router.post('/refresh', refreshToken);

// 로그아웃 라우트
router.post('/logout', logoutUser);

// 비밀번호 찾기 라우트
router.post('/forgot-password', forgotPassword);

// 비밀번호 재설정 라우트
router.post('/reset-password', resetPassword);

export default router;