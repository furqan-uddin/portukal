import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize, enforceAccountStatus } from '../../../middlewares/authorize.js';
import { uploadReelVideo } from '../middleware/uploadReelVideo.js';
import * as ctrl from '../controllers/vendor.reel.controller.js';

const router = Router();
const vendorAuth = [authenticate, authorize('vendor'), enforceAccountStatus];

// Analytics overview (before /:id to avoid conflict)
router.get('/analytics/overview', ...vendorAuth, ctrl.getVendorReelAnalyticsOverview);

// CRUD
router.get('/',    ...vendorAuth, ctrl.listMyReels);
router.get('/:id', ...vendorAuth, ctrl.getReelById);

// Upload new reel
router.post('/upload', ...vendorAuth, uploadReelVideo, ctrl.uploadReel);

// Update metadata
router.put('/:id', ...vendorAuth, ctrl.updateReel);

// Workflow transitions
router.patch('/:id/preview',  ...vendorAuth, ctrl.previewReel);
router.patch('/:id/submit',   ...vendorAuth, ctrl.submitReel);
router.patch('/:id/schedule', ...vendorAuth, ctrl.scheduleReel);

// Influencer reel approval by vendor
router.patch('/:id/approve-influencer', ...vendorAuth, ctrl.approveInfluencerReel);
router.patch('/:id/reject-influencer',  ...vendorAuth, ctrl.rejectInfluencerReel);

// New version of approved reel
router.post('/:id/new-version', ...vendorAuth, uploadReelVideo, ctrl.createNewVersion);

// Analytics per reel
router.get('/:id/analytics', ...vendorAuth, ctrl.getReelAnalytics);

// Delete (archive)
router.delete('/:id', ...vendorAuth, ctrl.deleteReel);

export default router;
