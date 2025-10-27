import { Router } from 'express';
import {
  createAudit,
  getAllAudits,
  getAuditById,
  updateAudit,
  completeAudit,
  getAuditCheckpoints,
} from '../controllers/audit.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Safety Head', 'ASM', 'Senior Safety Officer'), auditLogger('CREATE', 'audit'), createAudit);
router.get('/', getAllAudits);
router.get('/:id', getAuditById);
router.get('/:id/checkpoints', getAuditCheckpoints);
router.put('/:id', auditLogger('UPDATE', 'audit'), updateAudit);
router.post('/:id/complete', auditLogger('COMPLETE', 'audit'), completeAudit);

export default router;
