import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import cloudinary from './config/cloudinary.js';

// Ensure Cloudinary config is explicitly set with env variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

import User from './models/User.model.js';
import Influencer from './modules/influencer/models/Influencer.model.js';
import { updateProfileService } from './modules/influencer/services/influencerAuth.service.js';
import { uploadToCloudinary } from './services/upload.service.js';

async function testProfileUploads() {
    console.log('🧪 Starting Profile Image Upload and Update Verification Test...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/portukal';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.\n');

    try {
        // 1. Find or create a test user
        let user = await User.findOne({ email: 'nansitiwari31@gmail.com' });
        if (!user) {
            user = await User.findOne({ email: 'test@example.com' });
        }
        if (!user) {
            throw new Error('Test user not found!');
        }

        console.log(`📌 Testing User Avatar Update for User (${user.email}, _id: ${user._id}):`);
        const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        const cloudinaryResult = await uploadToCloudinary(sampleBase64, 'users/avatars');
        console.log(`   - Uploaded sample image to Cloudinary: ${cloudinaryResult.url}`);

        user.avatar = cloudinaryResult.url;
        await user.save();
        console.log(`   - Saved avatar to User document in MongoDB: ${user.avatar}`);

        const reloadedUser = await User.findById(user._id);
        if (reloadedUser.avatar !== cloudinaryResult.url) {
            throw new Error('User avatar persistence check failed!');
        }
        console.log(`   - ✅ User Avatar update & DB persistence verified successfully!\n`);

        // 2. Testing Influencer Profile Update
        const influencer = await Influencer.findOne({ user: user._id }) || await Influencer.findOne({ slug: 'nansitiwari' });
        if (!influencer) {
            throw new Error('Influencer profile not found for testing!');
        }

        console.log(`📌 Testing Influencer Profile Update for Influencer (_id: ${influencer._id}, slug: ${influencer.slug}):`);
        const updatedInfluencer = await updateProfileService(influencer._id, {
            name: influencer.name,
            bio: 'Updated Bio for E2E Verification Test ✨',
            profileImage: sampleBase64,
            socialLinks: {
                instagram: '@nansitiwari_official',
                youtube: 'youtube.com/@nansitiwari',
            },
        });

        console.log(`   - Updated Influencer Bio: "${updatedInfluencer.bio}"`);
        console.log(`   - Updated Influencer Profile Image URL: "${updatedInfluencer.profileImage}"`);
        console.log(`   - Updated Social Links:`, updatedInfluencer.socialLinks);

        const reloadedInfluencer = await Influencer.findById(influencer._id);
        if (!reloadedInfluencer.profileImage.startsWith('http')) {
            throw new Error('Influencer profile image was not converted to a valid Cloudinary URL!');
        }

        console.log(`   - ✅ Influencer Profile update & Cloudinary avatar conversion verified successfully!\n`);

        console.log('🎉 ALL PROFILE IMAGE UPLOAD & UPDATE VERIFICATION TESTS PASSED PERFECTLY! 🎉\n');
    } catch (err) {
        console.error('❌ Test Error:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

testProfileUploads();
