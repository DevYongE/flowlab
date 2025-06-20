import express from 'express';
import { getNotices, getNotice, createNotice, updateNotice, deleteNotice, getLatestNotices } from '../controllers/notice.controller';
import { requireAdmin } from '../middlewares/admin.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', getNotices);
router.get('/latest', authenticate, getLatestNotices);
router.get('/:id', getNotice);
router.post('/', authenticate, requireAdmin, createNotice);
router.put('/:id', authenticate, requireAdmin, updateNotice);
router.delete('/:id', authenticate, requireAdmin, deleteNotice);

export default router; 