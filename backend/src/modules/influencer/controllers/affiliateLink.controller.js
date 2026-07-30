import asyncHandler from '../../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import AffiliateLink from '../models/AffiliateLink.model.js';
import Product from '../../../models/Product.model.js';
import Influencer from '../models/Influencer.model.js';
import { getGlobalCommissionSettingsData } from '../services/commissionHelper.js';

// POST /api/influencer/affiliate-links/generate
export const generateAffiliateLink = asyncHandler(async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        throw new ApiError(400, 'Product ID is required.');
    }

    // Check Admin Global Program Switch
    const globalSettings = await getGlobalCommissionSettingsData();
    if (!globalSettings.isEnabled) {
        throw new ApiError(403, 'The Influencer Affiliate Program is currently disabled by Admin.');
    }

    // Resolve Influencer Profile
    let influencer = req.influencer;
    if (!influencer) {
        const infId = req.user?.id || req.influencer?._id;
        influencer = await Influencer.findOne({
            $or: [
                { _id: infId },
                { user: infId },
                { email: req.user?.email }
            ]
        });
    }

    if (!influencer) {
        throw new ApiError(403, 'Only registered influencers can generate affiliate links.');
    }

    if (influencer.status === 'suspended' || influencer.isActive === false) {
        throw new ApiError(403, 'Your influencer account is suspended or inactive.');
    }

    // Resolve Product by ObjectId or Slug
    const isObjectId = mongoose.Types.ObjectId.isValid(productId) && /^[a-fA-F0-9]{24}$/.test(productId);
    const productFilter = isObjectId ? { $or: [{ _id: productId }, { slug: productId }], isActive: true } : { slug: productId, isActive: true };

    const product = await Product.findOne(productFilter).populate('vendorId', 'storeName status influencerProgram');

    if (!product) {
        throw new ApiError(404, 'Product not found or not active.');
    }

    const referralCode = influencer.referralCode || `INF-${influencer._id.toString().slice(-6).toUpperCase()}`;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const affiliateUrl = `${baseUrl}/product/${product.slug || product._id}?ref=${referralCode}`;

    // Deduplication check: One Influencer + One Product = One Link
    let link = await AffiliateLink.findOne({ influencerId: influencer._id, productId: product._id });
    if (!link) {
        link = new AffiliateLink({
            influencerId: influencer._id,
            vendorId: product.vendorId?._id || product.vendorId,
            productId: product._id,
            referralCode,
            affiliateUrl,
            slug: product.slug || product._id,
            status: 'active',
        });
        await link.save();
    } else {
        link.affiliateUrl = affiliateUrl;
        link.status = 'active';
        await link.save();
    }

    res.status(200).json(
        new ApiResponse(
            200,
            {
                link,
                affiliateUrl,
                referralCode,
                productName: product.name,
            },
            'Affiliate link generated successfully.'
        )
    );
});

// GET /api/influencer/affiliate-links
export const getMyAffiliateLinks = asyncHandler(async (req, res) => {
    const influencerId = req.influencer?._id || req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [links, total] = await Promise.all([
        AffiliateLink.find({ influencerId })
            .populate('productId', 'name slug image price originalPrice stock allowInfluencer isActive')
            .populate('vendorId', 'storeName storeLogo status influencerProgram')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        AffiliateLink.countDocuments({ influencerId }),
    ]);

    // Live status evaluation
    const processedLinks = links.map((link) => {
        const prod = link.productId;
        const vendor = link.vendorId;

        let computedStatus = link.status;
        if (link.status !== 'deleted') {
            if (!prod || !prod.isActive || prod.stock === 'out_of_stock') {
                computedStatus = 'inactive';
            }
        }

        return {
            ...link.toObject(),
            computedStatus,
        };
    });

    res.status(200).json(
        new ApiResponse(
            200,
            {
                links: processedLinks,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Affiliate links fetched successfully.'
        )
    );
});

// DELETE /api/influencer/affiliate-links/:id (Soft Delete)
export const deleteAffiliateLink = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const influencerId = req.influencer?._id || req.user?.id;

    const link = await AffiliateLink.findOne({ _id: id, influencerId });
    if (!link) {
        throw new ApiError(404, 'Affiliate link not found or unauthorized.');
    }

    link.status = 'deleted';
    await link.save();

    res.status(200).json(new ApiResponse(200, null, 'Affiliate link soft-deleted successfully.'));
});
