import { Router } from 'express';
import { createTask, listTasks, getTask, rerunTask } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', createTask);
router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/:id/rerun', rerunTask);

export default router;
