import express from 'express';
import {
  registerUser, getUsers, updateUser, deleteUser,
  updateUserRole, updateUserDepartment, updateUserPosition
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', authenticate, getUsers);
router.post('/register', registerUser); // 회원가입은 인증 불필요
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);
router.patch('/:id/role', authenticate, updateUserRole);
router.patch('/:id/department', authenticate, updateUserDepartment);
router.patch('/:id/position', authenticate, updateUserPosition);

export default router;