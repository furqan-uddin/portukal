import { verifyAccessToken } from '../../../config/jwt.js';
import ApiError from '../../../utils/ApiError.js';
import asyncHandler from '../../../utils/asyncHandler.js';
import Influencer from '../models/Influencer.model.js';

export const influencerAuthenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Authentication required. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyAccessToken(token);

        if (decoded.role !== 'influencer') {
            throw new ApiError(403, 'Access denied. Influencer authorization required.');
        }

        const influencer = await Influencer.findById(decoded.id);
        if (!influencer) {
            throw new ApiError(401, 'Influencer account not found.');
        }

        if (influencer.status === 'suspended') {
            throw new ApiError(403, 'Your influencer account has been suspended. Please contact support.');
        }

        req.influencer = influencer;
        req.user = { id: influencer._id, role: 'influencer', email: influencer.email };
        next();
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(401, 'Invalid or expired influencer token.');
    }
});

export const enforceApprovedInfluencer = (req, res, next) => {
    if (!req.influencer || req.influencer.status !== 'approved' || req.influencer.isActive === false) {
        throw new ApiError(403, 'Access denied. Only approved and active influencers can access this feature.');
    }
    next();
};
