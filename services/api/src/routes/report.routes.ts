import { Router, type Router as RouterType } from 'express';
import {
  getDashboard,
  getIncidentReport,
  getOSHALog,
  getCAPAAgeing,
  getKPIReport,
  getComplianceReport,
} from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router: RouterType = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/incidents', getIncidentReport);
router.get('/osha-log', authorize('Safety Head', 'ASM'), getOSHALog);
router.get('/capa-ageing', getCAPAAgeing);
router.get('/kpi', getKPIReport);
router.get('/compliance', authorize('Safety Head', 'ASM'), getComplianceReport);

export default router;
