import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';


const router = Router();

// Submit task (with moderation)
router.post('/submissions', SubmissionController.submitTask);

// Get moderation stats (admin only)
router.get('/moderation/stats', SubmissionController.getModerationStats);

export default router;
