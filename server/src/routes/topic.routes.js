import { Router } from 'express';
import { getTopics } from '../controllers/topic.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getTopics);

export default router;