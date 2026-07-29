import express from 'express';
import {
    getVendorInfluencerWalletSummary,
    getVendorLedger,
    getVendorSettlements,
} from '../controllers/vendorWallet.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize, enforceAccountStatus } from '../../../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, authorize('vendor'), enforceAccountStatus);

router.get('/summary', getVendorInfluencerWalletSummary);
router.get('/ledger', getVendorLedger);
router.get('/settlements', getVendorSettlements);

export default router;
