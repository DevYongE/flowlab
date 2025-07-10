import express from 'express';
import { analyzeRequirement, generateWbsFromProjectDescription } from '../controllers/ai.controller'; // generateWbsFromProjectDescription 추가
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/analyze-dev-note', authenticate, analyzeRequirement);
router.post('/generate-wbs', authenticate, generateWbsFromProjectDescription); // 새로운 라우트 추가

export default router; 