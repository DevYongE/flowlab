import express from 'express';
import { createSolution, getSolutions, getSolutionById } from '../controllers/solution.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', authenticate, createSolution);
router.get('/', authenticate, getSolutions);
router.get('/:id', authenticate, getSolutionById);

export default router; 