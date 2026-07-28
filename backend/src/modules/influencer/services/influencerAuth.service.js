import Influencer from '../models/Influencer.model.js';
import { signAccessToken, signRefreshToken } from '../../../config/jwt.js';
import ApiError from '../../../utils/ApiError.js';
import { sendEmail } from '../../../services/email.service.js';

const generateUniqueSlug = async (name) => {
    let baseSlug = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (!baseSlug) baseSlug = 'creator';

    let slug = baseSlug;
    let count = 1;
    while (await Influencer.findOne({ slug })) {
        slug = `${baseSlug}-${count++}`;
    }
    return slug;
};

const generateUniqueReferralCode = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'INF';
    while (true) {
        code = 'INF';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existing = await Influencer.findOne({ referralCode: code });
        if (!existing) break;
    }
    return code;
};

export const registerInfluencerService = async (data) => {
    const {
        name,
        email,
        mobile,
        password,
        profileImage,
        bio,
        followers,
        socialLinks,
        bankDetails,
        panNumber,
        aadhaarNumber,
    } = data;

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedMobile = String(mobile).trim();

    const existingEmail = await Influencer.findOne({ email: normalizedEmail });
    if (existingEmail) {
        throw new ApiError(400, 'An influencer account with this email address already exists.');
    }

    const existingMobile = await Influencer.findOne({ mobile: normalizedMobile });
    if (existingMobile) {
        throw new ApiError(400, 'An influencer account with this mobile number already exists.');
    }

    const slug = await generateUniqueSlug(name);
    const referralCode = await generateUniqueReferralCode();

    // Mask Aadhaar Number if provided
    let maskedAadhaar = '';
    if (aadhaarNumber && aadhaarNumber.trim().length >= 4) {
        const cleanAadhaar = aadhaarNumber.trim();
        maskedAadhaar = `XXXX XXXX ${cleanAadhaar.slice(-4)}`;
    }

    // Generate 6-digit email OTP
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const influencer = new Influencer({
        name,
        slug,
        referralCode,
        email: normalizedEmail,
        isEmailVerified: false,
        emailOtp,
        emailOtpExpiry,
        mobile: normalizedMobile,
        password,
        profileImage: profileImage || '',
        bio: bio || '',
        followers: Number(followers) || 0,
        socialLinks: socialLinks || {},
        bankDetails: bankDetails || {},
        panNumber: panNumber || '',
        aadhaarNumber: maskedAadhaar,
        status: 'pending',
        statusHistory: [
            {
                status: 'pending',
                changedAt: new Date(),
                reason: 'Application submitted by influencer',
            },
        ],
    });

    await influencer.save();

    // Async Email Verification OTP email
    sendEmail({
        to: influencer.email,
        subject: 'Verify Your Email — Porutkal Influencer Program',
        html: `
            <h2>Welcome to Porutkal Marketplace, ${influencer.name}!</h2>
            <p>Your 6-digit Email Verification OTP code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #7C3AED;">${emailOtp}</h1>
            <p>Your unique referral code is: <strong>${referralCode}</strong></p>
            <p>Your creator storefront handle: <strong>porutkal.com/@${slug}</strong></p>
            <br>
            <p>Best regards,<br>The Porutkal Marketplace Team</p>
        `,
    }).catch((err) => console.error('Failed to send email OTP:', err.message));

    return {
        success: true,
        message: 'Registration submitted! Please verify your email with the 6-digit OTP sent to your inbox.',
        email: influencer.email,
        slug: influencer.slug,
        referralCode: influencer.referralCode,
        requiresEmailVerification: true,
    };
};

export const verifyEmailOtpService = async (email, otp) => {
    const normalizedEmail = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalizedEmail }).select(
        '+emailOtp +emailOtpExpiry'
    );

    if (!influencer) {
        throw new ApiError(404, 'Influencer account not found.');
    }

    if (influencer.isEmailVerified) {
        return { success: true, message: 'Email address is already verified.' };
    }

    if (!influencer.emailOtp || influencer.emailOtp !== String(otp).trim()) {
        throw new ApiError(400, 'Invalid email verification OTP code.');
    }

    if (Date.now() > new Date(influencer.emailOtpExpiry).getTime()) {
        throw new ApiError(400, 'Email verification OTP has expired. Please request a new one.');
    }

    influencer.isEmailVerified = true;
    influencer.emailOtp = undefined;
    influencer.emailOtpExpiry = undefined;
    await influencer.save();

    return { success: true, message: 'Email verified successfully! You can now log in to view your status.' };
};

export const resendEmailOtpService = async (email) => {
    const normalizedEmail = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalizedEmail });
    if (!influencer) {
        throw new ApiError(404, 'Influencer account not found.');
    }

    if (influencer.isEmailVerified) {
        return { success: true, message: 'Email address is already verified.' };
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    influencer.emailOtp = emailOtp;
    influencer.emailOtpExpiry = emailOtpExpiry;
    await influencer.save();

    await sendEmail({
        to: influencer.email,
        subject: 'Verify Your Email — Porutkal Influencer Program',
        html: `
            <h2>Email Verification OTP</h2>
            <p>Your new 6-digit OTP code to verify your email is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #7C3AED;">${emailOtp}</h1>
            <p>This OTP will expire in 15 minutes.</p>
        `,
    });

    return { success: true, message: 'New email verification OTP sent to your registered inbox.' };
};

