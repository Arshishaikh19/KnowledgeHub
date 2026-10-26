import { Router } from 'express';
import { semanticSearchController } from '../controllers/search.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Task 7: GET /api/search (semantic search only)
router.get('/', semanticSearchController);

export default router;
