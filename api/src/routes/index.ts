import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';
import * as auth from '../controllers/authController';
import * as documents from '../controllers/documentController';
import * as flashcards from '../controllers/flashcardController';
import * as reviews from '../controllers/reviewController';
import * as sessions from '../controllers/sessionController';
import { ensureUploadDir } from '../controllers/documentController';

const uploadDir = ensureUploadDir();
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.txt', '.md'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

const router = Router();

// Auth
router.post('/auth/signup', auth.signup);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireAuth, auth.me);

// Documents
router.post('/documents/upload', requireAuth, upload.single('file'), documents.uploadDocument);
router.get('/documents', requireAuth, documents.listDocuments);
router.get('/documents/:id', requireAuth, documents.getDocument);
router.delete('/documents/:id', requireAuth, documents.deleteDocument);
router.post(
  '/documents/:id/generate-flashcards',
  requireAuth,
  documents.generateDocumentFlashcards
);
router.get('/documents/:id/flashcards', requireAuth, documents.listDocumentFlashcards);

// Flashcards
router.get('/flashcards/due', requireAuth, flashcards.getDueFlashcards);

// Reviews
router.post('/reviews', requireAuth, reviews.createReview);
router.get('/reviews', requireAuth, reviews.listReviews);

// Sessions
router.post('/sessions/start', requireAuth, sessions.startSession);
router.post('/sessions/:id/end', requireAuth, sessions.endSession);
router.get('/sessions', requireAuth, sessions.listSessions);

// Stats
router.get('/stats/retention', requireAuth, sessions.getRetentionStats);
router.get('/stats/activity', requireAuth, sessions.getActivityStats);

export default router;
