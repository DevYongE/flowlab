import express, { Request, Response } from 'express';
import {
  registerUser, getUsers, updateUser, deleteUser,
  updateUserRole, updateUserDepartment, updateUserPosition
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

const router = express.Router();

router.get('/', authenticate, getUsers);
router.post('/register', registerUser); // 회원가입은 인증 불필요
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);
router.patch('/:id/role', authenticate, updateUserRole);
router.patch('/:id/department', authenticate, updateUserDepartment);
router.patch('/:id/position', authenticate, updateUserPosition);

// 아이디 중복 체크
router.get('/check-id', (req: Request, res: Response) => {
  (async () => {
    try {
      const id = String(req.query.id || '');
      if (!id) return res.status(400).json({ exists: false, message: 'id is required' });
      const rows = await sequelize.query('SELECT 1 FROM users WHERE id = :id', { replacements: { id }, type: QueryTypes.SELECT });
      res.json({ exists: Array.isArray(rows) && rows.length > 0 });
    } catch (err) {
      res.status(500).json({ exists: false, message: '서버 오류' });
    }
  })();
});

export default router;