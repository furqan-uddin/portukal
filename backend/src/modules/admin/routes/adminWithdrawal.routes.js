import express from 'express';
import {
    getAllWithdrawalRequests,
    updateWithdrawalStatus,
    bulkUpdateWithdrawals,
    triggerSettlementRun,
    exportWithdrawalsCSV,
} from '../controllers/adminWithdrawal.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', getAllWithdrawalRequests);
router.get('/export-csv', exportWithdrawalsCSV);
router.patch('/:id/status', updateWithdrawalStatus);
router.post('/bulk-status', bulkUpdateWithdrawals);
router.post('/settlements/run', triggerSettlementRun);

export default router;
