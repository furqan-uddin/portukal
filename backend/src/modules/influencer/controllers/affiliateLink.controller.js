import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import AffiliateLink from '../models/AffiliateLink.model.js';
import Product from '../../../models/Product.model.js';
import Influencer from '../models/Influencer.model.js';
import { getGlobalCommissionSettingsData } from '../services/commissionHelper.js';

// POST /api/influencer/affiliate-links/generate
export const generateAffiliateLink = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const influencerId = req.user.id;

    if (!productId) {
        throw new ApiError(400, 'Product ID is required.');
    }

    // Check Admin Global Program Switch
    const globalSettings = await getGlobalCommissionSettingsData();
    if (!globalSettings.isEnabled) {
        throw new ApiError(403, 'The Influencer Affiliate Program is currently disabled by Admin.');
    }

    const [influencer, product] = await Promise.all([
        Influencer.findById(influencerId),
        Product.findById(productId).populate('vendorId', 'storeName status influencerProgram'),
    ]);

    if (!influencer || influencer.status !== 'approved' || !influencer.isActive) {
        throw new ApiError(403, 'Only approved and active influencers can generate affiliate links.');
    }

    if (!product || !product.isActive || !product.allowInfluencer) {
        throw new ApiError(400, 'This product is not available for influencer promotion.');
    }

    if (!product.vendorId || product.vendorId.status !== 'approved' || product.vendorId.influencerProgram?.enabled === false) {
        throw new ApiError(400, 'The vendor for this product is not active in the influencer program.');
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const affiliateUrl = `${baseUrl}/product/${product.slug}?ref=${influencer.referralCode}`;

    // Deduplication check: One Influencer + One Product = One Link
    let link = await AffiliateLink.findOne({ influencerId, productId });
    if (!link) {
        link = new AffiliateLink({
            influencerId,
            vendorId: product.vendorId._id,
            productId: product._id,
            referralCode: influencer.referralCode,
            affiliateUrl,
            slug: product.slug,
            status: 'active',
        });
        await link.save();
    } else {
        // If it already exists, return existing link and reactivate if soft-deleted
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
                referralCode: influencer.referralCode,
                productName: product.name,
            },
            'Affiliate link retrieved successfully.'
        )
    );
});

// GET /api/influencer/affiliate-links
export const getMyAffiliateLinks = asyncHandler(async (req, res) => {
    const influencerId = req.user.id;
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
            if (!prod || !prod.isActive || !prod.allowInfluencer || prod.stock === 'out_of_stock') {
                computedStatus = 'inactive';
            } else if (!vendor || vendor.status !== 'approved' || vendor.influencerProgram?.enabled === false) {
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
    const influencerId = req.user.id;

    const link = await AffiliateLink.findOne({ _id: id, influencerId });
    if (!link) {
        throw new ApiError(404, 'Affiliate link not found or unauthorized.');
    }

    link.status = 'deleted';
    await link.save();

    res.status(200).json(new ApiResponse(200, null, 'Affiliate link soft-deleted successfully.'));
});
