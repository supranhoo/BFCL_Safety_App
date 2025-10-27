import { Router } from 'express';
import {
  createMockDrill,
  getAllMockDrills,
  getMockDrillById,
  updateMockDrill,
  completeMockDrill,
  recordParticipation,
} from '../controllers/mockDrill.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('Safety Head', 'ASM'), auditLogger('CREATE', 'mock_drill'), createMockDrill);
router.get('/', getAllMockDrills);
router.get('/:id', getMockDrillById);
router.put('/:id', auditLogger('UPDATE', 'mock_drill'), updateMockDrill);
router.post('/:id/complete', auditLogger('COMPLETE', 'mock_drill'), completeMockDrill);
router.post('/:id/participation', auditLogger('RECORD', 'drill_participation'), recordParticipation);

export default router;
