import { verifyAccessToken } from '../../../config/jwt.js';
import ApiError from '../../../utils/ApiError.js';
import asyncHandler from '../../../utils/asyncHandler.js';
import Influencer from '../models/Influencer.model.js';
import User from '../../../models/User.model.js';

export const influencerAuthenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Authentication required. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyAccessToken(token);

        // A valid user token should have 'customer' (or perhaps 'user') role
        if (decoded.role !== 'customer' && decoded.role !== 'user') {
            throw new ApiError(403, 'Access denied. Valid user authorization required.');
        }

        // We find the User
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new ApiError(401, 'User account not found.');
        }

        // Check if this User has an Influencer profile
        const influencer = await Influencer.findOne({ user: user._id });
        if (!influencer) {
            throw new ApiError(403, 'Access denied. You have not registered for the Influencer program.');
        }

        if (influencer.status === 'suspended') {
            throw new ApiError(403, 'Your influencer account has been suspended. Please contact support.');
        }

        req.influencer = influencer;
        req.user = user;
        next();
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(401, 'Invalid or expired token.');
    }
});

export const enforceApprovedInfluencer = (req, res, next) => {
    if (!req.influencer || req.influencer.status !== 'approved' || req.influencer.isActive === false) {
        throw new ApiError(403, 'Access denied. Only approved and active influencers can access this feature.');
    }
    next();
};
