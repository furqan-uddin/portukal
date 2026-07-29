import mongoose from 'mongoose';

const workerHeartbeatSchema = new mongoose.Schema(
    {
        workerName: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        lastHeartbeat: {
            type: Date,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'stale', 'paused', 'failed'],
            default: 'active',
            index: true,
        },
        lastRun: {
            type: Date,
            default: null,
        },
        nextRun: {
            type: Date,
            default: null,
        },
        failuresCount: {
            type: Number,
            default: 0,
        },
        retryCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const WorkerHeartbeat = mongoose.models.WorkerHeartbeat || mongoose.model('WorkerHeartbeat', workerHeartbeatSchema);
export default WorkerHeartbeat;
