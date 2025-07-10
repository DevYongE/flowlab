import express from 'express';
import { analyzeRequirement, generateWbsFromProjectDescription, generateAndSaveWbs } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/analyze-dev-note', authenticate, analyzeRequirement);
router.post('/generate-wbs', authenticate, generateAndSaveWbs); // WBS 생성 및 저장 통합 함수
router.post('/generate-wbs-only', authenticate, generateWbsFromProjectDescription); // WBS만 생성 (저장X)

export default router; 