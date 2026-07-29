import { Router } from 'express';
import { optionalAuth, authenticate } from '../../../middlewares/authenticate.js';
import * as ctrl from '../controllers/user.reel.controller.js';

const router = Router();

// Public endpoints (login optional for feed enrichment)
router.get('/feed',        optionalAuth, ctrl.getFeed);
router.get('/categories',  optionalAuth, ctrl.getReelCategories);
router.get('/:id/comments', optionalAuth, ctrl.getComments);

// Tracking (login optional — anonymous tracking supported)
router.post('/:id/view',         optionalAuth, ctrl.trackView);
router.post('/:id/share',        optionalAuth, ctrl.trackShare);
router.post('/:id/track/click',  optionalAuth, ctrl.trackProductClick);

// Auth-required actions
router.post('/:id/like',   authenticate, ctrl.toggleLike);
router.post('/:id/save',   authenticate, ctrl.toggleSave);
router.post('/:id/comments',                         authenticate, ctrl.addComment);
router.delete('/comments/:commentId',                authenticate, ctrl.deleteComment);
router.post('/comments/:commentId/like',             authenticate, ctrl.likeComment);
router.post('/comments/:commentId/report',           authenticate, ctrl.reportComment);
router.post('/follow/vendor/:vendorId',              authenticate, ctrl.toggleFollowVendor);

export default router;
