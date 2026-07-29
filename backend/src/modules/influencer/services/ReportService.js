import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GeneratedReport from '../models/GeneratedReport.model.js';
import CommissionSettlement from '../models/CommissionSettlement.model.js';
import WithdrawalRequest from '../models/WithdrawalRequest.model.js';
import Order from '../../../models/Order.model.js';
import { RevenueAnalyticsService } from './RevenueAnalyticsService.js';
import { ConversionAnalyticsService } from './ConversionAnalyticsService.js';
import { LeaderboardService } from './LeaderboardService.js';
import { GeographyAnalyticsService } from './GeographyAnalyticsService.js';
import { ExportService } from './ExportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.resolve(__dirname, '../../../../uploads/reports');

if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

export class ReportService {
    /**
     * Generate Async Report File
     */
    static async generateReport({ reportType, format = 'csv', role = 'influencer', entityId, filters = {} }) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days Expiry

        const reportRecord = await GeneratedReport.create({
            reportName: `${reportType.toUpperCase()}_Report_${Date.now()}`,
            reportType,
            format,
            generatedByRole: role,
            generatedById: entityId,
            status: 'processing',
            progress: 20,
            filters,
            expiresAt,
        });

        // Async file build execution
        setImmediate(async () => {
            try {
                let dataset = [];

                if (reportType === 'settlement') {
                    const match = {};
                    if (role === 'influencer') match.influencerId = entityId;
                    if (role === 'vendor') match.vendorId = entityId;
                    dataset = await CommissionSettlement.find(match).lean().limit(500);
                } else if (reportType === 'withdrawal') {
                    const match = {};
                    if (role === 'influencer') match.influencerId = entityId;
                    dataset = await WithdrawalRequest.find(match).lean().limit(500);
                } else if (reportType === 'orders') {
                    const match = {};
                    if (role === 'influencer') match.influencerId = entityId;
                    dataset = await Order.find(match).select('orderNumber totalAmount orderStatus paymentStatus createdAt').lean().limit(500);
                } else if (reportType === 'revenue') {
                    const res = role === 'influencer'
                        ? await RevenueAnalyticsService.getInfluencerAnalytics(entityId, filters)
                        : await RevenueAnalyticsService.getAdminAnalytics(filters);
                    dataset = [res.kpis];
                } else if (reportType === 'leaderboards') {
                    const res = await LeaderboardService.getLeaderboards(role, entityId, filters);
                    dataset = res.topInfluencers;
                } else {
                    dataset = [{ reportType, generatedAt: new Date().toISOString(), status: 'Active' }];
                }

                reportRecord.progress = 60;
                await reportRecord.save();

                const ext = format === 'pdf' ? 'html' : format;
                const fileName = `report_${reportRecord._id}.${ext}`;
                const filePath = path.join(reportsDir, fileName);

                let fileContent = '';
                if (format === 'csv') {
                    fileContent = ExportService.convertToCSV(dataset);
                } else {
                    fileContent = ExportService.generateReportHTML(reportRecord.reportName, dataset, filters);
                }

                fs.writeFileSync(filePath, fileContent);
                const stats = fs.statSync(filePath);

                reportRecord.status = 'completed';
                reportRecord.progress = 100;
                reportRecord.fileName = fileName;
                reportRecord.fileUrl = `/uploads/reports/${fileName}`;
                reportRecord.fileSize = stats.size;
                await reportRecord.save();
            } catch (err) {
                reportRecord.status = 'failed';
                reportRecord.errorMessage = err.message || 'Report generation failed.';
                await reportRecord.save();
            }
        });

        return reportRecord;
    }

    /**
     * Get Report History List
     */
    static async getReportHistory({ role, entityId, page = 1, limit = 20 }) {
        const query = { generatedByRole: role, generatedById: entityId };
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            GeneratedReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            GeneratedReport.countDocuments(query),
        ]);

        return { reports, total, page: Number(page), limit: Number(limit) };
    }

    /**
     * Track Download Stats
     */
    static async markReportDownloaded(reportId, role, entityId) {
        const report = await GeneratedReport.findOneAndUpdate(
            { _id: reportId, generatedByRole: role, generatedById: entityId },
            { $inc: { downloadCount: 1 }, $set: { lastDownloadedAt: new Date() } },
            { new: true }
        );
        return report;
    }

    /**
     * Daily Expiry Cleanup Worker
     */
    static async cleanExpiredReportsWorker() {
        const expiredReports = await GeneratedReport.find({
            status: { $ne: 'expired' },
            expiresAt: { $lte: new Date() },
        });

        for (const rep of expiredReports) {
            if (rep.fileName) {
                const filePath = path.join(reportsDir, rep.fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            rep.status = 'expired';
            await rep.save();
        }

        return { cleanedCount: expiredReports.length };
    }
}
