import { Router } from 'express';
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  submitIncident,
} from '../controllers/incident.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/', auditLogger('CREATE', 'incident'), createIncident);
router.get('/', getAllIncidents);
router.get('/:id', getIncidentById);
router.put('/:id', auditLogger('UPDATE', 'incident'), updateIncident);
router.delete('/:id', authorize('Safety Head', 'ASM'), auditLogger('DELETE', 'incident'), deleteIncident);
router.post('/:id/submit', auditLogger('SUBMIT', 'incident'), submitIncident);

export default router;
