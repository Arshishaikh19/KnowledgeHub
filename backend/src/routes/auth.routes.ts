import { Router } from 'express';
import {
  registerUserController,
  loginUserController,
  getUsersController,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public auth endpoints
router.post('/register', registerUserController);
router.post('/login', loginUserController);

// Protected endpoint to list organization users
router.get('/users', authMiddleware, getUsersController);

export default router;
