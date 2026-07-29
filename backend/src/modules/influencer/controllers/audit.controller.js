import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import { AuditService } from '../services/AuditService.js';

// GET /api/admin/audit
export const getAuditLogsHandler = asyncHandler(async (req, res) => {
    const { correlationId, actorRole, action, resource, page = 1, limit = 20 } = req.query;
    const data = await AuditService.queryAuditLogs({ correlationId, actorRole, action, resource, page, limit });
    res.status(200).json(new ApiResponse(200, data, 'Immutable audit logs retrieved.'));
});
