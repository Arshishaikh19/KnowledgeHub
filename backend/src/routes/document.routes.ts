import { Router } from 'express';
import {
  uploadDocumentController,
  getDocumentsController,
  shareDocumentController,
  reuploadDocumentController,
  retryDocumentController,
} from '../controllers/document.controller';
import { authMiddleware } from '../middleware/auth';
import { documentUpload } from '../middleware/upload';

const router = Router();

// Apply auth middleware to all document routes
router.use(authMiddleware);

// Task 1: POST /api/documents/upload
router.post('/upload', documentUpload.single('file'), uploadDocumentController);

// Task 2: GET /api/documents (permission filtered)
router.get('/', getDocumentsController);

// Task 3: POST /api/documents/:id/share
router.post('/:id/share', shareDocumentController);

// Task 4: POST /api/documents/:id/reupload
router.post('/:id/reupload', documentUpload.single('file'), reuploadDocumentController);

// Task 7: POST /api/documents/:id/retry
router.post('/:id/retry', retryDocumentController);

export default router;

