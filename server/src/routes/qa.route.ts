import express from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  acceptAnswer,
  vote,
  getStats
} from '../controllers/qa.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// QA 질문 관련 라우트
router.get('/questions', authenticate, getQuestions);
router.get('/questions/:id', authenticate, getQuestionById);
router.post('/questions', authenticate, createQuestion);
router.put('/questions/:id', authenticate, updateQuestion);
router.delete('/questions/:id', authenticate, deleteQuestion);

// QA 답변 관련 라우트
router.post('/questions/:questionId/answers', authenticate, createAnswer);
router.put('/questions/:questionId/answers/:answerId/accept', authenticate, acceptAnswer);

// QA 투표 관련 라우트
router.post('/vote/:type/:id', authenticate, vote);

// QA 통계 라우트
router.get('/stats', authenticate, getStats);

export default router; 