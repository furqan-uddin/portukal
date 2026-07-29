import { useState, useEffect } from 'react';
import {
    FiBarChart2,
    FiShoppingBag,
    FiCheckCircle,
    FiDollarSign,
    FiPercent,
    FiDownload,
    FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import KPICard from '../../Influencer/components/analytics/KPICard';
import ConversionFunnelCard from '../../Influencer/components/analytics/ConversionFunnelCard';
import GeoHeatmapCard from '../../Influencer/components/analytics/GeoHeatmapCard';
import LeaderboardTable from '../../Influencer/components/analytics/LeaderboardTable';
import {
    getVendorAnalytics,
    getConversionFunnel,
    getLeaderboards,
    getGeographicAnalytics,
    getHeatmapAnalytics,
} from '../../Influencer/services/influencerAnalyticsService';

const VendorAnalytics = () => {
    const [range, setRange] = useState('30days');
    const [loading, setLoading] = useState(true);

    const [analytics, setAnalytics] = useState(null);
    const [funnel, setFunnel] = useState([]);
    const [leaderboards, setLeaderboards] = useState({ topInfluencers: [], topVendors: [] });
    const [geo, setGeo] = useState([]);
    const [heatmap, setHeatmap] = useState([]);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            const [anRes, fnRes, ldRes, geoRes, hmRes] = await Promise.all([
                getVendorAnalytics({ range }),
                getConversionFunnel({ range }),
                getLeaderboards({ range }),
                getGeographicAnalytics({ range }),
                getHeatmapAnalytics({ range }),
            ]);

            setAnalytics(anRes?.data || anRes);
            setFunnel(fnRes?.data?.stages || fnRes?.stages || []);
            setLeaderboards(ldRes?.data || ldRes);
            setGeo(geoRes?.data?.geographicBreakdown || geoRes?.geographicBreakdown || []);
            setHeatmap(hmRes?.data?.hourlyClicks || hmRes?.hourlyClicks || []);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to fetch vendor influencer analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAnalytics();
    }, [range]);

    const kpis = analytics?.kpis || {};

    return (
        <div className="p-6 space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiBarChart2 className="text-indigo-600" />
                        Vendor Influencer Program Analytics
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track affiliate sales driven by promotional creators, commission liabilities, and ROI performance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        {['today', '7days', '30days', '90days'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                    range === r ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {r === 'today' ? 'Today' : r.replace('days', ' Days')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {['CSV', 'Excel', 'PDF'].map((fmt) => (
                            <button
                                key={fmt}
                                disabled
                                title="Export functionality coming in Phase 3 Part 2"
                                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 font-bold text-xs flex items-center gap-1 cursor-not-allowed opacity-60"
                            >
                                <FiDownload className="w-3.5 h-3.5" /> Export {fmt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400 font-medium">Computing vendor affiliate performance aggregation...</div>
            ) : (
                <>
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard
                            title="Affiliate Orders"
                            value={kpis.affiliateOrders?.value || 0}
                            trendData={kpis.affiliateOrders}
                            icon={FiShoppingBag}
                            color="indigo"
                        />
                        <KPICard
                            title="Total Commission Paid"
                            value={kpis.totalCommissionPaid?.value || 0}
                            prefix="₹"
                            trendData={kpis.totalCommissionPaid}
                            icon={FiDollarSign}
                            color="emerald"
                        />
                        <KPICard
                            title="Reserved Escrow"
                            value={kpis.reservedCommission || 0}
                            prefix="₹"
                            icon={FiDollarSign}
                            color="amber"
                            subtext="Held during return window"
                        />
                        <KPICard
                            title="Total Vendor Balance"
                            value={kpis.totalVendorBalance || 0}
                            prefix="₹"
                            icon={FiDollarSign}
                            color="purple"
                            subtext="Active commission liabilities"
                        />
                    </div>

                    {/* Conversion Funnel */}
                    <ConversionFunnelCard stages={funnel} />

                    {/* Geographic & Hourly Activity Heatmaps */}
                    <GeoHeatmapCard geographicBreakdown={geo} hourlyClicks={heatmap} />

                    {/* Ecosystem Leaderboards */}
                    <LeaderboardTable
                        topInfluencers={leaderboards.topInfluencers}
                        topVendors={leaderboards.topVendors}
                    />
                </>
            )}
        </div>
    );
};

export default VendorAnalytics;
