import express from 'express';
import { registerUser, getUsers } from '../controllers/user.controller'; // ✅ 중괄호로 가져와야 함

const router = express.Router();

router.get('/', getUsers);
router.post('/register', registerUser); // 🔥 여기서 더 이상 오류 안 남

export default router;