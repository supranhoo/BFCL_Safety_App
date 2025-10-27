import { Router, type Router as RouterType } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  assignRole,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { auditLogger } from '../middlewares/audit.middleware';

const router: RouterType = Router();

router.use(authenticate);

router.get('/', authorize('Safety Head', 'ASM'), getAllUsers);
router.get('/:id', getUserById);
router.post('/', authorize('Safety Head', 'ASM'), auditLogger('CREATE', 'user'), createUser);
router.put('/:id', authorize('Safety Head', 'ASM'), auditLogger('UPDATE', 'user'), updateUser);
router.delete('/:id', authorize('Safety Head'), auditLogger('DEACTIVATE', 'user'), deactivateUser);
router.put('/:id/role', authorize('Safety Head'), auditLogger('ASSIGN_ROLE', 'user'), assignRole);

export default router;
