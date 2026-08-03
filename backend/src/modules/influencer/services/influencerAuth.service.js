import Influencer from '../models/Influencer.model.js';
import User from '../../../models/User.model.js';
import ApiError from '../../../utils/ApiError.js';
import { sendEmail } from '../../../services/email.service.js';
import { uploadToCloudinary } from '../../../services/upload.service.js';

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

export const registerInfluencerService = async (data, loggedInUserId = null) => {
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

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedMobile = String(mobile || '').trim();

    let user = null;

    if (loggedInUserId) {
        user = await User.findById(loggedInUserId);
        if (!user) {
            throw new ApiError(404, 'User account not found.');
        }
    } else {
        user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (user) {
            // User exists: verify password to confirm ownership before linking influencer application
            if (!password) {
                throw new ApiError(400, 'An account with this email already exists. Please enter your password to link your Influencer application.');
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new ApiError(401, 'Incorrect password for existing user account.');
            }
        } else {
            // New user registration
            if (!password) {
                throw new ApiError(400, 'Password is required to create your account.');
            }
            user = new User({
                name: name || 'Creator',
                email: normalizedEmail,
                password,
                phone: normalizedMobile,
                isVerified: true,
            });
            await user.save();
        }
    }

    // Check if user has already registered an Influencer profile
    const existingProfile = await Influencer.findOne({ user: user._id });
    if (existingProfile) {
        throw new ApiError(400, 'You have already submitted an Influencer application with this account.');
    }

    if (normalizedMobile) {
        const existingMobile = await Influencer.findOne({ mobile: normalizedMobile, user: { $ne: user._id } });
        if (existingMobile) {
            throw new ApiError(400, 'An influencer account with this mobile number already exists.');
        }
    }

    const influencerName = name || user.name || 'Creator';
    const slug = await generateUniqueSlug(influencerName);
    const referralCode = await generateUniqueReferralCode();

    // Mask Aadhaar Number if provided
    let maskedAadhaar = '';
    if (aadhaarNumber && aadhaarNumber.trim().length >= 4) {
        const cleanAadhaar = aadhaarNumber.trim();
        maskedAadhaar = `XXXX XXXX ${cleanAadhaar.slice(-4)}`;
    }

    const influencer = new Influencer({
        user: user._id,
        name: influencerName,
        slug,
        referralCode,
        email: normalizedEmail || user.email,
        mobile: normalizedMobile || user.phone || '',
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

    // Send Welcome Email
    sendEmail({
        to: influencer.email,
        subject: 'Welcome to the Porutkal Influencer Program!',
        html: `
            <h2>Welcome to Porutkal Marketplace, ${influencer.name}!</h2>
            <p>Your influencer application has been submitted and is currently under review.</p>
            <p>Your unique referral code is: <strong>${referralCode}</strong></p>
            <p>Your creator storefront handle: <strong>porutkal.com/@${slug}</strong></p>
            <p>You can now log in using your user credentials to check your application status.</p>
            <br>
            <p>Best regards,<br>The Porutkal Marketplace Team</p>
        `,
    }).catch((err) => console.error('Failed to send welcome email:', err.message));

    return {
        success: true,
        message: 'Registration successful! You can now log in to check your application status.',
        email: influencer.email,
        slug: influencer.slug,
        referralCode: influencer.referralCode,
    };
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

    if (updateData.profileImage) {
        if (String(updateData.profileImage).startsWith('data:image/')) {
            try {
                const uploaded = await uploadToCloudinary(updateData.profileImage, 'influencers/avatars');
                influencer.profileImage = uploaded.url;
            } catch (err) {
                console.error('Failed to upload base64 avatar to Cloudinary:', err.message);
                influencer.profileImage = updateData.profileImage;
            }
        } else {
            influencer.profileImage = updateData.profileImage;
        }
    }

    if (updateData.socialLinks) {
        influencer.socialLinks = {
            ...influencer.socialLinks,
            ...updateData.socialLinks,
        };
    }

    await influencer.save();

    if (influencer.user) {
        const userUpdates = {};
        if (influencer.name) userUpdates.name = influencer.name;
        if (influencer.profileImage) userUpdates.avatar = influencer.profileImage;
        if (Object.keys(userUpdates).length > 0) {
            await User.findByIdAndUpdate(influencer.user, userUpdates).catch(() => null);
        }
    }

    return influencer;
};
