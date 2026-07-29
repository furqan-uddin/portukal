import { FiActivity, FiAlertTriangle, FiCheckCircle, FiClock, FiLock } from 'react-icons/fi';

const PlatformHealthCard = ({ health = {} }) => {
    return (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-white text-sm">Platform Operational Health</h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-500/30">
                    Engine Active
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pending Settlements</span>
                    <div className="text-xl font-black text-amber-400">{health.pendingSettlements || 0}</div>
                    <span className="text-[10px] text-slate-400 block">Return window holding</span>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Failed Settlements</span>
                    <div className="text-xl font-black text-rose-400">{health.failedSettlements || 0}</div>
                    <span className="text-[10px] text-slate-400 block">Queued for auto-retry</span>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pending Withdrawals</span>
                    <div className="text-xl font-black text-indigo-400">{health.pendingWithdrawals || 0}</div>
                    <span className="text-[10px] text-slate-400 block">Admin payout queue</span>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Locked Creator Wallets</span>
                    <div className="text-xl font-black text-purple-400">{health.lockedWallets || 0}</div>
                    <span className="text-[10px] text-slate-400 block">Security hold active</span>
                </div>
            </div>
        </div>
    );
};

export default PlatformHealthCard;
