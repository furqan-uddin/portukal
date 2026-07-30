import asyncHandler from '../../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Product from '../../../models/Product.model.js';
import Vendor from '../../../models/Vendor.model.js';
import Category from '../../../models/Category.model.js';
import Brand from '../../../models/Brand.model.js';
import CollaborationRequest from '../models/CollaborationRequest.model.js';
import InfluencerCollaboration from '../models/InfluencerCollaboration.model.js';
import { calculateEffectiveCommission, getGlobalCommissionSettingsData } from '../services/commissionHelper.js';

// GET /api/influencer/marketplace
export const getMarketplaceProducts = asyncHandler(async (req, res) => {
    const globalSettings = await getGlobalCommissionSettingsData();
    if (!globalSettings.isEnabled) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    products: [],
                    isProgramEnabled: false,
                    pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
                },
                'The Influencer Program is currently disabled by Admin.'
            )
        );
    }

    const {
        search,
        categoryId,
        brandId,
        vendorId,
        minPrice,
        maxPrice,
        minCommission,
        minRating,
        minDiscount,
        sort = 'newest',
        page = 1,
        limit = 20,
    } = req.query;

    // Build product criteria
    const productQuery = {
        isActive: true,
        allowInfluencer: { $ne: false },
        stock: { $ne: 'out_of_stock' },
    };

    if (categoryId) productQuery.categoryId = categoryId;
    if (brandId) productQuery.brandId = brandId;
    if (vendorId) productQuery.vendorId = vendorId;

    if (minPrice !== undefined || maxPrice !== undefined) {
        productQuery.price = {};
        if (minPrice) productQuery.price.$gte = Number(minPrice);
        if (maxPrice) productQuery.price.$lte = Number(maxPrice);
    }

    if (minRating) {
        productQuery.rating = { $gte: Number(minRating) };
    }

    if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        productQuery.$or = [
            { name: searchRegex },
            { description: searchRegex },
            { hsnCode: searchRegex },
            { tags: searchRegex },
        ];
    }

    // Fetch approved/active vendors
    const activeVendors = await Vendor.find({
        status: { $nin: ['suspended', 'rejected'] }
    }).select('_id storeName storeLogo influencerProgram');

    const vendorMap = new Map(activeVendors.map((v) => [v._id.toString(), v]));

    // Fetch products
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating_desc') sortOption = { rating: -1 };
    if (sort === 'best_selling') sortOption = { reviewCount: -1 };

    const rawProducts = await Product.find(productQuery)
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name logo')
        .sort(sortOption);

    // Map influencer's existing collaboration request statuses for products
    const userCollabs = req.influencer
        ? await CollaborationRequest.find({ influencerId: req.influencer._id }).select('productId status').lean()
        : [];
    const collabMap = new Map(userCollabs.map(c => [String(c.productId), c.status]));

    // Calculate effective commissions & attach vendor info
    let processedProducts = await Promise.all(
        rawProducts.map(async (product) => {
            const vendor = vendorMap.get(product.vendorId.toString());
            const comm = await calculateEffectiveCommission(product, vendor);

            const mrp = product.originalPrice || product.price;
            const discountPercent = mrp > product.price ? Math.round(((mrp - product.price) / mrp) * 100) : 0;
            const collabStatus = collabMap.get(String(product._id)) || null;

            return {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                image: product.image || (product.images && product.images[0]) || '',
                images: product.images || [],
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                discountPercent,
                rating: product.rating || 0,
                reviewCount: product.reviewCount || 0,
                stock: product.stock,
                stockQuantity: product.stockQuantity,
                category: product.categoryId,
                brand: product.brandId,
                vendor: {
                    _id: vendor?._id,
                    storeName: vendor?.storeName || 'Porutkal Seller',
                    storeLogo: vendor?.storeLogo || '',
                },
                commissionPercent: comm.commissionPercent,
                estimatedEarnings: comm.estimatedEarnings,
                collabStatus,
                createdAt: product.createdAt,
            };
        })
    );

    // Prioritize products with real uploaded Cloudinary images first
    processedProducts.sort((a, b) => {
        const aHasImage = a.image && typeof a.image === 'string' && a.image.startsWith('http') && !a.image.includes('80x80');
        const bHasImage = b.image && typeof b.image === 'string' && b.image.startsWith('http') && !b.image.includes('80x80');
        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0;
    });

    if (minCommission) {
        processedProducts = processedProducts.filter(
            (p) => p.commissionPercent >= Number(minCommission)
        );
    }

    if (minDiscount) {
        processedProducts = processedProducts.filter(
            (p) => p.discountPercent >= Number(minDiscount)
        );
    }

    if (sort === 'commission_desc') {
        processedProducts.sort((a, b) => b.commissionPercent - a.commissionPercent);
    }

    const total = processedProducts.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = processedProducts.slice(startIndex, startIndex + limitNum);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                products: paginatedProducts,
                isProgramEnabled: true,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            'Marketplace products retrieved successfully.'
        )
    );
});

