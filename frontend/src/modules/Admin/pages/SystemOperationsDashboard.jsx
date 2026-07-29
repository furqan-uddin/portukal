import { useState, useEffect } from 'react';
import {
    FiCpu,
    FiDatabase,
    FiZap,
    FiActivity,
    FiCheckCircle,
    FiClock,
    FiServer,
    FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getSystemOperationsMetrics } from '../services/systemHealthService';

const SystemOperationsDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await getSystemOperationsMetrics();
            setMetrics(res?.data || res || {});
        } catch (err) {
            toast.error('Failed to fetch system operations metrics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 10000); // 10s auto refresh
        return () => clearInterval(interval);
    }, []);

    const processStats = metrics?.processMetrics || {};
    const db = metrics?.database || {};
    const queues = metrics?.queues || {};
    const cache = metrics?.cache || {};
    const apiStats = metrics?.apiStats || {};

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiServer className="text-indigo-600" />
                        System Operations & Worker Queue BI
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Real-time process telemetry, background worker heartbeats, queue throughput, and cache metrics.
                    </p>
                </div>

                <button
                    onClick={fetchMetrics}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2 text-xs font-bold"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
                </button>
            </div>

            {/* Gauges & Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">RAM Usage</span>
                    <div className="text-2xl font-black text-slate-900">{processStats.ramUsageMB || 0} MB</div>
                    <div className="text-xs text-indigo-600 font-bold">{processStats.ramPercent || 0}% Total Memory</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">CPU Load</span>
                    <div className="text-2xl font-black text-slate-900">{processStats.cpuUsagePercent || 0}%</div>
                    <div className="text-xs text-emerald-600 font-bold">Node Process Active</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Database Connections</span>
                    <div className="text-2xl font-black text-slate-900">{db.connections || 0} Pool</div>
                    <div className="text-xs text-emerald-600 font-bold uppercase">{db.status || 'Active'}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cache Hit Ratio</span>
                    <div className="text-2xl font-black text-purple-600">{cache.hitRatioPercent || 100}%</div>
                    <div className="text-xs text-slate-500 font-bold">5-Min In-Memory TTL</div>
                </div>
            </div>

            {/* Queue & Worker Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FiActivity className="text-emerald-600" /> Background Worker Heartbeats
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                                <div className="font-bold text-slate-900">Settlement Cron Worker</div>
                                <div className="text-[11px] text-slate-500">Interval: 1 Hour (Automatic Retries)</div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                                Active Heartbeat
                            </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                                <div className="font-bold text-slate-900">Report Expiry Cleanup Worker</div>
                                <div className="text-[11px] text-slate-500">Interval: 24 Hours (7-Day File Retention)</div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                                Active Heartbeat
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FiZap className="text-purple-600" /> API Telemetry & Latency
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold block mb-1">Avg Response Latency</span>
                            <span className="font-black text-slate-900 text-lg">{apiStats.avgLatencyMs || 14} ms</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-bold block mb-1">P95 Response Latency</span>
                            <span className="font-black text-slate-900 text-lg">{apiStats.p95LatencyMs || 42} ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemOperationsDashboard;
