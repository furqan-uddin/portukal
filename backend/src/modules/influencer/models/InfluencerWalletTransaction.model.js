import mongoose from 'mongoose';

const influencerWalletTransactionSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            index: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            default: null,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
            index: true,
        },
        withdrawalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WithdrawalRequest',
            default: null,
        },
        type: {
            type: String,
            enum: [
                'commission_reserved',
                'commission_released',
                'commission_reversed',
                'withdrawal_request',
                'withdrawal_approved',
                'withdrawal_rejected',
                'withdrawal_paid',
                'admin_credit',
                'admin_debit',
                'adjustment',
                'refund_reversal',
                'manual_settlement',
            ],
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        balanceBefore: {
            type: Number,
            required: true,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'completed',
        },
        reference: {
            type: String,
            trim: true,
            default: '',
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        createdBy: {
            type: String,
            default: 'system',
        },
    },
    { timestamps: true }
);

const InfluencerWalletTransaction = mongoose.model(
    'InfluencerWalletTransaction',
    influencerWalletTransactionSchema
);
export default InfluencerWalletTransaction;
