import { Router } from 'express';
import { influencerAuthenticate, enforceApprovedInfluencer } from '../middleware/influencerAuth.js';
import * as affiliateLinkController from '../controllers/affiliateLink.controller.js';

const router = Router();

const approvedInfluencerAuth = [influencerAuthenticate, enforceApprovedInfluencer];

router.post('/generate', ...approvedInfluencerAuth, affiliateLinkController.generateAffiliateLink);
router.get('/', ...approvedInfluencerAuth, affiliateLinkController.getMyAffiliateLinks);
router.delete('/:id', ...approvedInfluencerAuth, affiliateLinkController.deleteAffiliateLink);

export default router;
