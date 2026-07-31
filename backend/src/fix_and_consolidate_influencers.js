import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Influencer from './modules/influencer/models/Influencer.model.js';
import Reel from './models/Reel.model.js';

async function consolidateInfluencerIdentity() {
    console.log('🔄 Consolidating Influencer Identities in MongoDB...\n');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/portukal';
    await mongoose.connect(mongoUri);

    try {
        const primaryNansi = await Influencer.findById('6a689ca4961b778c204de6ba');
        const secondaryNansi = await Influencer.findById('6a6c4da62193709d39aac37b');

        if (secondaryNansi && primaryNansi && String(primaryNansi._id) !== String(secondaryNansi._id)) {
            // Re-assign any reels pointing to secondary Nansi to primary Nansi
            const updatedReels = await Reel.updateMany(
                { influencerId: secondaryNansi._id },
                { influencerId: primaryNansi._id }
            );
            console.log(`✅ Reassigned ${updatedReels.modifiedCount} reels from secondary record to primary record.`);

            // Delete secondary empty duplicate record
            await Influencer.deleteOne({ _id: secondaryNansi._id });
            console.log(`🗑️ Removed duplicate secondary Influencer record (${secondaryNansi._id}).`);
        }

        if (primaryNansi) {
            console.log(`📌 Primary Nansi Tiwari Record Found: _id=${primaryNansi._id}, old slug=${primaryNansi.slug}`);
            primaryNansi.slug = 'nansitiwari';
            await primaryNansi.save();
            console.log(`✅ Updated Primary Nansi Tiwari slug to "nansitiwari".`);
        }

        console.log('\n🎉 Influencer Identity Consolidation Complete!\n');
    } catch (err) {
        console.error('❌ Consolidation Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

consolidateInfluencerIdentity();
