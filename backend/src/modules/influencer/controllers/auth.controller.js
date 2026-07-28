import asyncHandler from '../../../utils/asyncHandler.js';
import {
    registerInfluencerService,
    verifyEmailOtpService,
    resendEmailOtpService,
    loginInfluencerService,
    forgotPasswordService,
    verifyResetOtpService,
    resetPasswordService,
    getProfileService,
    updateProfileService,
} from '../services/influencerAuth.service.js';

export const register = asyncHandler(async (req, res) => {
    const result = await registerInfluencerService(req.body);
    res.status(201).json({
        success: true,
        message: 'Influencer application submitted successfully. Please verify your email OTP.',
        data: result,
    });
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await verifyEmailOtpService(email, otp);
    res.status(200).json({
        success: true,
        ...result,
    });
});

export const resendEmailOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await resendEmailOtpService(email);
    res.status(200).json({
        success: true,
        ...result,
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await loginInfluencerService(email, password);
    res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result,
    });
});

export const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
    });
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    res.status(200).json({
        success: true,
        ...result,
    });
});

export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await verifyResetOtpService(email, otp);
    res.status(200).json({
        success: true,
        ...result,
    });
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;
    const result = await resetPasswordService(email, otp, password);
    res.status(200).json({
        success: true,
        ...result,
    });
});

export const getProfile = asyncHandler(async (req, res) => {
    const profile = await getProfileService(req.influencer._id);
    res.status(200).json({
        success: true,
        data: profile,
    });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const updatedProfile = await updateProfileService(req.influencer._id, req.body);
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedProfile,
    });
});
