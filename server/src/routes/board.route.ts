import express from 'express';
import { 
  getPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  createComment, 
  deleteComment, 
  toggleLike 
} from '../controllers/board.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// 게시글 관련 라우트
router.get('/', getPosts);                           // 게시글 목록 조회
router.get('/:id', getPostById);                     // 게시글 상세 조회
router.post('/', authenticate, createPost);         // 게시글 작성
router.put('/:id', authenticate, updatePost);       // 게시글 수정
router.delete('/:id', authenticate, deletePost);    // 게시글 삭제

// 댓글 관련 라우트
router.post('/:postId/comments', authenticate, createComment);    // 댓글 작성
router.delete('/comments/:commentId', authenticate, deleteComment); // 댓글 삭제

// 좋아요 관련 라우트
router.post('/:postId/like', authenticate, toggleLike);  // 좋아요 토글

export default router; 