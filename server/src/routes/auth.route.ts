// server/src/routes/auth.routes.ts
import express from 'express';
import { loginUser, forgotPassword, resetPassword } from '../controllers/auth.controller';


const router = express.Router();

// 로그인 라우트
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;