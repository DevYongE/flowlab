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
  createDevNoteComment,
  getProjectAssignees,
  assignUserToProject,
  getDevNoteAssignees,
  assignUserToDevNote,
  removeUserFromProject,
  removeUserFromDevNote,
  bulkCreateDevNotes,
  clearProjectWbs // WBS 전체 삭제 함수 추가
} from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = express.Router();

// Assignees routes
router.get('/:id/assignees', authenticate, getProjectAssignees);
router.post('/:id/assign-user', authenticate, assignUserToProject);
router.delete('/:id/remove-user', authenticate, removeUserFromProject);

// Project routes
router.get('/', authenticate, getProjects);
router.get('/ongoing', authenticate, getOngoingProjects);
router.get('/status-summary', authenticate, getProjectStatusSummary);
router.get('/:id', authenticate, getProjectById);
router.get('/:projectId/wbs', authenticate, getDevNotesAsWbs);
router.delete('/:projectId/wbs/clear', authenticate, clearProjectWbs); // WBS 전체 삭제
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

// DevNote routes
router.post('/:projectId/notes', authenticate, createDevNote);
router.post('/:projectId/notes/bulk', authenticate, bulkCreateDevNotes); // 새로운 라우트 추가
router.put('/notes/:noteId', authenticate, updateDevNote);
router.delete('/notes/:noteId', authenticate, deleteDevNote);

// DevNote Comment routes
router.get('/notes/:noteId/comments', authenticate, getDevNoteComments);
router.post('/notes/:noteId/comments', authenticate, createDevNoteComment);

// DevNotes 구조 업데이트 라우트
router.patch('/notes/structure/:projectId', authenticate, updateDevNotesStructure);

// DevNote Assignees routes
router.get('/notes/:noteId/assignees', authenticate, getDevNoteAssignees);
router.post('/notes/:noteId/assign-user', authenticate, assignUserToDevNote);
router.delete('/notes/:noteId/remove-user', authenticate, removeUserFromDevNote);

export default router; 