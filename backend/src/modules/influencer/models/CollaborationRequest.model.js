import mongoose from 'mongoose';

const { Schema } = mongoose;

const collaborationRequestSchema = new Schema(
    {
        vendorId:                 { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
        influencerId:             { type: Schema.Types.ObjectId, ref: 'Influencer', required: true, index: true },
        productId:                { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        offeredCommissionPercent: { type: Number, default: 10 },
        message:                  { type: String, trim: true, maxlength: 1000 },
        initiatorModel:           { type: String, enum: ['Vendor', 'Influencer'], default: 'Vendor' },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending',
            index: true,
        },
        responseMessage: { type: String, trim: true },
        respondedAt:     { type: Date },
    },
    {
        timestamps: true,
    }
);

collaborationRequestSchema.index({ vendorId: 1, influencerId: 1, productId: 1, status: 1 });

const CollaborationRequest = mongoose.model('CollaborationRequest', collaborationRequestSchema);
export default CollaborationRequest;
