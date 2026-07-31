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
import { getProfileService } from './modules/influencer/services/influencerAuth.service.js';

async function verifyIdentityResolution() {
    console.log('🧪 Starting Influencer Identity Resolution Verification...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/portukal';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.\n');

    try {
        // 1. Audit Check: Find Influencer by email / user
        const primaryInfluencer = await Influencer.findOne({ email: 'nansitiwari31@gmail.com' });
        if (!primaryInfluencer) {
            throw new Error('Primary Nansi Tiwari record not found in MongoDB!');
        }

        const loggedInProfile = await getProfileService(primaryInfluencer._id);
        const loggedInId = String(loggedInProfile._id);

        console.log(`📌 1. Logged-in Profile (/influencer/profile):`);
        console.log(`   -> Influencer _id = "${loggedInId}"`);
        console.log(`   -> Name           = "${loggedInProfile.name}"`);
        console.log(`   -> Slug           = "${loggedInProfile.slug}"`);
        console.log(`   -> Email          = "${loggedInProfile.email}"\n`);

        // 2. Public Profile Resolution Check (/creator/nansitiwari)
        const cleanHandle = 'nansitiwari';
        const handleVariants = [
            cleanHandle,
            cleanHandle.replace(/_/g, '-'),
            cleanHandle.replace(/-/g, '_'),
        ];

        const publicCandidates = await Influencer.find({
            $or: [
                { slug: { $in: handleVariants } },
                { email: cleanHandle },
            ],
        }).lean();

        if (publicCandidates.length === 0) {
            throw new Error('Public creator profile lookup returned 0 candidates!');
        }

        const publicProfileDoc = publicCandidates[0];
        const publicId = String(publicProfileDoc._id);

        console.log(`📌 2. Public Profile (/creator/nansitiwari):`);
        console.log(`   -> Influencer _id = "${publicId}"`);
        console.log(`   -> Name           = "${publicProfileDoc.name}"`);
        console.log(`   -> Slug           = "${publicProfileDoc.slug}"`);
        console.log(`   -> Email          = "${publicProfileDoc.email}"\n`);

        // 3. Compare _id values
        console.log(`🔍 3. Comparing Influencer _id Values:`);
        console.log(`   - Logged-in _id: "${loggedInId}"`);
        console.log(`   - Public _id:    "${publicId}"`);
        const idsMatch = loggedInId === publicId;
        console.log(`   -> Do _id values match? ${idsMatch ? '✅ YES (IDENTICAL)' : '❌ NO (MISMATCH)'}\n`);

        if (!idsMatch) {
            throw new Error(`Identity resolution failure: Logged-in _id (${loggedInId}) !== Public _id (${publicId})`);
        }

        // 4. Verify Reels Ownership
        const reelsForInfluencer = await Reel.find({
            influencerId: primaryInfluencer._id,
            status: 'approved',
            visibility: 'public',
        }).lean();

        console.log(`🎬 4. Reels Stored for Influencer _id (${loggedInId}):`);
        console.log(`   - Count: ${reelsForInfluencer.length}`);
        reelsForInfluencer.forEach((r, idx) => {
            console.log(`   -> Reel #${idx + 1}: _id=${r._id}, title="${r.title}", stored influencerId=${r.influencerId}`);
        });

        // 5. Check for Duplicate Influencers in DB
        const duplicates = await Influencer.find({
            $or: [
                { email: 'nansitiwari31@gmail.com' },
                { slug: { $in: ['nansitiwari', 'nansi-tiwari'] } },
            ],
        });

        console.log(`\n👥 5. Duplicate Check in MongoDB:`);
        console.log(`   - Found ${duplicates.length} record(s) matching Nansi Tiwari.`);
        if (duplicates.length === 1) {
            console.log(`   - ✅ Exactly 1 canonical record in DB.`);
        } else {
            console.log(`   - ⚠️ Found ${duplicates.length} records in DB.`);
        }

        console.log('\n🎉 INFLUENCER IDENTITY RESOLUTION VERIFICATION PASSED PERFECTLY! 🎉\n');
    } catch (err) {
        console.error('\n❌ Verification Error:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

verifyIdentityResolution();
