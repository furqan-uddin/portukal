import { Router } from 'express';
import { influencerAuthenticate, enforceApprovedInfluencer } from '../middleware/influencerAuth.js';
import * as ctrl from '../controllers/influencerSupport.controller.js';

const router = Router();
const influencerAuth = [influencerAuthenticate, enforceApprovedInfluencer];

// Domain 1: Influencer ↔ Admin Support Tickets & Chat
router.get('/support/ticket-types',       ...influencerAuth, ctrl.getTicketTypes);
router.get('/support/tickets',            ...influencerAuth, ctrl.getMyAdminTickets);
router.post('/support/tickets',           ...influencerAuth, ctrl.createAdminTicket);
router.post('/support/tickets/:id/message', ...influencerAuth, ctrl.replyToAdminTicket);

// Domain 2: Influencer ↔ Vendor Creator Collaborations
router.get('/collaborations',             ...influencerAuth, ctrl.getVendorCollaborations);
router.get('/collaborations/:id',         ...influencerAuth, ctrl.getCollaborationDetail);
router.post('/collaborations/:id/message', ...influencerAuth, ctrl.sendCollaborationMessage);

export default router;
