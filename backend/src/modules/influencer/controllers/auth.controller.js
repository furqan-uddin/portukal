import asyncHandler from '../../../utils/asyncHandler.js';
import {
    registerInfluencerService,
    getProfileService,
    updateProfileService,
} from '../services/influencerAuth.service.js';

export const register = asyncHandler(async (req, res) => {
    const result = await registerInfluencerService(req.body, req.user?.id);
    res.status(201).json({
        success: true,
        message: 'Influencer application submitted successfully.',
        data: result,
    });
});

export const getProfile = asyncHandler(async (req, res) => {
    const profile = await getProfileService(req.influencer._id);
    console.log(`\n======================================================`);
    console.log(`[Logged-in Profile Resolution] user: "${req.user?.id || 'N/A'}" => resolved Influencer _id: "${profile._id}" (slug: "${profile.slug}", name: "${profile.name}")`);
    console.log(`======================================================\n`);
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
