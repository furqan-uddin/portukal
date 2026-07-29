import { useState } from 'react';
import { FiAward, FiTrendingUp } from 'react-icons/fi';

const LeaderboardTable = ({ topInfluencers = [], topVendors = [] }) => {
    const [tab, setTab] = useState('influencers');

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50">
                <button
                    onClick={() => setTab('influencers')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        tab === 'influencers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Top Performing Creators
                </button>
                <button
                    onClick={() => setTab('vendors')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        tab === 'vendors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Top Performing Vendors
                </button>
            </div>

            <div className="p-4 overflow-x-auto">
                {tab === 'influencers' ? (
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="py-3 px-4 font-bold">Rank</th>
                                <th className="py-3 px-4 font-bold">Creator</th>
                                <th className="py-3 px-4 font-bold text-right">Orders Generated</th>
                                <th className="py-3 px-4 font-bold text-right">Total Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topInfluencers.length === 0 ? (
                                <tr><td colSpan={4} className="py-6 text-center text-slate-400">No leaderboard records available.</td></tr>
                            ) : (
                                topInfluencers.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60">
                                        <td className="py-3.5 px-4 font-black text-purple-700">#{idx + 1}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.influencer?.name || 'Creator'}</td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">{item.ordersCount}</td>
                                        <td className="py-3.5 px-4 text-right font-black text-emerald-600">₹{item.totalCommission?.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="py-3 px-4 font-bold">Rank</th>
                                <th className="py-3 px-4 font-bold">Vendor Store</th>
                                <th className="py-3 px-4 font-bold text-right">Affiliate Orders</th>
                                <th className="py-3 px-4 font-bold text-right">Commission Settled</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topVendors.length === 0 ? (
                                <tr><td colSpan={4} className="py-6 text-center text-slate-400">No vendor rankings recorded.</td></tr>
                            ) : (
                                topVendors.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60">
                                        <td className="py-3.5 px-4 font-black text-indigo-700">#{idx + 1}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.vendor?.storeName || 'Vendor'}</td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">{item.ordersCount}</td>
                                        <td className="py-3.5 px-4 text-right font-black text-indigo-600">₹{item.totalCommissionPaid?.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default LeaderboardTable;
