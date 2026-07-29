import mongoose from 'mongoose';

const generatedReportSchema = new mongoose.Schema(
    {
        reportName: {
            type: String,
            required: true,
        },
        reportType: {
            type: String,
            enum: [
                'revenue',
                'commission',
                'settlement',
                'withdrawal',
                'wallet',
                'orders',
                'products',
                'categories',
                'influencers',
                'vendors',
                'geography',
                'leaderboards',
                'conversion_funnel',
            ],
            required: true,
            index: true,
        },
        format: {
            type: String,
            enum: ['csv', 'excel', 'pdf'],
            required: true,
        },
        generatedByRole: {
            type: String,
            enum: ['influencer', 'vendor', 'admin'],
            required: true,
            index: true,
        },
        generatedById: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
            default: 'pending',
            index: true,
        },
        progress: {
            type: Number,
            default: 0,
        },
        filters: {
            type: Object,
            default: {},
        },
        fileUrl: {
            type: String,
            default: '',
        },
        fileName: {
            type: String,
            default: '',
        },
        fileSize: {
            type: Number,
            default: 0,
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
        lastDownloadedAt: {
            type: Date,
            default: null,
        },
        errorMessage: {
            type: String,
            default: '',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

generatedReportSchema.index({ generatedByRole: 1, generatedById: 1, createdAt: -1 });

const GeneratedReport = mongoose.models.GeneratedReport || mongoose.model('GeneratedReport', generatedReportSchema);
export default GeneratedReport;
