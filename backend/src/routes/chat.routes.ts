import { Router } from 'express';
import {
  chatRAGController,
  getChatHistoryController,
  getSingleChatSessionController,
  deleteChatSessionController,
} from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Task 5: POST /api/chat
router.post('/', chatRAGController);

// Task 6: GET /api/chat/history (per-user past conversations)
router.get('/history', getChatHistoryController);
router.get('/history/:id', getSingleChatSessionController);
router.delete('/history/:id', deleteChatSessionController);

export default router;
