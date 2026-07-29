import crypto from 'crypto';
import AuditLog from '../models/AuditLog.model.js';

export class AuditService {
    /**
     * Create Immutable Audit Log Record
     */
    static async logAction({
        correlationId = null,
        actorId = null,
        actorRole = 'system',
        action,
        resource,
        oldValue = null,
        newValue = null,
        req = null,
    }) {
        const corrId = correlationId || `corr_${crypto.randomBytes(8).toString('hex')}`;
        const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';
        const userAgent = req?.headers?.['user-agent'] || '';

        const log = await AuditLog.create({
            correlationId: corrId,
            actorId,
            actorRole,
            action,
            resource,
            oldValue,
            newValue,
            ipAddress,
            userAgent,
        });

        return log;
    }

    /**
     * Query Immutable Audit Logs (Paginated)
     */
    static async queryAuditLogs({ correlationId, actorRole, action, resource, page = 1, limit = 20 }) {
        const query = {};
        if (correlationId) query.correlationId = correlationId;
        if (actorRole) query.actorRole = actorRole;
        if (action) query.action = action;
        if (resource) query.resource = resource;

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            AuditLog.countDocuments(query),
        ]);

        return { logs, total, page: Number(page), limit: Number(limit) };
    }
}
