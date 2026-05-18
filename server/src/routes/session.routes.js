import { Router } from 'express';
import {
  createSession,
  getSession,
  addMessage,
  completeSession,
  getUserSessions,
} from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getUserSessions);
router.post('/', createSession);
router.get('/:id', getSession);
router.post('/:id/messages', addMessage);
router.patch('/:id/complete', completeSession);

export default router;