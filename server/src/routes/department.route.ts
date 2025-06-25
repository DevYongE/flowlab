import express from 'express';
import { createDepartment, getDepartments, getDepartmentById, updateDepartment } from '../controllers/department.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', authenticate, createDepartment);
router.get('/', authenticate, getDepartments);
router.get('/:id', authenticate, getDepartmentById);
router.put('/:id', authenticate, updateDepartment);

export default router; 