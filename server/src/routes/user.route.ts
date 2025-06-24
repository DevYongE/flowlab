import express from 'express';
import {
  registerUser, getUsers, updateUser, deleteUser,
  updateUserRole, updateUserDepartment, updateUserPosition
} from '../controllers/user.controller';

const router = express.Router();

router.get('/', getUsers);
router.post('/register', registerUser); // 🔥 여기서 더 이상 오류 안 남
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/department', updateUserDepartment);
router.patch('/:id/position', updateUserPosition);

export default router;