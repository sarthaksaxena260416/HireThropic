import { Router } from 'express';
import { getStats } from '../controllers/stats.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/', getStats);

export default router;