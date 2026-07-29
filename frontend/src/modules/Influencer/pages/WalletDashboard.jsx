import { useState, useEffect } from 'react';
import {
    FiDollarSign,
    FiClock,
    FiCheckCircle,
    FiArrowUpRight,
    FiTrendingUp,
    FiCalendar,
    FiPlus,
    FiRefreshCw,
    FiActivity,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import RequestWithdrawalModal from '../components/RequestWithdrawalModal';
import {
    getInfluencerWalletSummary,
    getInfluencerWalletTransactions,
    getInfluencerSettlements,
    getInfluencerWithdrawals,
} from '../services/influencerWalletService';

const WalletDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'withdrawals' | 'settlements'

    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loadingTab, setLoadingTab] = useState(true);

    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const res = await getInfluencerWalletSummary();
            const data = res?.data || res;
            setSummary(data);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch wallet summary.');
        } finally {
            setLoadingSummary(false);
        }
    };

    const fetchTabData = async () => {
        setLoadingTab(true);
        try {
            if (activeTab === 'transactions') {
                const res = await getInfluencerWalletTransactions();
                setTransactions(res?.data?.transactions || res?.transactions || []);
            } else if (activeTab === 'withdrawals') {
                const res = await getInfluencerWithdrawals();
                setWithdrawals(res?.data?.withdrawals || res?.withdrawals || []);
            } else if (activeTab === 'settlements') {
                const res = await getInfluencerSettlements();
                setSettlements(res?.data?.settlements || res?.settlements || []);
            }
        } catch (err) {
            toast.error('Failed to load tab data.');
        } finally {
            setLoadingTab(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchTabData();
    }, [activeTab]);

    const wallet = summary?.wallet || {};
    const hasPendingWithdrawal = (withdrawals || []).some((w) => w.status === 'pending');

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiDollarSign className="text-emerald-600" />
                        Creator Financial Wallet
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track your reserved commission escrow, available balances, settlements, and submit payout requests.
                    </p>
                </div>

                <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={hasPendingWithdrawal || !wallet.availableBalance || wallet.availableBalance < 100}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiArrowUpRight className="w-4 h-4" /> {hasPendingWithdrawal ? 'Pending Request Exists' : 'Request Payout'}
                </button>
            </div>

            {hasPendingWithdrawal && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
                    <FiClock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <span className="font-bold">Active Withdrawal Notice: </span>
                        You currently have an active pending payout request under Admin review. Additional requests are paused until your pending request is processed.
                    </div>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">Withdrawable Available Balance</span>
                    <div className="text-3xl font-black">₹{(wallet.availableBalance || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-emerald-200 font-semibold block">Ready for immediate withdrawal</span>
                </div>

                {/* Reserved Escrow */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Reserved Escrow</span>
                    <div className="text-2xl font-bold text-amber-600">₹{(wallet.reservedBalance || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400 block">Held during 7-day return window</span>
                </div>

                {/* Pending Payout Requests */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Pending Withdrawals</span>
                    <div className="text-2xl font-bold text-indigo-600">₹{(wallet.pendingBalance || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400 block">Under admin processing</span>
                </div>

                {/* Total Lifetime Earnings */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Lifetime Earnings</span>
                    <div className="text-2xl font-bold text-slate-900">₹{(wallet.lifetimeEarnings || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400 block">Total settled commission</span>
                </div>
            </div>

            {/* Next Settlement Info Banner */}
            {summary?.nextSettlementDate && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-indigo-900">
                    <FiCalendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div>
                        <span className="font-bold">Next Automated Settlement Release: </span>
                        <span className="font-mono font-bold text-indigo-700">
                            {new Date(summary.nextSettlementDate).toLocaleString()}
                        </span>
                        <span className="text-indigo-600 block mt-0.5">
                            ({summary.pendingSettlementsCount} orders currently in 7-day return window)
                        </span>
                    </div>
                </div>
            )}

            {/* Main Tabs Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Wallet Transactions Log
                    </button>

                    <button
                        onClick={() => setActiveTab('withdrawals')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Withdrawal History
                    </button>

                    <button
                        onClick={() => setActiveTab('settlements')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'settlements' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Commission Settlements
                    </button>
                </div>

                {/* Tab Table Body */}
                <div className="p-4 overflow-x-auto">
                    {loadingTab ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading ledger data...</div>
                    ) : activeTab === 'transactions' ? (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4 font-bold">Type</th>
                                    <th className="py-3 px-4 font-bold">Description</th>
                                    <th className="py-3 px-4 font-bold text-right">Amount</th>
                                    <th className="py-3 px-4 font-bold text-right">Balance After</th>
                                    <th className="py-3 px-4 font-bold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No transactions recorded yet.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-slate-50/60">
                                            <td className="py-3.5 px-4 font-bold uppercase text-[10px] text-slate-700">{tx.type}</td>
                                            <td className="py-3.5 px-4 text-slate-600">{tx.description || 'N/A'}</td>
                                            <td className={`py-3.5 px-4 text-right font-bold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.amount >= 0 ? '+' : ''}₹{tx.amount?.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                                                ₹{tx.balanceAfter?.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : activeTab === 'withdrawals' ? (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4 font-bold">Amount</th>
                                    <th className="py-3 px-4 font-bold">Method / Details</th>
                                    <th className="py-3 px-4 font-bold text-center">Status</th>
                                    <th className="py-3 px-4 font-bold">Requested Date</th>
                                    <th className="py-3 px-4 font-bold">Ref / Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No withdrawal requests found.</td></tr>
                                ) : (
                                    withdrawals.map((w) => (
                                        <tr key={w._id} className="hover:bg-slate-50/60">
                                            <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{w.amount?.toLocaleString()}</td>
                                            <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                                                {w.upiId ? `UPI: ${w.upiId}` : `A/C: ${w.bankDetails?.accountNumber || 'N/A'}`}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    w.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                                    w.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                    w.status === 'approved' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-400">{new Date(w.requestedAt).toLocaleString()}</td>
                                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{w.bankTransactionId || w.remarks || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4 font-bold">Vendor</th>
                                    <th className="py-3 px-4 font-bold text-right">Commission</th>
                                    <th className="py-3 px-4 font-bold text-center">Status</th>
                                    <th className="py-3 px-4 font-bold">Eligible Settlement Date</th>
                                    <th className="py-3 px-4 font-bold">Settled At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {settlements.length === 0 ? (
                                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No commission settlements logged.</td></tr>
                                ) : (
                                    settlements.map((s) => (
                                        <tr key={s._id} className="hover:bg-slate-50/60">
                                            <td className="py-3.5 px-4 font-bold text-slate-800">{s.vendorId?.storeName || 'Vendor'}</td>
                                            <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">₹{s.commissionAmount?.toLocaleString()}</td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    s.status === 'settled' ? 'bg-emerald-100 text-emerald-800' :
                                                    s.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {s.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500">{new Date(s.eligibleSettlementDate).toLocaleString()}</td>
                                            <td className="py-3.5 px-4 text-slate-400">{s.settledAt ? new Date(s.settledAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Request Withdrawal Modal */}
            {isWithdrawModalOpen && (
                <RequestWithdrawalModal
                    availableBalance={wallet.availableBalance || 0}
                    onClose={() => setIsWithdrawModalOpen(false)}
                    onSuccess={() => {
                        fetchSummary();
                        fetchTabData();
                    }}
                />
            )}
        </div>
    );
};

export default WalletDashboard;
