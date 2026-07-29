import express from 'express';
import {
    getFraudRulesHandler,
    updateFraudRuleHandler,
    getFraudLogsHandler,
    updateFraudCaseHandler,
} from '../controllers/fraud.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/rules', getFraudRulesHandler);
router.put('/rules/:id', updateFraudRuleHandler);
router.get('/cases', getFraudLogsHandler);
router.put('/cases/:id', updateFraudCaseHandler);

export default router;
