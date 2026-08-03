import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Influencer from '../../influencer/models/Influencer.model.js';
import { sendEmail } from '../../../services/email.service.js';
import { NotificationService } from '../../influencer/services/NotificationService.js';

// GET /api/admin/influencers
export const getAllInfluencers = asyncHandler(async (req, res) => {
    const { status, search, minFollowers, maxFollowers, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
        filter.status = status;
    }

    if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { mobile: searchRegex },
            { referralCode: searchRegex },
            { slug: searchRegex },
        ];
    }

    if (minFollowers !== undefined || maxFollowers !== undefined) {
        filter.followers = {};
        if (minFollowers !== undefined && minFollowers !== '') {
            filter.followers.$gte = Number(minFollowers);
        }
        if (maxFollowers !== undefined && maxFollowers !== '') {
            filter.followers.$lte = Number(maxFollowers);
        }
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Aggregate KPI Summary
    const [
        influencers,
        total,
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        suspendedCount,
        walletAggregation,
    ] = await Promise.all([
        Influencer.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Influencer.countDocuments(filter),
        Influencer.countDocuments({}),
        Influencer.countDocuments({ status: 'pending' }),
        Influencer.countDocuments({ status: 'approved' }),
        Influencer.countDocuments({ status: 'rejected' }),
        Influencer.countDocuments({ status: 'suspended' }),
        Influencer.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: { $ifNull: ['$stats.orders', 0] } },
                    totalEarned: { $sum: { $ifNull: ['$wallet.totalEarned', 0] } },
                    reserved: { $sum: { $ifNull: ['$wallet.reserved', 0] } },
                    withdrawn: { $sum: { $ifNull: ['$wallet.withdrawn', 0] } },
                    pendingWallet: { $sum: { $ifNull: ['$wallet.pending', 0] } },
                },
            },
        ]),
    ]);

    const walletStats = walletAggregation[0] || {
        totalSales: 0,
        totalEarned: 0,
        reserved: 0,
        withdrawn: 0,
        pendingWallet: 0,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                influencers,
                summary: {
                    totalInfluencers: totalCount,
                    pendingInfluencers: pendingCount,
                    approvedInfluencers: approvedCount,
                    rejectedInfluencers: rejectedCount,
                    suspendedInfluencers: suspendedCount,
                    totalSalesCount: walletStats.totalSales,
                    totalEarned: walletStats.totalEarned,
                    commissionReserved: walletStats.reserved,
                    commissionPaid: walletStats.withdrawn,
                    pendingWithdrawals: walletStats.pendingWallet,
                },
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
            'Influencers list & KPI summary retrieved successfully.'
        )
    );
});

// GET /api/admin/influencers/:id
export const getInfluencerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const influencer = await Influencer.findById(id).select(
        '+bankDetails +panNumber +aadhaarNumber +failedLoginAttempts +lockUntil'
    );

    if (!influencer) {
        throw new ApiError(404, 'Influencer application not found.');
    }

    res.status(200).json(new ApiResponse(200, influencer, 'Influencer details retrieved successfully.'));
});

// PATCH /api/admin/influencers/:id/status
export const updateInfluencerStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
        throw new ApiError(400, 'Invalid status parameter.');
    }

    const influencer = await Influencer.findById(id);
    if (!influencer) {
        throw new ApiError(404, 'Influencer account not found.');
    }

    const previousStatus = influencer.status;
    influencer.status = status;

    if (status === 'rejected') {
        influencer.rejectionReason = rejectionReason || 'Application details did not meet criteria.';
    } else if (status === 'approved') {
        influencer.approvedAt = new Date();
        influencer.approvedBy = req.user.id;
        influencer.rejectionReason = '';
    } else if (status === 'suspended') {
        influencer.suspendedAt = new Date();
        influencer.suspendedBy = req.user.id;
    }

    influencer.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: req.user.id,
        reason: rejectionReason || `Status updated from ${previousStatus} to ${status} by admin`,
    });

    await influencer.save();

    // Async Email Notification
    let emailSubject = `Application Status Update — Porutkal Influencer Program`;
    let emailBody = '';

    if (status === 'approved') {
        emailSubject = `Congratulations! Your Porutkal Influencer Application is Approved 🎉`;
        emailBody = `
            <h2>Welcome to Porutkal Creator Network, ${influencer.name}!</h2>
            <p>Your influencer application has been officially approved by our team.</p>
            <p>Your unique referral code: <strong>${influencer.referralCode}</strong></p>
            <p>Your creator storefront handle: <strong>porutkal.com/@${influencer.slug}</strong></p>
            <br>
            <p>Log in to your portal at <a href="http://localhost:3000/influence">Porutkal Influencer Portal</a> to access your dashboard.</p>
        `;
    } else if (status === 'rejected') {
        emailSubject = `Update on your Porutkal Influencer Application`;
        emailBody = `
            <h2>Hello ${influencer.name},</h2>
            <p>Thank you for your interest in the Porutkal Influencer Program.</p>
            <p>Regrettably, your application was not approved at this time.</p>
            <p>Reason: <strong>${influencer.rejectionReason}</strong></p>
        `;
    }

    if (emailBody) {
        sendEmail({
            to: influencer.email,
            subject: emailSubject,
            html: emailBody,
        }).catch((err) => console.error('Failed to send status update email:', err.message));
    }

    // In-App Notification
    try {
        await NotificationService.createNotification({
            recipientType: 'influencer',
            recipientId: influencer._id,
            title: status === 'approved' ? '🎉 Application Approved!' : status === 'rejected' ? '⚠️ Application Update' : '🔒 Account Suspended',
            message: status === 'approved' 
                ? 'Your influencer application has been approved! You can now generate referral links and earn commissions.'
                : status === 'rejected'
                ? `Your application was not approved. Reason: ${influencer.rejectionReason}`
                : 'Your creator account has been suspended by administration.',
            category: 'account',
            priority: status === 'approved' ? 'high' : 'normal',
        });
    } catch (e) {
        console.error('Failed to create in-app notification:', e.message);
    }

    res.status(200).json(
        new ApiResponse(200, influencer, `Influencer status successfully updated to ${status}.`)
    );
});

// POST /api/admin/influencers/bulk-status
export const bulkUpdateInfluencerStatus = asyncHandler(async (req, res) => {
    const { ids, status, rejectionReason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, 'Please select at least one influencer ID.');
    }

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
        throw new ApiError(400, 'Invalid status parameter.');
    }

    const updateFields = {
        status,
        ...(status === 'approved' ? { approvedAt: new Date(), approvedBy: req.user.id, rejectionReason: '' } : {}),
        ...(status === 'rejected' ? { rejectionReason: rejectionReason || 'Bulk rejected by admin.' } : {}),
        ...(status === 'suspended' ? { suspendedAt: new Date(), suspendedBy: req.user.id } : {}),
    };

    const result = await Influencer.updateMany(
        { _id: { $in: ids } },
        {
            $set: updateFields,
            $push: {
                statusHistory: {
                    status,
                    changedAt: new Date(),
                    changedBy: req.user.id,
                    reason: `Bulk status update to ${status} by admin`,
                },
            },
        }
    );

    res.status(200).json(
        new ApiResponse(200, result, `Successfully updated ${result.modifiedCount} influencers to ${status}.`)
    );
});
