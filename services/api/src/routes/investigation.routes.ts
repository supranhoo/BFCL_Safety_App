import { Router } from 'express';
import {
  createInvestigation,
  getAllInvestigations,
  getInvestigationById,
  updateInvestigation,
  submitInvestigation,
  approveInvestigation,
} from '../controllers/investigation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/', auditLogger('CREATE', 'investigation'), createInvestigation);
router.get('/', getAllInvestigations);
router.get('/:id', getInvestigationById);
router.put('/:id', auditLogger('UPDATE', 'investigation'), updateInvestigation);
router.post('/:id/submit', auditLogger('SUBMIT', 'investigation'), submitInvestigation);
router.post('/:id/approve', authorize('Safety Head', 'ASM'), auditLogger('APPROVE', 'investigation'), approveInvestigation);

export default router;
