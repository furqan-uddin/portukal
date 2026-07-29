import express from 'express';
import { getAuditLogsHandler } from '../controllers/audit.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', getAuditLogsHandler);

export default router;
