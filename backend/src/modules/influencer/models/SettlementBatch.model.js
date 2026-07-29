import mongoose from 'mongoose';

const settlementBatchSchema = new mongoose.Schema(
    {
        batchId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        processedOrders: {
            type: Number,
            default: 0,
        },
        successful: {
            type: Number,
            default: 0,
        },
        failed: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['running', 'completed', 'failed'],
            default: 'running',
        },
        logs: [
            {
                orderId: String,
                status: String,
                message: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

const SettlementBatch = mongoose.model('SettlementBatch', settlementBatchSchema);
export default SettlementBatch;
