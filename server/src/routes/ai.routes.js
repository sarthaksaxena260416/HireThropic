import { Router } from 'express';
import { chat, evaluateSession } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/chat', chat);
router.post('/evaluate', evaluateSession);

export default router;