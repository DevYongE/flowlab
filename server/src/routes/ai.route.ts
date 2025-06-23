import express from 'express';
import { analyzeRequirement } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/analyze-requirement', authenticate, analyzeRequirement);

export default router; 