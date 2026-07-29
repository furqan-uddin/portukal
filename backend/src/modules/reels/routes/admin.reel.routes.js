import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';
import * as ctrl from '../controllers/admin.reel.controller.js';

const router = Router();
const adminAuth = [authenticate, authorize('admin')];

// Analytics dashboard (must be before /:id)
router.get('/analytics', ...adminAuth, ctrl.getAdminReelAnalytics);

// Listing + detail
router.get('/',    ...adminAuth, ctrl.listReels);
router.get('/:id', ...adminAuth, ctrl.getReelDetail);

// Moderation actions
router.patch('/:id/approve',          ...adminAuth, ctrl.approveReel);
router.patch('/:id/reject',           ...adminAuth, ctrl.rejectReel);
router.patch('/:id/request-changes',  ...adminAuth, ctrl.requestChanges);
router.patch('/:id/feature',          ...adminAuth, ctrl.featureReel);
router.patch('/:id/hide',             ...adminAuth, ctrl.hideReel);
router.patch('/:id/restore',          ...adminAuth, ctrl.restoreReel);

// Hard delete
router.delete('/:id', ...adminAuth, ctrl.deleteReel);

export default router;
