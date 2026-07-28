import mongoose from 'mongoose';

const affiliateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: { type: String, required: true, unique: true },
    commissionRate: { type: Number, default: 5 }, // percentage
    totalEarnings: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    payoutHistory: [{
        amount: Number,
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        transactionId: String,
        createdAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Affiliate = mongoose.model('Affiliate', affiliateSchema);
export default Affiliate;
