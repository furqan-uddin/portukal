import { useState, useEffect } from 'react';
import {
    FiAward,
    FiClock,
    FiCheckCircle,
    FiDollarSign,
    FiRefreshCw,
    FiFileText,
    FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
    getVendorWalletSummary,
    getVendorLedger,
    getVendorSettlements,
} from '../../Influencer/services/influencerWalletService';

const VendorInfluencerWallet = () => {
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'settlements'

    const [ledger, setLedger] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [loadingTab, setLoadingTab] = useState(true);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const res = await getVendorWalletSummary();
            const data = res?.data || res;
            setSummary(data);
        } catch (err) {
            toast.error('Failed to fetch vendor influencer wallet summary.');
        } finally {
            setLoadingSummary(false);
        }
    };

    const fetchTabData = async () => {
        setLoadingTab(true);
        try {
            if (activeTab === 'ledger') {
                const res = await getVendorLedger();
                setLedger(res?.data?.ledger || res?.ledger || []);
            } else if (activeTab === 'settlements') {
                const res = await getVendorSettlements();
                setSettlements(res?.data?.settlements || res?.settlements || []);
            }
        } catch (err) {
            toast.error('Failed to load vendor ledger data.');
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

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiAward className="text-purple-600" />
                        Affiliate Commission Escrow & Ledger
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track reserved commissions, settlement releases, and immutable transaction logs for promotional affiliate sales.
                    </p>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Balance */}
                <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-5 rounded-2xl shadow-md space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-200 block">Total Influencer Commission Held</span>
                    <div className="text-3xl font-black">₹{(wallet.balance || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-purple-200 font-semibold block">Combined active commission liabilities</span>
                </div>

                {/* Reserved Escrow */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Currently Reserved Escrow</span>
                    <div className="text-2xl font-bold text-amber-600">₹{(wallet.reservedBalance || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400 block">Locked during 7-day return window</span>
                </div>

                {/* Released Today */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Released Today</span>
                    <div className="text-2xl font-bold text-emerald-600">₹{(summary?.releasedToday || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400 block">Settled to creators today</span>
                </div>

                {/* Lifetime Released */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Lifetime Released</span>
                    <div className="text-2xl font-bold text-slate-900">₹{(wallet.releasedBalance || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-slate-400 block">Total settled since joining</span>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50">
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Immutable Vendor Ledger Logs
                    </button>

                    <button
                        onClick={() => setActiveTab('settlements')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'settlements' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Commission Settlement History
                    </button>
                </div>

                {/* Tab Table Body */}
                <div className="p-4 overflow-x-auto">
                    {loadingTab ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading vendor ledger logs...</div>
                    ) : activeTab === 'ledger' ? (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4 font-bold">Type</th>
                                    <th className="py-3 px-4 font-bold">Creator</th>
                                    <th className="py-3 px-4 font-bold">Description</th>
                                    <th className="py-3 px-4 font-bold text-right">Amount</th>
                                    <th className="py-3 px-4 font-bold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ledger.length === 0 ? (
                                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No vendor ledger logs recorded yet.</td></tr>
                                ) : (
                                    ledger.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/60">
                                            <td className="py-3.5 px-4 font-bold uppercase text-[10px] text-purple-700">{log.type}</td>
                                            <td className="py-3.5 px-4 font-bold text-slate-800">{log.influencerId?.name || 'Creator'}</td>
                                            <td className="py-3.5 px-4 text-slate-600">{log.description || 'N/A'}</td>
                                            <td className={`py-3.5 px-4 text-right font-bold ${log.amount >= 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                {log.amount >= 0 ? '+' : ''}₹{log.amount?.toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4 font-bold">Influencer</th>
                                    <th className="py-3 px-4 font-bold text-right">Commission</th>
                                    <th className="py-3 px-4 font-bold text-center">Status</th>
                                    <th className="py-3 px-4 font-bold">Eligible Date</th>
                                    <th className="py-3 px-4 font-bold">Settled Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {settlements.length === 0 ? (
                                    <tr><td colSpan={5} className="py-6 text-center text-slate-400">No settlements logged.</td></tr>
                                ) : (
                                    settlements.map((s) => (
                                        <tr key={s._id} className="hover:bg-slate-50/60">
                                            <td className="py-3.5 px-4 font-bold text-slate-800">{s.influencerId?.name || 'Influencer'}</td>
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
        </div>
    );
};

export default VendorInfluencerWallet;
