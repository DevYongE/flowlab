import express from 'express';
import { 
  getQuestions, 
  getQuestionById, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  createAnswer,
  updateQuestionStatus
} from '../controllers/qa.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// 질문 관련 라우트
router.get('/questions', authenticate, getQuestions);
router.get('/questions/:id', authenticate, getQuestionById);
router.post('/questions', authenticate, createQuestion);
router.put('/questions/:id', authenticate, updateQuestion);
router.delete('/questions/:id', authenticate, deleteQuestion);
router.put('/questions/:id/status', authenticate, updateQuestionStatus);

// 답변 관련 라우트
router.post('/questions/:id/answers', authenticate, createAnswer);

export default router; 