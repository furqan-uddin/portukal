import mongoose from 'mongoose';
import Order from '../../../models/Order.model.js';
import Influencer from '../models/Influencer.model.js';
import ReferralClick from '../models/ReferralClick.model.js';
import CommissionSettlement from '../models/CommissionSettlement.model.js';
import WithdrawalRequest from '../models/WithdrawalRequest.model.js';
import InfluencerWallet from '../models/InfluencerWallet.model.js';
import VendorWallet from '../models/VendorWallet.model.js';
import { roundVal } from './WalletService.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheStore = new Map();

function getCached(key) {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        cacheStore.delete(key);
        return null;
    }
    return item.data;
}

function setCached(key, data) {
    cacheStore.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

export class RevenueAnalyticsService {
    static parseDateRange(range = '30days', customStart = null, customEnd = null) {
        const now = new Date();
        let currentEnd = customEnd ? new Date(customEnd) : new Date(now);
        let currentStart = new Date();

        if (range === 'today') {
            currentStart.setHours(0, 0, 0, 0);
        } else if (range === '7days') {
            currentStart.setDate(now.getDate() - 7);
        } else if (range === '90days') {
            currentStart.setDate(now.getDate() - 90);
        } else if (range === 'custom' && customStart) {
            currentStart = new Date(customStart);
        } else {
            currentStart.setDate(now.getDate() - 30);
        }

        const durationMs = currentEnd.getTime() - currentStart.getTime();
        const previousEnd = new Date(currentStart.getTime() - 1);
        const previousStart = new Date(previousEnd.getTime() - durationMs);

        return { currentStart, currentEnd, previousStart, previousEnd };
    }

    static calcTrend(current, previous) {
        current = Number(current || 0);
        previous = Number(previous || 0);
        const diff = current - previous;
        let percent = 0;
        if (previous > 0) {
            percent = roundVal(((current - previous) / previous) * 100);
        } else if (current > 0) {
            percent = 100;
        }
        return {
            value: roundVal(current),
            previousValue: roundVal(previous),
            diff: roundVal(diff),
            percent,
            trend: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
        };
    }

    static async getInfluencerAnalytics(influencerId, filters = {}) {
        const cacheKey = `INF_REV_${influencerId}_${JSON.stringify(filters)}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const { currentStart, currentEnd, previousStart, previousEnd } = this.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );

        const infId = new mongoose.Types.ObjectId(influencerId);

        const [currClicks, prevClicks] = await Promise.all([
            ReferralClick.countDocuments({ influencerId: infId, createdAt: { $gte: currentStart, $lte: currentEnd } }),
            ReferralClick.countDocuments({ influencerId: infId, createdAt: { $gte: previousStart, $lte: previousEnd } }),
        ]);

        const [currOrderStats, prevOrderStats] = await Promise.all([
            Order.aggregate([
                { $match: { influencerId: infId, createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] } },
                        cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] } },
                        totalRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    },
                },
            ]),
            Order.aggregate([
                { $match: { influencerId: infId, createdAt: { $gte: previousStart, $lte: previousEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        deliveredOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0] } },
                        cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] } },
                        totalRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    },
                },
            ]),
        ]);

        const cOrder = currOrderStats[0] || { totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0, totalRevenue: 0 };
        const pOrder = prevOrderStats[0] || { totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0, totalRevenue: 0 };

        const [currCommStats, prevCommStats] = await Promise.all([
            CommissionSettlement.aggregate([
                { $match: { influencerId: infId, createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: null,
                        totalCommission: { $sum: '$commissionAmount' },
                        reservedComm: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0] } },
                        releasedComm: { $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$commissionAmount', 0] } },
                    },
                },
            ]),
            CommissionSettlement.aggregate([
                { $match: { influencerId: infId, createdAt: { $gte: previousStart, $lte: previousEnd } } },
                {
                    $group: {
                        _id: null,
                        totalCommission: { $sum: '$commissionAmount' },
                    },
                },
            ]),
        ]);

        const cComm = currCommStats[0] || { totalCommission: 0, reservedComm: 0, releasedComm: 0 };
        const pComm = prevCommStats[0] || { totalCommission: 0 };

        const wallet = (await InfluencerWallet.findOne({ influencerId: infId })) || {};

        const currConvRate = currClicks > 0 ? (cOrder.totalOrders / currClicks) * 100 : 0;
        const prevConvRate = prevClicks > 0 ? (pOrder.totalOrders / prevClicks) * 100 : 0;

        const currAOV = cOrder.totalOrders > 0 ? cOrder.totalRevenue / cOrder.totalOrders : 0;
        const prevAOV = pOrder.totalOrders > 0 ? pOrder.totalRevenue / pOrder.totalOrders : 0;

        const kpis = {
            clicks: this.calcTrend(currClicks, prevClicks),
            orders: this.calcTrend(cOrder.totalOrders, pOrder.totalOrders),
            deliveredOrders: this.calcTrend(cOrder.deliveredOrders, pOrder.deliveredOrders),
            cancelledOrders: this.calcTrend(cOrder.cancelledOrders, pOrder.cancelledOrders),
            revenue: this.calcTrend(cOrder.totalRevenue, pOrder.totalRevenue),
            commissionEarned: this.calcTrend(cComm.totalCommission, pComm.totalCommission),
            conversionRate: this.calcTrend(currConvRate, prevConvRate),
            averageOrderValue: this.calcTrend(currAOV, prevAOV),
            reservedCommission: roundVal(cComm.reservedComm),
            availableBalance: roundVal(wallet.availableBalance || 0),
            pendingBalance: roundVal(wallet.pendingBalance || 0),
            withdrawnAmount: roundVal(wallet.withdrawn || 0),
        };

        const dailyTrends = await ReferralClick.aggregate([
            { $match: { influencerId: infId, createdAt: { $gte: currentStart, $lte: currentEnd } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    clicks: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const result = { kpis, dailyTrends };
        setCached(cacheKey, result);
        return result;
    }

    static async getVendorAnalytics(vendorId, filters = {}) {
        const cacheKey = `VEN_REV_${vendorId}_${JSON.stringify(filters)}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const { currentStart, currentEnd, previousStart, previousEnd } = this.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );

        const vId = new mongoose.Types.ObjectId(vendorId);

        const [currStats, prevStats] = await Promise.all([
            CommissionSettlement.aggregate([
                { $match: { vendorId: vId, createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalCommission: { $sum: '$commissionAmount' },
                        reservedComm: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0] } },
                        releasedComm: { $sum: { $cond: [{ $eq: ['$status', 'settled'] }, '$commissionAmount', 0] } },
                    },
                },
            ]),
            CommissionSettlement.aggregate([
                { $match: { vendorId: vId, createdAt: { $gte: previousStart, $lte: previousEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalCommission: { $sum: '$commissionAmount' },
                    },
                },
            ]),
        ]);

        const c = currStats[0] || { totalOrders: 0, totalCommission: 0, reservedComm: 0, releasedComm: 0 };
        const p = prevStats[0] || { totalOrders: 0, totalCommission: 0 };

        const wallet = (await VendorWallet.findOne({ vendorId: vId })) || {};

        const kpis = {
            affiliateOrders: this.calcTrend(c.totalOrders, p.totalOrders),
            totalCommissionPaid: this.calcTrend(c.releasedComm, p.totalCommission),
            reservedCommission: roundVal(c.reservedComm),
            totalVendorBalance: roundVal(wallet.balance || 0),
        };

        const result = { kpis };
        setCached(cacheKey, result);
        return result;
    }

    static async getAdminAnalytics(filters = {}) {
        const cacheKey = `ADM_REV_${JSON.stringify(filters)}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const { currentStart, currentEnd, previousStart, previousEnd } = this.parseDateRange(
            filters.range,
            filters.startDate,
            filters.endDate
        );

        const [influencerCounts, currOrders, prevOrders, currWithdrawals, prevWithdrawals] = await Promise.all([
            Influencer.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            Order.aggregate([
                { $match: { influencerId: { $ne: null }, createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        grossRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    },
                },
            ]),
            Order.aggregate([
                { $match: { influencerId: { $ne: null }, createdAt: { $gte: previousStart, $lte: previousEnd } } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        grossRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
                    },
                },
            ]),
            WithdrawalRequest.aggregate([
                { $match: { createdAt: { $gte: currentStart, $lte: currentEnd } } },
                {
                    $group: {
                        _id: null,
                        pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
                        paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    },
                },
            ]),
            WithdrawalRequest.aggregate([
                { $match: { createdAt: { $gte: previousStart, $lte: previousEnd } } },
                {
                    $group: {
                        _id: null,
                        paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    },
                },
            ]),
        ]);

        const statusMap = { approved: 0, pending: 0, rejected: 0, suspended: 0 };
        influencerCounts.forEach((st) => {
            if (st._id) statusMap[st._id] = st.count;
        });

        const cOrd = currOrders[0] || { totalOrders: 0, grossRevenue: 0 };
        const pOrd = prevOrders[0] || { totalOrders: 0, grossRevenue: 0 };

        const cWth = currWithdrawals[0] || { pendingAmount: 0, paidAmount: 0 };
        const pWth = prevWithdrawals[0] || { paidAmount: 0 };

        const kpis = {
            totalInfluencers: statusMap.approved + statusMap.pending + statusMap.rejected + statusMap.suspended,
            approvedInfluencers: statusMap.approved,
            pendingInfluencers: statusMap.pending,
            rejectedInfluencers: statusMap.rejected,
            affiliateOrders: this.calcTrend(cOrd.totalOrders, pOrd.totalOrders),
            grossAffiliateRevenue: this.calcTrend(cOrd.grossRevenue, pOrd.grossRevenue),
            pendingWithdrawals: roundVal(cWth.pendingAmount),
            paidWithdrawals: this.calcTrend(cWth.paidAmount, pWth.paidAmount),
        };

        const result = { kpis };
        setCached(cacheKey, result);
        return result;
    }
}
