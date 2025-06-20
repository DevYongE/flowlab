// server/routes/position.route.ts
import express from 'express';
import {
  getAllPositions,
  createPosition,
  updatePosition,
  deletePosition
} from '../controllers/position.controller';

const router = express.Router();

router.get('/', getAllPositions);
router.post('/', createPosition);
router.put('/:code', updatePosition);
router.delete('/:code', deletePosition);

export default router;
