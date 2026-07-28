import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Influencer from '../models/Influencer.model.js';
import Product from '../../../models/Product.model.js';
import AffiliateLink from '../models/AffiliateLink.model.js';
import ReferralClick from '../models/ReferralClick.model.js';
import { getGlobalCommissionSettingsData } from '../services/commissionHelper.js';

// POST /api/referrals/track-click
export const trackReferralClick = asyncHandler(async (req, res) => {
    const { referralCode, productSlug, customerId, sessionId, ipAddress, userAgent, device } = req.body;

    if (!referralCode || !productSlug) {
        throw new ApiError(400, 'Referral code and product slug are required.');
    }

    // Check Global Program Status
    const globalSettings = await getGlobalCommissionSettingsData();
    if (!globalSettings.isEnabled) {
        return res.status(200).json(new ApiResponse(200, { valid: false, programDisabled: true }, 'Influencer program is currently disabled.'));
    }

    // 1. Validate Influencer
    const influencer = await Influencer.findOne({ referralCode, status: 'approved', isActive: true });
    if (!influencer) {
        return res.status(200).json(new ApiResponse(200, { valid: false }, 'Invalid or inactive referral code.'));
    }

    // 2. Validate Product
    const product = await Product.findOne({ slug: productSlug, isActive: true, allowInfluencer: true });
    if (!product) {
        return res.status(200).json(new ApiResponse(200, { valid: false }, 'Product not found or not eligible for referral tracking.'));
    }

    // 3. Self-Referral Fraud Rule: Compare logged in user or customer email with Influencer
    const reqEmail = (req.user?.email || '').toLowerCase().trim();
    const influencerEmail = (influencer.email || '').toLowerCase().trim();
    const reqUserId = req.user?.id ? String(req.user.id) : null;
    const influencerUserId = influencer._id ? String(influencer._id) : null;

    if ((reqEmail && reqEmail === influencerEmail) || (reqUserId && reqUserId === influencerUserId)) {
        return res.status(200).json(new ApiResponse(200, { valid: false, isSelfReferral: true }, 'Self-referrals are ignored.'));
    }

    // 4. Duplicate Suppression (1 Hour Window per IP/Session/Product)
    const clientIp = ipAddress || req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const clientSession = sessionId || `${clientIp}_${referralCode}_${product._id}`;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const existingClick = await ReferralClick.findOne({
        influencerId: influencer._id,
        productId: product._id,
        $or: [{ sessionId: clientSession }, { ipAddress: clientIp }],
        clickedAt: { $gte: oneHourAgo },
    });

    let affiliateLink = await AffiliateLink.findOne({ influencerId: influencer._id, productId: product._id });

    // Set 30-Day HTTP Cookie for dual-storage (Cookie + localStorage)
    const cookiePayload = JSON.stringify({
        influencerId: influencer._id,
        affiliateLinkId: affiliateLink?._id,
        referralCode: influencer.referralCode,
        referralClickId: existingClick?._id,
    });
    res.cookie('porutkal_ref', cookiePayload, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
        httpOnly: false,
        sameSite: 'lax',
    });

    if (existingClick) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    valid: true,
                    duplicateSuppressed: true,
                    influencerId: influencer._id,
                    affiliateLinkId: affiliateLink?._id,
                    referralCode: influencer.referralCode,
                    referralClickId: existingClick._id,
                },
                'Referral tracked (duplicate click suppressed).'
            )
        );
    }

    // 5. Create ReferralClick document
    const clickRecord = new ReferralClick({
        influencerId: influencer._id,
        vendorId: product.vendorId,
        productId: product._id,
        affiliateLinkId: affiliateLink?._id,
        referralCode: influencer.referralCode,
        customerId: customerId || req.user?.id || null,
        sessionId: clientSession,
        ipAddress: clientIp,
        userAgent: userAgent || req.headers['user-agent'] || '',
        device: device || 'desktop',
        clickedAt: new Date(),
    });

    await clickRecord.save();

    // 6. Update Clicks Count
    if (affiliateLink) {
        affiliateLink.clicks = (affiliateLink.clicks || 0) + 1;
        await affiliateLink.save();
    }

    influencer.stats.clicks = (influencer.stats.clicks || 0) + 1;
    await influencer.save();

    res.status(200).json(
        new ApiResponse(
            200,
            {
                valid: true,
                duplicateSuppressed: false,
                influencerId: influencer._id,
                affiliateLinkId: affiliateLink?._id,
                referralCode: influencer.referralCode,
                referralClickId: clickRecord._id,
            },
            'Referral click successfully tracked.'
        )
    );
});

// GET /api/referrals/validate/:code
export const validateReferralCode = asyncHandler(async (req, res) => {
    const { code } = req.params;

    const globalSettings = await getGlobalCommissionSettingsData();
    if (!globalSettings.isEnabled) {
        return res.status(200).json(new ApiResponse(200, { valid: false, programDisabled: true }, 'Program disabled.'));
    }

    const influencer = await Influencer.findOne({ referralCode: code, status: 'approved', isActive: true });
    if (!influencer) {
        return res.status(200).json(new ApiResponse(200, { valid: false }, 'Invalid referral code.'));
    }

    res.status(200).json(
        new ApiResponse(
            200,
            {
                valid: true,
                name: influencer.name,
                referralCode: influencer.referralCode,
            },
            'Referral code is valid.'
        )
    );
});
