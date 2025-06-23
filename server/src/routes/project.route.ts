import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  createDevNote,
  updateDevNote,
  deleteDevNote,
  getOngoingProjects,
  updateDevNotesStructure,
  getDevNotesAsWbs,
  getProjectStatusSummary,
  getDevNoteComments,
  createDevNoteComment
} from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = express.Router();

// Project routes
router.get('/', authenticate, getProjects);
router.get('/ongoing', authenticate, getOngoingProjects);
router.get('/status-summary', authenticate, getProjectStatusSummary);
router.get('/:id', authenticate, getProjectById);
router.get('/:projectId/wbs', authenticate, getDevNotesAsWbs);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

// DevNote routes
router.post('/:projectId/notes', authenticate, createDevNote);
router.put('/notes/:noteId', authenticate, updateDevNote);
router.delete('/notes/:noteId', authenticate, deleteDevNote);

// DevNote Comment routes
router.get('/notes/:noteId/comments', authenticate, getDevNoteComments);
router.post('/notes/:noteId/comments', authenticate, createDevNoteComment);

// DevNotes 구조 업데이트 라우트
router.patch('/notes/structure/:projectId', authenticate, updateDevNotesStructure);

export default router; 