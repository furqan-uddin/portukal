import { Router } from 'express';
import * as referralController from '../controllers/referral.controller.js';

const router = Router();

router.post('/track-click', referralController.trackReferralClick);
router.get('/validate/:code', referralController.validateReferralCode);

export default router;
