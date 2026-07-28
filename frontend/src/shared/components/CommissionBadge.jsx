import { FiPercent, FiDollarSign } from 'react-icons/fi';

const CommissionBadge = ({ commissionPercent = 0, estimatedEarnings = 0, size = 'sm' }) => {
    if (size === 'lg') {
        return (
            <div className="flex flex-col gap-1 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 flex items-center gap-1 uppercase tracking-wider">
                        <FiPercent className="w-3.5 h-3.5" /> Commission Rate
                    </span>
                    <span className="font-extrabold text-purple-900 text-sm">{commissionPercent}%</span>
                </div>
                {estimatedEarnings > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-purple-100">
                        <span className="text-xs text-purple-600 font-medium">Est. Earnings per Sale</span>
                        <span className="font-black text-emerald-700 text-sm">₹{estimatedEarnings.toLocaleString()}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-xs">
            <span className="flex items-center gap-0.5 text-purple-700 font-bold">
                <FiPercent className="w-3 h-3" /> {commissionPercent}%
            </span>
            {estimatedEarnings > 0 && (
                <>
                    <span className="text-purple-300">•</span>
                    <span className="text-emerald-700 font-black">₹{estimatedEarnings.toLocaleString()}</span>
                </>
            )}
        </div>
    );
};

export default CommissionBadge;