// GET /api/influencer/marketplace/product/:slug
export const getMarketplaceProductBySlug = asyncHandler(async (req, res) => {
    const globalSettings = await getGlobalCommissionSettingsData();
    if (!globalSettings.isEnabled) {
        throw new ApiError(403, 'The Influencer Program is currently disabled by Admin.');
    }

    const { slug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug) && /^[a-fA-F0-9]{24}$/.test(slug);
    const filter = isObjectId ? { $or: [{ _id: slug }, { slug }], isActive: true } : { slug, isActive: true };

    const product = await Product.findOne(filter)
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name logo')
        .populate('vendorId', 'storeName storeLogo storefrontId rating isVerified influencerProgram status');

    if (!product) {
        throw new ApiError(404, 'Product not found or not available for promotion.');
    }

    const comm = await calculateEffectiveCommission(product, product.vendorId || {});

    let collabDoc = null;
    if (req.influencer) {
        collabDoc = await InfluencerCollaboration.findOne({ influencerId: req.influencer._id, productId: product._id }).sort({ updatedAt: -1 }).lean();
        if (!collabDoc) {
            collabDoc = await CollaborationRequest.findOne({ influencerId: req.influencer._id, productId: product._id }).sort({ createdAt: -1 }).lean();
        }
    }

    const related = await Product.find({
        categoryId: product.categoryId?._id,
        _id: { $ne: product._id },
        isActive: true,
        allowInfluencer: true,
    })
        .limit(4)
        .select('name slug image price originalPrice rating reviewCount');

    res.status(200).json(
        new ApiResponse(
            200,
            {
                product: {
                    ...product.toObject(),
                    commissionPercent: comm.commissionPercent,
                    estimatedEarnings: comm.estimatedEarnings,
                    collabStatus: collabDoc ? collabDoc.status : null,
                },
                relatedProducts: related,
            },
            'Product details retrieved successfully.'
        )
    );
});

/**
 * GET /api/influencer/deal-requests
 * Get all product deal/collaboration requests submitted by the logged-in influencer.
 */
export const getMyDealRequests = asyncHandler(async (req, res) => {
    const influencerId = req.influencer._id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { influencerId };
    if (status && status !== 'all') {
        filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [threads, requests] = await Promise.all([
        InfluencerCollaboration.find(filter)
            .populate('productId', 'name slug price originalPrice image images categoryId brandId')
            .populate('vendorId', 'storeName storeLogo rating isVerified')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        CollaborationRequest.find(filter)
            .populate('productId', 'name slug price originalPrice image images categoryId brandId')
            .populate('vendorId', 'storeName storeLogo rating isVerified')
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const threadProductIds = new Set(threads.map(t => String(t.productId?._id || t.productId)));
    const merged = [...threads];

    requests.forEach(r => {
        const pId = String(r.productId?._id || r.productId);
        if (!threadProductIds.has(pId)) {
            merged.push({
                _id: r._id,
                influencerId: r.influencerId,
                vendorId: r.vendorId,
                productId: r.productId,
                status: r.status === 'pending' ? 'requested' : r.status,
                offeredCommissionPercent: r.offeredCommissionPercent,
                message: r.message,
                createdAt: r.createdAt,
            });
        }
    });

    res.status(200).json(
        new ApiResponse(
            200,
            { dealRequests: merged, total: merged.length },
            'Deal requests retrieved successfully.'
        )
    );
});

