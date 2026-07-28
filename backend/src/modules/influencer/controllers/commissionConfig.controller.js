import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import InfluencerCommissionSettings from '../models/InfluencerCommissionSettings.model.js';
import Vendor from '../../../models/Vendor.model.js';

// GET /api/influencer/commission-settings/global (Admin & Public)
export const getGlobalCommissionSettings = asyncHandler(async (req, res) => {
    let settings = await InfluencerCommissionSettings.findOne({ key: 'global_commission_settings' });
    if (!settings) {
        settings = await InfluencerCommissionSettings.create({
            key: 'global_commission_settings',
            minCommissionPercent: 2,
            maxCommissionPercent: 20,
            defaultCommissionPercent: 5,
            isEnabled: true,
        });
    }

    res.status(200).json(new ApiResponse(200, settings, 'Global commission settings retrieved.'));
});

// PUT /api/influencer/commission-settings/global (Admin Only)
export const updateGlobalCommissionSettings = asyncHandler(async (req, res) => {
    const { minCommissionPercent, maxCommissionPercent, defaultCommissionPercent, isEnabled } = req.body;

    if (minCommissionPercent < 0 || maxCommissionPercent > 100 || minCommissionPercent > maxCommissionPercent) {
        throw new ApiError(400, 'Invalid minimum or maximum commission percentage range.');
    }

    if (
        defaultCommissionPercent !== undefined &&
        (defaultCommissionPercent < minCommissionPercent || defaultCommissionPercent > maxCommissionPercent)
    ) {
        throw new ApiError(
            400,
            `Default commission percentage must be between ${minCommissionPercent}% and ${maxCommissionPercent}%.`
        );
    }

    const settings = await InfluencerCommissionSettings.findOneAndUpdate(
        { key: 'global_commission_settings' },
        {
            $set: {
                minCommissionPercent: Number(minCommissionPercent),
                maxCommissionPercent: Number(maxCommissionPercent),
                defaultCommissionPercent: Number(defaultCommissionPercent),
                isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
                updatedBy: req.user.id,
            },
        },
        { new: true, upsert: true }
    );

    res.status(200).json(new ApiResponse(200, settings, 'Global commission settings updated successfully.'));
});

// GET /api/vendor/influencer-settings (Vendor Only)
export const getVendorInfluencerSettings = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;

    const [vendor, globalSettings] = await Promise.all([
        Vendor.findById(vendorId).select('storeName influencerProgram'),
        InfluencerCommissionSettings.findOne({ key: 'global_commission_settings' }),
    ]);

    if (!vendor) {
        throw new ApiError(404, 'Vendor not found.');
    }

    const min = globalSettings ? globalSettings.minCommissionPercent : 2;
    const max = globalSettings ? globalSettings.maxCommissionPercent : 20;

    res.status(200).json(
        new ApiResponse(
            200,
            {
                influencerProgram: vendor.influencerProgram || {
                    enabled: true,
                    defaultCommissionPercent: 5,
                    allowProductOverride: true,
                },
                adminLimits: {
                    minCommissionPercent: min,
                    maxCommissionPercent: max,
                    globalDefaultPercent: globalSettings ? globalSettings.defaultCommissionPercent : 5,
                    isEnabled: globalSettings ? globalSettings.isEnabled : true,
                },
            },
            'Vendor influencer settings retrieved successfully.'
        )
    );
});

// PUT /api/vendor/influencer-settings (Vendor Only)
export const updateVendorInfluencerSettings = asyncHandler(async (req, res) => {
    const vendorId = req.user.id;
    const { enabled, defaultCommissionPercent, allowProductOverride } = req.body;

    let globalSettings = await InfluencerCommissionSettings.findOne({ key: 'global_commission_settings' });
    const min = globalSettings ? globalSettings.minCommissionPercent : 2;
    const max = globalSettings ? globalSettings.maxCommissionPercent : 20;

    if (
        defaultCommissionPercent !== undefined &&
        (Number(defaultCommissionPercent) < min || Number(defaultCommissionPercent) > max)
    ) {
        throw new ApiError(
            400,
            `Commission rate must be within Admin limits (${min}% to ${max}%).`
        );
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
        throw new ApiError(404, 'Vendor not found.');
    }

    vendor.influencerProgram = {
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        defaultCommissionPercent:
            defaultCommissionPercent !== undefined
                ? Number(defaultCommissionPercent)
                : vendor.influencerProgram?.defaultCommissionPercent || 5,
        allowProductOverride:
            allowProductOverride !== undefined ? Boolean(allowProductOverride) : true,
    };

    await vendor.save();

    res.status(200).json(
        new ApiResponse(200, vendor.influencerProgram, 'Vendor influencer settings updated successfully.')
    );
});
