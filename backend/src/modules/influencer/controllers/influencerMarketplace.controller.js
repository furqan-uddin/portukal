import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Product from '../../../models/Product.model.js';
import Vendor from '../../../models/Vendor.model.js';
import Category from '../../../models/Category.model.js';
import Brand from '../../../models/Brand.model.js';
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
        allowInfluencer: true,
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

    // Fetch approved vendors with influencerProgram enabled
    const activeVendors = await Vendor.find({
        status: 'approved',
        'influencerProgram.enabled': { $ne: false },
    }).select('_id storeName storeLogo influencerProgram');

    const activeVendorIds = activeVendors.map((v) => v._id);
    const vendorMap = new Map(activeVendors.map((v) => [v._id.toString(), v]));

    productQuery.vendorId = { $in: activeVendorIds };

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

    // Calculate effective commissions & attach vendor info
    let processedProducts = await Promise.all(
        rawProducts.map(async (product) => {
            const vendor = vendorMap.get(product.vendorId.toString());
            const comm = await calculateEffectiveCommission(product, vendor);

            const mrp = product.originalPrice || product.price;
            const discountPercent = mrp > product.price ? Math.round(((mrp - product.price) / mrp) * 100) : 0;

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
                createdAt: product.createdAt,
            };
        })
    );

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

    const product = await Product.findOne({ slug, isActive: true, allowInfluencer: true })
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name logo')
        .populate('vendorId', 'storeName storeLogo influencerProgram status');

    if (!product) {
        throw new ApiError(404, 'Product not found or not available for promotion.');
    }

    if (!product.vendorId || product.vendorId.status !== 'approved') {
        throw new ApiError(400, 'Product vendor is not active.');
    }

    const comm = await calculateEffectiveCommission(product, product.vendorId);

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
                },
                relatedProducts: related,
            },
            'Product details retrieved successfully.'
        )
    );
});
