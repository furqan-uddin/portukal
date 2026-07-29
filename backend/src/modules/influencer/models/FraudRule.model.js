import mongoose from 'mongoose';

const fraudRuleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        description: {
            type: String,
            default: '',
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        threshold: {
            type: Number,
            default: 5,
        },
        weight: {
            type: Number,
            default: 20,
        },
        action: {
            type: String,
            enum: ['flag', 'investigate', 'suspend', 'block'],
            default: 'flag',
        },
    },
    { timestamps: true }
);

const FraudRule = mongoose.models.FraudRule || mongoose.model('FraudRule', fraudRuleSchema);
export default FraudRule;
