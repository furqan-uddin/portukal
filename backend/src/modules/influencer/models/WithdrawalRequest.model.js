import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Influencer',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, 'Amount must be at least ₹1'],
        },
        bankDetails: {
            accountHolder: { type: String, trim: true, default: '' },
            accountNumber: { type: String, trim: true, default: '' },
            ifsc: { type: String, trim: true, default: '' },
            bankName: { type: String, trim: true, default: '' },
        },
        upiId: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
            default: 'pending',
            index: true,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        approvedIp: {
            type: String,
            default: '',
        },
        approvedDevice: {
            type: String,
            default: '',
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        paidAt: {
            type: Date,
            default: null,
        },
        bankTransactionId: {
            type: String,
            trim: true,
            default: '',
        },
        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        remarks: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
);

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
export default WithdrawalRequest;
