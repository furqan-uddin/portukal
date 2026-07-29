import mongoose from 'mongoose';

const influencerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true,
        },
        name: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        referralCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            index: true,
        },
        mobile: {
            type: String,
            trim: true,
            index: true,
        },
        profileImage: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
            trim: true,
        },
        followers: {
            type: Number,
            default: 0,
            min: 0,
        },
        socialLinks: {
            instagram: { type: String, default: '', trim: true },
            youtube: { type: String, default: '', trim: true },
            facebook: { type: String, default: '', trim: true },
            linkedin: { type: String, default: '', trim: true },
            website: { type: String, default: '', trim: true },
        },
        bankDetails: {
            accountHolderName: { type: String, select: false, trim: true },
            bankName: { type: String, select: false, trim: true },
            accountNumber: { type: String, select: false, trim: true },
            ifscCode: { type: String, select: false, trim: true, uppercase: true },
            upiId: { type: String, select: false, trim: true },
        },
        panNumber: {
            type: String,
            select: false,
            trim: true,
            uppercase: true,
        },
        aadhaarNumber: {
            type: String,
            select: false,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'suspended'],
            default: 'pending',
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        rejectionReason: {
            type: String,
            default: '',
        },
        statusHistory: [
            {
                status: { type: String },
                changedAt: { type: Date, default: Date.now },
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
                reason: { type: String },
            },
        ],
        wallet: {
            pending: { type: Number, default: 0 },
            reserved: { type: Number, default: 0 },
            available: { type: Number, default: 0 },
            withdrawn: { type: Number, default: 0 },
            totalEarned: { type: Number, default: 0 },
        },
        stats: {
            clicks: { type: Number, default: 0 },
            orders: { type: Number, default: 0 },
            conversionRate: { type: Number, default: 0 },
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        approvedAt: { type: Date },
        suspendedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        suspendedAt: { type: Date }
    },
    { timestamps: true }
);

const Influencer = mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);
export { Influencer };
export default Influencer;
