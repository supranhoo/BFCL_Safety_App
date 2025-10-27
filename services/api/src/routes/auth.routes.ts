import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { strictRateLimiter } from '../middlewares/rateLimiter.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

// Public routes
router.post('/register', strictRateLimiter, auditLogger('CREATE', 'user'), register);
router.post('/login', strictRateLimiter, auditLogger('LOGIN', 'auth'), login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout', auditLogger('LOGOUT', 'auth'), logout);
router.get('/me', getCurrentUser);
router.put('/change-password', auditLogger('UPDATE', 'password'), changePassword);

export default router;
