import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Influencer from './modules/influencer/models/Influencer.model.js';
import Reel from './models/Reel.model.js';
import User from './models/User.model.js';

async function auditIdentity() {
    console.log('🔍 Auditing Influencer Identity Resolution in MongoDB...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/portukal';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.\n');

    try {
        const influencers = await Influencer.find().populate('user', 'name email').lean();
        console.log(`📋 Found ${influencers.length} total Influencer records in DB:\n`);

        influencers.forEach((inf, idx) => {
            console.log(`--- [Influencer #${idx + 1}] ---`);
            console.log(`   _id:          ${inf._id}`);
            console.log(`   name:         "${inf.name}"`);
            console.log(`   slug:         "${inf.slug}"`);
            console.log(`   email:        "${inf.email}"`);
            console.log(`   referralCode: "${inf.referralCode}"`);
            console.log(`   status:       "${inf.status}"`);
            console.log(`   user ID:      ${inf.user?._id || inf.user}`);
            console.log(`   user Email:   ${inf.user?.email || 'N/A'}`);
            console.log('');
        });

        // Audit Reels and their influencerId references
        const reels = await Reel.find({ influencerId: { $ne: null } })
            .populate('influencerId', 'name slug email')
            .lean();

        console.log(`🎬 Found ${reels.length} Reels with influencerId assigned:\n`);

        reels.forEach((reel, idx) => {
            console.log(`--- [Reel #${idx + 1}] ---`);
            console.log(`   _id:          ${reel._id}`);
            console.log(`   title:        "${reel.title}"`);
            console.log(`   status:       "${reel.status}"`);
            console.log(`   influencerId: ${reel.influencerId?._id || reel.influencerId}`);
            console.log(`   creator name: "${reel.influencerId?.name || 'UNKNOWN'}"`);
            console.log(`   creator slug: "${reel.influencerId?.slug || 'UNKNOWN'}"`);
            console.log('');
        });

    } catch (err) {
        console.error('❌ Audit Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

auditIdentity();
