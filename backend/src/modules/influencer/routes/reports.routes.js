import express from 'express';
import {
    generateReportHandler,
    getReportHistoryHandler,
    downloadReportHandler,
} from '../controllers/reports.controller.js';
import { influencerAuthenticate } from '../middleware/influencerAuth.js';
import { authenticate } from '../../../middlewares/authenticate.js';

const router = express.Router();

const dynamicAuth = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return influencerAuthenticate(req, res, (err) => {
            if (!err && req.influencer) return next();
            return authenticate(req, res, next);
        });
    }
    return authenticate(req, res, next);
};

router.use(dynamicAuth);

router.post('/generate', generateReportHandler);
router.get('/history', getReportHistoryHandler);
router.get('/download/:id', downloadReportHandler);

export default router;
