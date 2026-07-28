import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize, enforceAccountStatus } from '../../../middlewares/authorize.js';
import * as commissionController from '../controllers/commissionConfig.controller.js';

const router = Router();

const adminAuth = [authenticate, authorize('admin', 'superadmin'), enforceAccountStatus];
const vendorAuth = [authenticate, authorize('vendor'), enforceAccountStatus];

// Admin Global Commission Settings
router.get('/global', commissionController.getGlobalCommissionSettings);
router.put('/global', ...adminAuth, commissionController.updateGlobalCommissionSettings);

// Vendor Influencer Settings
router.get('/vendor-settings', ...vendorAuth, commissionController.getVendorInfluencerSettings);
router.put('/vendor-settings', ...vendorAuth, commissionController.updateVendorInfluencerSettings);

export default router;
