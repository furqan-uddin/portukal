import express from 'express';
import {
    getInfluencerWalletSummary,
    getInfluencerWalletTransactions,
    getInfluencerSettlements,
    requestWithdrawal,
    getInfluencerWithdrawals,
} from '../controllers/influencerWallet.controller.js';
import { influencerAuthenticate, enforceApprovedInfluencer } from '../middleware/influencerAuth.js';

const router = express.Router();

router.use(influencerAuthenticate, enforceApprovedInfluencer);

router.get('/summary', getInfluencerWalletSummary);
router.get('/transactions', getInfluencerWalletTransactions);
router.get('/settlements', getInfluencerSettlements);
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getInfluencerWithdrawals);

export default router;
