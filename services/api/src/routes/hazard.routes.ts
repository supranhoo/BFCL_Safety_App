import { Router } from 'express';
import {
  createHazard,
  getAllHazards,
  getHazardById,
  updateHazard,
  closeHazard,
  getHazardRegister,
} from '../controllers/hazard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.use(authenticate);

router.post('/', auditLogger('CREATE', 'hazard'), createHazard);
router.get('/', getAllHazards);
router.get('/register', getHazardRegister);
router.get('/:id', getHazardById);
router.put('/:id', auditLogger('UPDATE', 'hazard'), updateHazard);
router.post('/:id/close', auditLogger('CLOSE', 'hazard'), closeHazard);

export default router;
