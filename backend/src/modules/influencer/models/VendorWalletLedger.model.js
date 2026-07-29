import mongoose from 'mongoose';

const vendorWalletLedgerSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
            index: true,
        },
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            default: null,
            index: true,
        },
        type: {
            type: String,
            enum: ['reserve', 'release', 'withdrawal', 'adjustment', 'refund_reversal', 'settlement'],
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
        reference: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            default: 'completed',
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
    },
    { timestamps: true }
);

const VendorWalletLedger = mongoose.model('VendorWalletLedger', vendorWalletLedgerSchema);
export default VendorWalletLedger;
