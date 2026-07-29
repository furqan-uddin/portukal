import mongoose from 'mongoose';

const vendorWalletSchema = new mongoose.Schema(
    {
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            unique: true,
            index: true,
        },
        balance: {
            type: Number,
            default: 0,
        },
        reservedBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        withdrawableBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        releasedBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalReserved: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalReleased: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalWithdrawn: {
            type: Number,
            default: 0,
            min: 0,
        },
        walletLocked: {
            type: Boolean,
            default: false,
        },
        processingSettlement: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const VendorWallet = mongoose.model('VendorWallet', vendorWalletSchema);
export default VendorWallet;
