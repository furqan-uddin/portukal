import InfluencerCommissionSettings from '../models/InfluencerCommissionSettings.model.js';
import Vendor from '../../../models/Vendor.model.js';

export const getGlobalCommissionSettingsData = async () => {
    let settings = await InfluencerCommissionSettings.findOne({ key: 'global_commission_settings' });
    if (!settings) {
        settings = {
            minCommissionPercent: 2,
            maxCommissionPercent: 20,
            defaultCommissionPercent: 5,
            isEnabled: true,
        };
    }
    return settings;
};

/**
 * Reusable Helper to calculate effective commission % and estimated earnings in INR
 * Enforces dynamic Admin bounds clamping at runtime.
 */
export const calculateEffectiveCommission = async (product, vendor = null) => {
    const settings = await getGlobalCommissionSettingsData();

    const min = settings.minCommissionPercent;
    const max = settings.maxCommissionPercent;

    if (!vendor && product.vendorId) {
        if (typeof product.vendorId === 'object' && product.vendorId._id) {
            vendor = product.vendorId;
        } else {
            vendor = await Vendor.findById(product.vendorId);
        }
    }

    let commissionPercent = settings.defaultCommissionPercent;

    if (vendor && vendor.influencerProgram) {
        if (vendor.influencerProgram.defaultCommissionPercent !== undefined) {
            commissionPercent = vendor.influencerProgram.defaultCommissionPercent;
        }

        if (
            vendor.influencerProgram.allowProductOverride &&
            product.influencerCommission !== undefined &&
            product.influencerCommission !== null
        ) {
            commissionPercent = product.influencerCommission;
        }
    } else if (product.influencerCommission !== undefined && product.influencerCommission !== null) {
        commissionPercent = product.influencerCommission;
    }

    // Dynamic clamping inside Admin bounds (handles Admin lowering max limit)
    commissionPercent = Math.max(min, Math.min(max, commissionPercent));

    const price = product.price || 0;
    const estimatedEarnings = Math.round(((price * commissionPercent) / 100) * 100) / 100;

    return {
        commissionPercent,
        estimatedEarnings,
        minAllowed: min,
        maxAllowed: max,
        isProgramEnabled: settings.isEnabled && (vendor ? vendor.influencerProgram?.enabled !== false : true),
    };
};
