import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';
import * as ctrl from '../controllers/adminInfluencerSupport.controller.js';

const router = Router();
const adminAuth = [authenticate, authorize('admin')];

// Admin ↔ Influencer Live Support & Chat Tickets
router.get('/tickets',     ...adminAuth, ctrl.getAdminInfluencerTickets);
router.get('/tickets/:id', ...adminAuth, ctrl.getInfluencerTicketDetail);
router.post('/tickets/:id/message', ...adminAuth, ctrl.replyToInfluencerTicket);

export default router;
