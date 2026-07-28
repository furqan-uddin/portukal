import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { influencerAuthenticate } from '../middleware/influencerAuth.js';
import { validate } from '../../../middlewares/validate.js';
import {
    registerSchema,
    loginSchema,
    verifyEmailOtpSchema,
    resendEmailOtpSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    updateProfileSchema,
} from '../validators/auth.validator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-email-otp', validate(verifyEmailOtpSchema), authController.verifyEmailOtp);
router.post('/resend-email-otp', validate(resendEmailOtpSchema), authController.resendEmailOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes (Requires Influencer JWT)
router.get('/profile', influencerAuthenticate, authController.getProfile);
router.put('/profile', influencerAuthenticate, validate(updateProfileSchema), authController.updateProfile);

export default router;
