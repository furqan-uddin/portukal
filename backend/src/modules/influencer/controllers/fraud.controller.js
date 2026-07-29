import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import FraudRule from '../models/FraudRule.model.js';
import FraudLog from '../models/FraudLog.model.js';
import { FraudDetectionService } from '../services/FraudDetectionService.js';

// GET /api/admin/influencer/fraud/rules
export const getFraudRulesHandler = asyncHandler(async (req, res) => {
    let rules = await FraudRule.find();

    if (rules.length === 0) {
        rules = await FraudRule.insertMany([
            { name: 'Self Referral Order', code: 'SELF_REFERRAL', threshold: 1, weight: 40, action: 'flag', description: 'Creator placing orders via own affiliate link.' },
            { name: 'High Click Velocity', code: 'CLICK_VELOCITY', threshold: 50, weight: 30, action: 'investigate', description: 'More than 50 referral clicks within 10 minutes.' },
            { name: 'Large Withdrawal Request', code: 'WITHDRAWAL_SPIKE', threshold: 50000, weight: 25, action: 'investigate', description: 'Single withdrawal request exceeding threshold.' },
        ]);
    }

    res.status(200).json(new ApiResponse(200, rules, 'Fraud rules retrieved.'));
});

// PUT /api/admin/influencer/fraud/rules/:id
export const updateFraudRuleHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rule = await FraudRule.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(new ApiResponse(200, rule, 'Fraud rule updated.'));
});

// GET /api/admin/influencer/fraud/cases
export const getFraudLogsHandler = asyncHandler(async (req, res) => {
    const { status, level, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (level) query.fraudLevel = level;

    const skip = (page - 1) * limit;

    const [cases, total] = await Promise.all([
        FraudLog.find(query)
            .populate('influencerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        FraudLog.countDocuments(query),
    ]);

    res.status(200).json(new ApiResponse(200, { cases, total, page: Number(page), limit: Number(limit) }, 'Fraud cases retrieved.'));
});

// PUT /api/admin/influencer/fraud/cases/:id
export const updateFraudCaseHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, actionTaken } = req.body;
    const adminId = req.user.id;

    const updatedCase = await FraudDetectionService.updateCaseStatus(id, status, actionTaken, adminId);
    res.status(200).json(new ApiResponse(200, updatedCase, 'Fraud case updated.'));
});
