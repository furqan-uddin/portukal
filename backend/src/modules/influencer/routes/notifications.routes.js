import express from 'express';
import {
    getNotificationsHandler,
    markAsReadHandler,
    markAllAsReadHandler,
    archiveNotificationHandler,
} from '../controllers/notifications.controller.js';
import { influencerAuthenticate } from '../middleware/influencerAuth.js';
import { authenticate } from '../../../middlewares/authenticate.js';

const router = express.Router();

const dynamicAuth = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Try influencer first if path fits
        return influencerAuthenticate(req, res, (err) => {
            if (!err && req.influencer) return next();
            return authenticate(req, res, next);
        });
    }
    return authenticate(req, res, next);
};

router.use(dynamicAuth);

router.get('/', getNotificationsHandler);
router.put('/read-all', markAllAsReadHandler);
router.put('/:id/read', markAsReadHandler);
router.delete('/:id', archiveNotificationHandler);

export default router;
