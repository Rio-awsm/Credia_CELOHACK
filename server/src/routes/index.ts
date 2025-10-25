import { Router } from 'express';
import submissionRoutes from './submission.routes';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/tasks', taskRoutes);
router.use('/submissions', submissionRoutes);
router.use('/users', userRoutes);

// Test routes (development only)
if (process.env.NODE_ENV === 'development') {
  import('./test.routes').then((testRoutes) => {
    router.use('/test', testRoutes.default);
  });
}

export default router;
