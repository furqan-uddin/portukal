import mongoose from 'mongoose';

const settlementItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
        },
        originalQuantity: {
            type: Number,
            required: true,
            default: 1,
        },
        returnedQuantity: {
            type: Number,
            default: 0,
        },
        remainingQuantity: {
            type: Number,
            required: true,
            default: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
        },
        commissionPercent: {
            type: Number,
            required: true,
        },
        commissionAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reserved', 'released', 'reversed', 'partially_reversed'],
            default: 'pending',
        },
    },
    { _id: true }
);

const commissionSettlementSchema = new mongoose.Schema(
    {
        batchId: {
            type: String,
            default: null,
            index: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            index: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        items: [settlementItemSchema],
        commissionAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'settled', 'reversed', 'partially_reversed', 'failed'],
            default: 'pending',
            index: true,
        },
        eligibleSettlementDate: {
            type: Date,
            required: true,
            index: true,
        },
        settledAt: {
            type: Date,
            default: null,
        },
        reversedAt: {
            type: Date,
            default: null,
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        lastRetryAt: {
            type: Date,
            default: null,
        },
        lastError: {
            type: String,
            default: '',
        },
        nextRetryAt: {
            type: Date,
            default: null,
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

const CommissionSettlement = mongoose.model('CommissionSettlement', commissionSettlementSchema);
export default CommissionSettlement;
