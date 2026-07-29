import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Follow relationships: user → vendor or user → influencer.
 * Drives personalized reel feed rankings.
 */
const reelFollowSchema = new Schema(
    {
        followerId:   { type: Schema.Types.ObjectId, required: true, index: true },
        followerType: { type: String, enum: ['user', 'influencer'], default: 'user' },
        entityId:     { type: Schema.Types.ObjectId, required: true, index: true },
        entityType:   { type: String, enum: ['vendor', 'influencer'], required: true },
    },
    { timestamps: true }
);

// One follow per follower+entity
reelFollowSchema.index({ followerId: 1, entityId: 1, entityType: 1 }, { unique: true });

// Fast count queries
reelFollowSchema.index({ entityId: 1, entityType: 1 });

const ReelFollow = mongoose.model('ReelFollow', reelFollowSchema);
export default ReelFollow;
