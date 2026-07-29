import mongoose from 'mongoose';

const systemHealthSnapshotSchema = new mongoose.Schema(
    {
        timestamp: {
            type: Date,
            required: true,
            index: true,
        },
        cpuUsagePercent: {
            type: Number,
            default: 0,
        },
        ramUsageMB: {
            type: Number,
            default: 0,
        },
        dbConnections: {
            type: Number,
            default: 0,
        },
        queuePendingCount: {
            type: Number,
            default: 0,
        },
        cacheHitRatio: {
            type: Number,
            default: 100,
        },
        apiResponseTimeMs: {
            type: Number,
            default: 12,
        },
    },
    { timestamps: true }
);

const SystemHealthSnapshot = mongoose.models.SystemHealthSnapshot || mongoose.model('SystemHealthSnapshot', systemHealthSnapshotSchema);
export default SystemHealthSnapshot;
