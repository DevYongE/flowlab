import express from 'express';
import { getAllRoles } from '../controllers/role.controller';
const router = express.Router();
router.get('/', getAllRoles);
export default router; 