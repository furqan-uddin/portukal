import { Router } from 'express';
import { influencerAuthenticate, enforceApprovedInfluencer } from '../../influencer/middleware/influencerAuth.js';
import * as ctrl from '../controllers/influencer.reel.controller.js';

import { uploadReelVideo } from '../middleware/uploadReelVideo.js';

const router = Router();
const influencerAuth = [influencerAuthenticate, enforceApprovedInfluencer];

// Marketplace discovery & upload
router.post('/upload',       ...influencerAuth, uploadReelVideo, ctrl.uploadInfluencerReel);
router.get('/',              ...influencerAuth, ctrl.browseReels);
router.get('/categories',    ...influencerAuth, ctrl.getReelCategories);
router.get('/my-analytics',  ...influencerAuth, ctrl.getMyReelAnalytics);
router.get('/:id',           ...influencerAuth, ctrl.getReelDetail);

// Actions
router.post('/:id/generate-link', ...influencerAuth, ctrl.generateReelAffiliateLink);
router.post('/:id/favourite',     ...influencerAuth, ctrl.toggleFavouriteReel);
router.post('/follow/vendor/:vendorId', ...influencerAuth, ctrl.toggleFollowVendor);

// Vendor Promotion Invitations & Collaboration Requests
router.get('/invitations/my-requests', ...influencerAuth, ctrl.getMyInvitations);
router.patch('/invitations/:id/respond', ...influencerAuth, ctrl.respondToInvitation);
router.post('/request-collaboration',    ...influencerAuth, ctrl.sendProductCollaborationRequest);

export default router;
