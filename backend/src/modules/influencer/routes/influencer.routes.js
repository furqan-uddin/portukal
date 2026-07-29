import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { influencerAuthenticate } from '../middleware/influencerAuth.js';
import { validate } from '../../../middlewares/validate.js';
import {
    registerSchema,
    updateProfileSchema,
} from '../validators/auth.validator.js';

import { optionalAuth } from '../../../middlewares/authenticate.js';

const router = express.Router();

// Public / Optionally Authenticated routes
router.post('/register', optionalAuth, validate(registerSchema), authController.register);

// Protected routes (Requires Unified User JWT)
router.get('/profile', influencerAuthenticate, authController.getProfile);
router.put('/profile', influencerAuthenticate, validate(updateProfileSchema), authController.updateProfile);

export default router;
