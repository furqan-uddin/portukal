import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    caption: { type: String },
    taggedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending',
        index: true 
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    moderatedAt: { type: Date }
}, { timestamps: true });

const Reel = mongoose.model('Reel', reelSchema);
export default Reel;
