import mongoose from 'mongoose';

const influencerWalletSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            unique: true,
            index: true,
        },
        pendingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        reservedBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        availableBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        withdrawn: {
            type: Number,
            default: 0,
            min: 0,
        },
        lifetimeEarnings: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalOrders: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalClicks: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalCommission: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalWithdrawals: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastSettlementDate: {
            type: Date,
            default: null,
        },
        walletLocked: {
            type: Boolean,
            default: false,
        },
        processingWithdrawal: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const InfluencerWallet = mongoose.model('InfluencerWallet', influencerWalletSchema);
export default InfluencerWallet;
