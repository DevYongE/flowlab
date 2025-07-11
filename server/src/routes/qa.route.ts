import express from 'express';
import { 
  getQuestions, 
  getQuestionById, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  adoptAnswer,
  voteQuestion,
  voteAnswer,
  updateQuestionStatus,
  getQAStats
} from '../controllers/qa.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// 통계 라우트
router.get('/stats', authenticate, getQAStats);

// 질문 관련 라우트
router.get('/questions', authenticate, getQuestions);
router.get('/questions/:id', authenticate, getQuestionById);
router.post('/questions', authenticate, createQuestion);
router.put('/questions/:id', authenticate, updateQuestion);
router.delete('/questions/:id', authenticate, deleteQuestion);
router.put('/questions/:id/status', authenticate, updateQuestionStatus);

// 답변 관련 라우트
router.post('/questions/:id/answers', authenticate, createAnswer);
router.put('/answers/:id', authenticate, updateAnswer);
router.delete('/answers/:id', authenticate, deleteAnswer);
router.put('/answers/:id/adopt', authenticate, adoptAnswer);

// 투표 관련 라우트
router.post('/questions/:id/vote', authenticate, voteQuestion);
router.post('/answers/:id/vote', authenticate, voteAnswer);

export default router; 