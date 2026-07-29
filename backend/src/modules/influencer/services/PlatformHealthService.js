import CommissionSettlement from '../models/CommissionSettlement.model.js';
import WithdrawalRequest from '../models/WithdrawalRequest.model.js';
import InfluencerWallet from '../models/InfluencerWallet.model.js';

export class PlatformHealthService {
    static async getPlatformHealth() {
        const [pendingSettlements, failedSettlements, pendingWithdrawals, lockedWallets] = await Promise.all([
            CommissionSettlement.countDocuments({ status: 'pending' }),
            CommissionSettlement.countDocuments({ status: 'failed' }),
            WithdrawalRequest.countDocuments({ status: 'pending' }),
            InfluencerWallet.countDocuments({ walletLocked: true }),
        ]);

        return {
            platformHealth: {
                pendingSettlements,
                failedSettlements,
                pendingWithdrawals,
                lockedWallets,
                backgroundWorkerStatus: 'active',
                lastWorkerRun: new Date(),
            },
        };
    }
}
