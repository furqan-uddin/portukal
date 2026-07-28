import mongoose from 'mongoose';

const influencerCommissionSettingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: 'global_commission_settings',
            unique: true,
        },
        minCommissionPercent: {
            type: Number,
            required: true,
            default: 2,
            min: 0,
            max: 100,
        },
        maxCommissionPercent: {
            type: Number,
            required: true,
            default: 20,
            min: 0,
            max: 100,
        },
        defaultCommissionPercent: {
            type: Number,
            required: true,
            default: 5,
            min: 0,
            max: 100,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
    },
    { timestamps: true }
);

const InfluencerCommissionSettings = mongoose.model(
    'InfluencerCommissionSettings',
    influencerCommissionSettingsSchema
);
export default InfluencerCommissionSettings;
