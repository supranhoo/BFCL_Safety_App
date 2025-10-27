import { Router, type Router as RouterType } from 'express';
import {
  createInvestigation,
  getAllInvestigations,
  getInvestigationById,
  updateInvestigation,
  submitInvestigation,
  approveInvestigation,
  closeInvestigation,
  deleteInvestigation,
  getInvestigationStats,
} from '../controllers/investigation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router: RouterType = Router();

router.use(authenticate);

// Investigation CRUD
router.post('/', auditLogger('CREATE', 'investigation'), createInvestigation);
router.get('/', getAllInvestigations);
router.get('/stats', getInvestigationStats);
router.get('/:id', getInvestigationById);
router.put('/:id', auditLogger('UPDATE', 'investigation'), updateInvestigation);
router.delete('/:id', auditLogger('DELETE', 'investigation'), deleteInvestigation);

// Investigation workflow
router.post('/:id/submit', auditLogger('SUBMIT', 'investigation'), submitInvestigation);
router.post('/:id/approve', authorize('Safety Head', 'Assistant Safety Manager'), auditLogger('APPROVE', 'investigation'), approveInvestigation);
router.post('/:id/close', authorize('Safety Head'), auditLogger('CLOSE', 'investigation'), closeInvestigation);

export default router;
