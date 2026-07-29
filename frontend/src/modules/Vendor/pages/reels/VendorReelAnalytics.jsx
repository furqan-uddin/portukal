import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiEye, FiMousePointer, FiShoppingBag, FiDollarSign, FiTrendingUp, FiFilm, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import api from '../../../../shared/utils/api';
import toast from 'react-hot-toast';

const VendorReelAnalytics = () => {
    const navigate = useNavigate();
    const [range, setRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [topReels, setTopReels] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewRes, reelsRes] = await Promise.all([
                api.get('/vendor/reels/analytics/overview', { params: { range } }),
                api.get('/vendor/reels', { params: { limit: 10, sort: '-createdAt' } }),
            ]);
            setOverview(overviewRes.analytics || overviewRes);
            setTopReels(reelsRes.reels || []);
        } catch {
            toast.error('Failed to load reel analytics.');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = [
        { label: 'Total Reel Views', value: overview?.totalViews?.toLocaleString() || '0', icon: FiEye, color: 'bg-blue-50 text-blue-600 border-blue-100' },
        { label: 'Product Clicks', value: overview?.productClicks?.toLocaleString() || '0', icon: FiMousePointer, color: 'bg-purple-50 text-purple-600 border-purple-100' },
        { label: 'Orders Generated', value: overview?.orders?.toLocaleString() || '0', icon: FiShoppingBag, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { label: 'Reel Revenue', value: `₹${(overview?.revenue || 0).toLocaleString()}`, icon: FiDollarSign, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/vendor/reels')} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                            <FiBarChart2 className="text-blue-600" /> Reel Performance Analytics
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track views, product clicks, and revenue driven by your shoppable video reels</p>
                    </div>
                </div>

                {/* Range Filter */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {['7d', '30d', '90d'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Last {r.replace('d', ' Days')}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className={`p-5 rounded-2xl border ${s.color} bg-white shadow-sm flex items-center gap-4`}>
                            <div className={`p-3.5 rounded-2xl ${s.color} flex items-center justify-center`}>
                                <Icon size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500">{s.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Top Reels Performance */}
            <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <FiFilm className="text-blue-600" /> Top Reels
                    </h2>
                    <span className="text-xs font-semibold text-gray-400">Showing recent uploaded reels</span>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : topReels.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FiFilm size={40} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-semibold">No reel analytics available yet.</p>
                        <p className="text-xs mt-1">Upload a reel and share it to start receiving analytics.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {topReels.map((reel) => (
                            <div key={reel._id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/60 px-2 rounded-xl transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-12 h-16 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0">
                                        {reel.thumbnailUrl ? (
                                            <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500"><FiFilm size={18} /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">{reel.title}</h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{reel.productId?.name || 'No product attached'}</p>
                                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${reel.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {reel.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-right">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400">Date</p>
                                        <p className="text-xs font-bold text-gray-700">{new Date(reel.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400">Score</p>
                                        <p className="text-xs font-bold text-blue-600">{reel.trendingScore || 0}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorReelAnalytics;
