import { useState, useEffect } from 'react';
import {
    FiBarChart2,
    FiMousePointer,
    FiShoppingBag,
    FiCheckCircle,
    FiXCircle,
    FiDollarSign,
    FiPercent,
    FiDownload,
    FiFilter,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import KPICard from '../components/analytics/KPICard';
import ConversionFunnelCard from '../components/analytics/ConversionFunnelCard';
import GeoHeatmapCard from '../components/analytics/GeoHeatmapCard';
import LeaderboardTable from '../components/analytics/LeaderboardTable';
import {
    getInfluencerAnalytics,
    getConversionFunnel,
    getLeaderboards,
    getGeographicAnalytics,
    getHeatmapAnalytics,
} from '../services/influencerAnalyticsService';

import ReportHistoryModal from '../components/reports/ReportHistoryModal';
import { requestReportGeneration } from '../services/reportService';

const InfluencerAnalytics = () => {
    const [range, setRange] = useState('30days');
    const [loading, setLoading] = useState(true);
    const [isPendingApproval, setIsPendingApproval] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const [analytics, setAnalytics] = useState(null);
    const [funnel, setFunnel] = useState([]);
    const [leaderboards, setLeaderboards] = useState({ topInfluencers: [], topVendors: [] });
    const [geo, setGeo] = useState([]);
    const [heatmap, setHeatmap] = useState([]);

    const handleExport = async (format) => {
        try {
            await requestReportGeneration({
                reportType: 'revenue',
                format: format.toLowerCase(),
                filters: { range },
            });
            toast.success(`${format} report generation queued!`);
            setIsHistoryOpen(true);
        } catch (err) {
            toast.error('Failed to queue export.');
        }
    };

    const fetchAllAnalytics = async () => {
        setLoading(true);
        setIsPendingApproval(false);
        try {
            const [anRes, fnRes, ldRes, geoRes, hmRes] = await Promise.all([
                getInfluencerAnalytics({ range }),
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
            if (err?.response?.status === 403) {
                setIsPendingApproval(true);
            } else {
                toast.error(err?.response?.data?.message || 'Failed to fetch influencer analytics.');
            }
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
                        <FiBarChart2 className="text-purple-600" />
                        Creator Performance BI Analytics
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track attribution clicks, conversion funnel drop-offs, revenue trends, and comparative period trends.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Range Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        {['today', '7days', '30days', '90days'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                    range === r ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {r === 'today' ? 'Today' : r.replace('days', ' Days')}
                            </button>
                        ))}
                    </div>

                    {/* Export UI Buttons */}
                    <div className="flex items-center gap-1.5">
                        {['CSV', 'Excel', 'PDF'].map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => handleExport(fmt)}
                                className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                            >
                                <FiDownload className="w-3.5 h-3.5" /> Export {fmt}
                            </button>
                        ))}
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors ml-1"
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-400 font-medium">Computing analytics aggregation pipelines...</div>
            ) : isPendingApproval ? (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md font-bold text-xl">
                        ⏳
                    </div>
                    <h3 className="text-xl font-bold text-amber-950">Application Pending Admin Approval</h3>
                    <p className="text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
                        Your creator account is currently undergoing verification by our Admin team. Once approved in the Admin Portal, live BI analytics, attribution click tracking, and revenue reporting will be unlocked automatically.
                    </p>
                    <div className="inline-block bg-white px-4 py-2 rounded-xl text-xs font-bold text-amber-900 border border-amber-200">
                        Status: <span className="uppercase tracking-wider text-amber-700 font-extrabold">Pending Review</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard
                            title="Attribution Clicks"
                            value={kpis.clicks?.value || 0}
                            trendData={kpis.clicks}
                            icon={FiMousePointer}
                            color="purple"
                        />
                        <KPICard
                            title="Referral Orders"
                            value={kpis.orders?.value || 0}
                            trendData={kpis.orders}
                            icon={FiShoppingBag}
                            color="indigo"
                        />
                        <KPICard
                            title="Delivered Orders"
                            value={kpis.deliveredOrders?.value || 0}
                            trendData={kpis.deliveredOrders}
                            icon={FiCheckCircle}
                            color="emerald"
                        />
                        <KPICard
                            title="Conversion Rate"
                            value={kpis.conversionRate?.value || 0}
                            suffix="%"
                            trendData={kpis.conversionRate}
                            icon={FiPercent}
                            color="teal"
                        />
                        <KPICard
                            title="Gross Revenue Generated"
                            value={kpis.revenue?.value || 0}
                            prefix="₹"
                            trendData={kpis.revenue}
                            icon={FiDollarSign}
                            color="emerald"
                        />
                        <KPICard
                            title="Total Commission Earned"
                            value={kpis.commissionEarned?.value || 0}
                            prefix="₹"
                            trendData={kpis.commissionEarned}
                            icon={FiDollarSign}
                            color="purple"
                        />
                        <KPICard
                            title="Average Order Value"
                            value={kpis.averageOrderValue?.value || 0}
                            prefix="₹"
                            trendData={kpis.averageOrderValue}
                            icon={FiBarChart2}
                            color="slate"
                        />
                        <KPICard
                            title="Available Balance"
                            value={kpis.availableBalance || 0}
                            prefix="₹"
                            icon={FiDollarSign}
                            color="emerald"
                            subtext="Ready for withdrawal request"
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

            <ReportHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        </div>
    );
};

export default InfluencerAnalytics;
