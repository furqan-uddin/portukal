import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const influencerSchema = new mongoose.Schema(
    {
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
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailOtp: { type: String, select: false },
        emailOtpExpiry: { type: Date, select: false },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
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
        suspendedAt: { type: Date },
        lastLogin: { type: Date },
        failedLoginAttempts: { type: Number, default: 0, select: false },
        lockUntil: { type: Date, select: false },
        otp: { type: String, select: false },
        otpExpiry: { type: Date, select: false },
        resetOtp: { type: String, select: false },
        resetOtpExpiry: { type: Date, select: false },
        resetOtpVerified: { type: Boolean, default: false, select: false },
        refreshTokenHash: { type: String, select: false },
        refreshTokenExpiresAt: { type: Date, select: false },
    },
    { timestamps: true }
);

// Hash password before saving
influencerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
influencerSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const Influencer = mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);
export { Influencer };
export default Influencer;
