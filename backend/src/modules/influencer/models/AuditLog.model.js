import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        correlationId: {
            type: String,
            required: true,
            index: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        actorRole: {
            type: String,
            enum: ['influencer', 'vendor', 'admin', 'system'],
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        resource: {
            type: String,
            required: true,
            index: true,
        },
        oldValue: {
            type: Object,
            default: null,
        },
        newValue: {
            type: Object,
            default: null,
        },
        ipAddress: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ correlationId: 1, action: 1, createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