export const loginInfluencerService = async (email, password) => {
    const normalizedEmail = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalizedEmail }).select(
        '+password +failedLoginAttempts +lockUntil'
    );
    if (!influencer) {
        throw new ApiError(401, 'Invalid email address or password.');
    }

    if (!influencer.isEmailVerified) {
        throw new ApiError(403, 'Email address is not verified. Please verify your email OTP before logging in.', { requiresEmailVerification: true });
    }

    // Check account lockout
    if (influencer.lockUntil && Date.now() < new Date(influencer.lockUntil).getTime()) {
        const remainingMins = Math.ceil((new Date(influencer.lockUntil).getTime() - Date.now()) / (60 * 1000));
        throw new ApiError(423, `Account temporarily locked due to multiple failed attempts. Try again in ${remainingMins} minutes.`);
    }

    const isMatch = await influencer.comparePassword(password);
    if (!isMatch) {
        influencer.failedLoginAttempts = (influencer.failedLoginAttempts || 0) + 1;
        if (influencer.failedLoginAttempts >= 5) {
            influencer.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        }
        await influencer.save();
        throw new ApiError(401, 'Invalid email address or password.');
    }

    if (influencer.status === 'suspended') {
        throw new ApiError(403, 'Your influencer account has been suspended. Reason: ' + (influencer.rejectionReason || 'Policy violation'));
    }

    // Reset lock counters and update last login
    influencer.failedLoginAttempts = 0;
    influencer.lockUntil = undefined;
    influencer.lastLogin = new Date();
    await influencer.save();

    const tokenPayload = {
        id: influencer._id,
        role: 'influencer',
        email: influencer.email,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const safeInfluencer = influencer.toObject();
    delete safeInfluencer.password;
    delete safeInfluencer.failedLoginAttempts;
    delete safeInfluencer.lockUntil;

    return {
        influencer: safeInfluencer,
        accessToken,
        refreshToken,
    };
};

export const forgotPasswordService = async (email) => {
    const normalizedEmail = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalizedEmail });
    if (!influencer) {
        throw new ApiError(404, 'No influencer account found with this email address.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    influencer.resetOtp = otp;
    influencer.resetOtpExpiry = otpExpiry;
    influencer.resetOtpVerified = false;
    await influencer.save();

    await sendEmail({
        to: influencer.email,
        subject: 'Password Reset OTP — Porutkal Influencer Portal',
        html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${influencer.name},</p>
            <p>Your 6-digit OTP code to reset your password is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #7C3AED;">${otp}</h1>
            <p>This OTP will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        `,
    });

    return { success: true, message: 'Password reset OTP sent to your registered email address.' };
};

export const verifyResetOtpService = async (email, otp) => {
    const normalizedEmail = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalizedEmail }).select('+resetOtp +resetOtpExpiry');
    if (!influencer || !influencer.resetOtp) {
        throw new ApiError(400, 'Invalid OTP or no reset request found.');
    }

    if (influencer.resetOtp !== String(otp).trim()) {
        throw new ApiError(400, 'Invalid OTP code.');
    }

    if (Date.now() > new Date(influencer.resetOtpExpiry).getTime()) {
        throw new ApiError(400, 'OTP code has expired. Please request a new one.');
    }

    influencer.resetOtpVerified = true;
    await influencer.save();

    return { success: true, message: 'OTP verified successfully.' };
};

export const resetPasswordService = async (email, otp, password) => {
    const normalizedEmail = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalizedEmail }).select(
        '+password +resetOtp +resetOtpExpiry +resetOtpVerified'
    );

    if (!influencer || influencer.resetOtp !== String(otp).trim()) {
        throw new ApiError(400, 'Invalid OTP session. Please request a new OTP.');
    }

    if (!influencer.resetOtpVerified) {
        throw new ApiError(400, 'OTP must be verified before resetting password.');
    }

    if (Date.now() > new Date(influencer.resetOtpExpiry).getTime()) {
        throw new ApiError(400, 'OTP code has expired. Please request a new one.');
    }

    influencer.password = password;
    influencer.resetOtp = undefined;
    influencer.resetOtpExpiry = undefined;
    influencer.resetOtpVerified = undefined;
    await influencer.save();

    return { success: true, message: 'Password has been reset successfully. You can now login.' };
};

export const getProfileService = async (influencerId) => {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
        throw new ApiError(404, 'Influencer profile not found.');
    }
    return influencer;
};

export const updateProfileService = async (influencerId, updateData) => {
    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
        throw new ApiError(404, 'Influencer profile not found.');
    }

    if (updateData.name) influencer.name = updateData.name;
    if (updateData.bio !== undefined) influencer.bio = updateData.bio;
    if (updateData.followers !== undefined) influencer.followers = updateData.followers;
    if (updateData.profileImage !== undefined) influencer.profileImage = updateData.profileImage;

    if (updateData.socialLinks) {
        influencer.socialLinks = {
            ...influencer.socialLinks,
            ...updateData.socialLinks,
        };
    }

    await influencer.save();
    return influencer;
};
