import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import { ReportService } from '../services/ReportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.resolve(__dirname, '../../../../uploads/reports');

// POST /api/reports/generate
export const generateReportHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;
    const { reportType, format = 'csv', filters = {} } = req.body;

    const report = await ReportService.generateReport({
        reportType,
        format,
        role,
        entityId,
        filters,
    });

    res.status(202).json(new ApiResponse(202, report, 'Report generation queued successfully.'));
});

// GET /api/reports/history
export const getReportHistoryHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const data = await ReportService.getReportHistory({ role, entityId, page, limit });
    res.status(200).json(new ApiResponse(200, data, 'Report history retrieved.'));
});

// GET /api/reports/download/:id
export const downloadReportHandler = asyncHandler(async (req, res) => {
    const role = req.influencer ? 'influencer' : req.user?.role || 'influencer';
    const entityId = req.influencer?._id || req.user?.id;
    const { id } = req.params;

    const report = await ReportService.markReportDownloaded(id, role, entityId);
    if (!report || !report.fileName) {
        return res.status(404).json(new ApiResponse(404, null, 'Report file not found.'));
    }

    const filePath = path.join(reportsDir, report.fileName);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json(new ApiResponse(404, null, 'Report file has expired or was removed.'));
    }

    res.download(filePath, report.fileName);
});
