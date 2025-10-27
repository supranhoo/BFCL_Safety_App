import { Router } from 'express';
import {
  createTrainingProgram,
  getAllTrainingPrograms,
  createTrainingSession,
  getAllTrainingSessions,
  recordAttendance,
  getCertifications,
  getExpiringCertifications,
} from '../controllers/training.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/programs', authorize('Safety Head', 'ASM'), auditLogger('CREATE', 'training_program'), createTrainingProgram);
router.get('/programs', getAllTrainingPrograms);

router.post('/sessions', authorize('Safety Head', 'ASM'), auditLogger('CREATE', 'training_session'), createTrainingSession);
router.get('/sessions', getAllTrainingSessions);
router.post('/sessions/:id/attendance', auditLogger('RECORD', 'attendance'), recordAttendance);

router.get('/certifications', getCertifications);
router.get('/certifications/expiring', getExpiringCertifications);

export default router;
