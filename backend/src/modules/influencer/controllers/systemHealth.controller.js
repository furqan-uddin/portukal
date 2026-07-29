import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import { SystemHealthService } from '../services/SystemHealthService.js';

// GET /api/admin/system/operations
export const getSystemOperationsHandler = asyncHandler(async (req, res) => {
    const data = await SystemHealthService.getSystemOperationsMetrics();
    res.status(200).json(new ApiResponse(200, data, 'System operations metrics retrieved.'));
});
