import express from 'express';
import { getSystemOperationsHandler } from '../controllers/systemHealth.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/operations', getSystemOperationsHandler);

export default router;
