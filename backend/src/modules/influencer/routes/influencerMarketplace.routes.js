import { Router } from 'express';
import { influencerAuthenticate, enforceApprovedInfluencer } from '../middleware/influencerAuth.js';
import * as marketplaceController from '../controllers/influencerMarketplace.controller.js';

const router = Router();

const approvedInfluencerAuth = [influencerAuthenticate, enforceApprovedInfluencer];

router.get('/marketplace', ...approvedInfluencerAuth, marketplaceController.getMarketplaceProducts);
router.get('/marketplace/product/:slug', ...approvedInfluencerAuth, marketplaceController.getMarketplaceProductBySlug);

export default router;
