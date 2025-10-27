import { Router } from 'express';
import {
  createPPEItem,
  getAllPPEItems,
  issuePPE,
  returnPPE,
  getLowStockItems,
  getCalibrationDue,
} from '../controllers/ppe.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/items', authorize('Safety Head', 'ASM'), auditLogger('CREATE', 'ppe_item'), createPPEItem);
router.get('/items', getAllPPEItems);
router.get('/items/low-stock', getLowStockItems);

router.post('/issue', auditLogger('ISSUE', 'ppe'), issuePPE);
router.post('/return/:id', auditLogger('RETURN', 'ppe'), returnPPE);

router.get('/calibrations/due', getCalibrationDue);

export default router;
