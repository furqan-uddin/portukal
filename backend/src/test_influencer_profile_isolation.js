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

async function runIsolationTest() {
    console.log('🧪 Starting Influencer Profile Data Isolation Verification Test...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/portukal';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    try {
        // 1. Create or Find User & Influencer Creator A
        let userA = await User.findOne({ email: 'creator_a_test@example.com' });
        if (!userA) {
            userA = await User.create({
                name: 'Creator Alpha',
                email: 'creator_a_test@example.com',
                password: 'password123',
                role: 'customer',
            });
        }

        let creatorA = await Influencer.findOne({ slug: 'creator_a_test' });
        if (!creatorA) {
            creatorA = await Influencer.create({
                user: userA._id,
                name: 'Creator Alpha',
                slug: 'creator_a_test',
                referralCode: 'INF-ALPHA1',
                email: 'creator_a_test@example.com',
                status: 'approved',
                bio: 'Official Creator Alpha Bio',
                followers: 1200,
            });
        }

        // 2. Create or Find User & Influencer Creator B
        let userB = await User.findOne({ email: 'creator_b_test@example.com' });
        if (!userB) {
            userB = await User.create({
                name: 'Creator Beta',
                email: 'creator_b_test@example.com',
                password: 'password123',
                role: 'customer',
            });
        }

        let creatorB = await Influencer.findOne({ slug: 'creator_b_test' });
        if (!creatorB) {
            creatorB = await Influencer.create({
                user: userB._id,
                name: 'Creator Beta',
                slug: 'creator_b_test',
                referralCode: 'INF-BETA1',
                email: 'creator_b_test@example.com',
                status: 'approved',
                bio: 'Official Creator Beta Bio',
                followers: 450,
            });
        }

        // 3. Clean previous test reels for these test creators
        await Reel.deleteMany({ influencerId: { $in: [creatorA._id, creatorB._id] } });

        // 4. Create Reel A1 and Reel A2 for Creator A
        const reelA1 = await Reel.create({
            title: 'Reel A1 - Creator Alpha Summer Outfit',
            description: 'Summer collection haul by Creator Alpha',
            influencerId: creatorA._id,
            video: { secureUrl: 'https://example.com/reelA1.mp4' },
            videoUrl: 'https://example.com/reelA1.mp4',
            status: 'approved',
            visibility: 'public',
            publishedAt: new Date(),
            trendingScore: 100,
        });

        const reelA2 = await Reel.create({
            title: 'Reel A2 - Creator Alpha Footwear Showcase',
            description: 'Sneakers try on by Creator Alpha',
            influencerId: creatorA._id,
            video: { secureUrl: 'https://example.com/reelA2.mp4' },
            videoUrl: 'https://example.com/reelA2.mp4',
            status: 'approved',
            visibility: 'public',
            publishedAt: new Date(),
            trendingScore: 90,
        });

        // Create 1 draft reel for Creator A (must NOT appear publicly)
        const reelADraft = await Reel.create({
            title: 'Reel A3 - Creator Alpha Draft Video',
            description: 'Unapproved draft by Creator Alpha',
            influencerId: creatorA._id,
            video: { secureUrl: 'https://example.com/reelA3_draft.mp4' },
            videoUrl: 'https://example.com/reelA3_draft.mp4',
            status: 'draft',
            visibility: 'public',
            publishedAt: new Date(),
        });

        // 5. Create Reel B1 for Creator B
        const reelB1 = await Reel.create({
            title: 'Reel B1 - Creator Beta Watch Unboxing',
            description: 'Luxury watch review by Creator Beta',
            influencerId: creatorB._id,
            video: { secureUrl: 'https://example.com/reelB1.mp4' },
            videoUrl: 'https://example.com/reelB1.mp4',
            status: 'approved',
            visibility: 'public',
            publishedAt: new Date(),
            trendingScore: 80,
        });

        console.log('✅ Test Data Created:');
        console.log(`   - Creator A (${creatorA.name}, slug: ${creatorA.slug}): 2 Public Approved Reels, 1 Draft`);
        console.log(`   - Creator B (${creatorB.name}, slug: ${creatorB.slug}): 1 Public Approved Reel\n`);

        // 6. Test Data Isolation for Creator A
        const reelsForA = await Reel.find({
            influencerId: creatorA._id,
            status: 'approved',
            visibility: 'public',
        }).sort({ publishedAt: -1 });

        const countForA = await Reel.countDocuments({
            influencerId: creatorA._id,
            status: 'approved',
            visibility: 'public',
        });

        console.log('🔍 Testing Creator A Profile Isolation:');
        console.log(`   - Total Approved Public Reels fetched for Creator A: ${reelsForA.length}`);
        console.log(`   - Reel Count Document for Creator A: ${countForA}`);

        const reelIdsA = reelsForA.map((r) => String(r._id));
        const containsB1InA = reelIdsA.includes(String(reelB1._id));
        const containsDraftInA = reelIdsA.includes(String(reelADraft._id));

        console.log(`   - Contains Creator B's Reel (B1)? ${containsB1InA ? '❌ YES (BUG!)' : '✅ NO (PASSED)'}`);
        console.log(`   - Contains Draft Reel? ${containsDraftInA ? '❌ YES (BUG!)' : '✅ NO (PASSED)'}`);

        if (countForA !== 2 || containsB1InA || containsDraftInA) {
            throw new Error('Data isolation failure for Creator A!');
        }

        // 7. Test Data Isolation for Creator B
        const reelsForB = await Reel.find({
            influencerId: creatorB._id,
            status: 'approved',
            visibility: 'public',
        }).sort({ publishedAt: -1 });

        const countForB = await Reel.countDocuments({
            influencerId: creatorB._id,
            status: 'approved',
            visibility: 'public',
        });

        console.log('\n🔍 Testing Creator B Profile Isolation:');
        console.log(`   - Total Approved Public Reels fetched for Creator B: ${reelsForB.length}`);
        console.log(`   - Reel Count Document for Creator B: ${countForB}`);

        const reelIdsB = reelsForB.map((r) => String(r._id));
        const containsA1InB = reelIdsB.includes(String(reelA1._id));
        const containsA2InB = reelIdsB.includes(String(reelA2._id));

        console.log(`   - Contains Creator A's Reel (A1)? ${containsA1InB ? '❌ YES (BUG!)' : '✅ NO (PASSED)'}`);
        console.log(`   - Contains Creator A's Reel (A2)? ${containsA2InB ? '❌ YES (BUG!)' : '✅ NO (PASSED)'}`);

        if (countForB !== 1 || containsA1InB || containsA2InB) {
            throw new Error('Data isolation failure for Creator B!');
        }

        console.log('\n🎉 ALL INFLUENCER PROFILE DATA ISOLATION TESTS PASSED PERFECTLY! 🎉\n');
    } catch (err) {
        console.error('\n❌ Test Error:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

runIsolationTest();
