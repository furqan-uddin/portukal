import { FiGlobe, FiClock } from 'react-icons/fi';

const GeoHeatmapCard = ({ geographicBreakdown = [], hourlyClicks = [] }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Geographic BI Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FiGlobe className="text-teal-600" /> Geographic Revenue Distribution
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">By State</span>
                </div>

                <div className="space-y-3">
                    {geographicBreakdown.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No state level data available.</p>
                    ) : (
                        geographicBreakdown.map((geo, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">{geo._id}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500 font-mono text-[11px]">{geo.orders} orders</span>
                                    <span className="font-black text-emerald-700">₹{geo.revenue?.toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Hourly Activity Heatmap */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FiClock className="text-indigo-600" /> Hourly Click Heatmap (0-23h)
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">24-Hour Peak</span>
                </div>

                <div className="grid grid-cols-6 gap-2 pt-2">
                    {Array.from({ length: 24 }).map((_, hour) => {
                        const match = hourlyClicks.find((h) => h._id === hour);
                        const count = match ? match.clicks : 0;
                        const opacityClass = count > 20 ? 'bg-indigo-600 text-white' : count > 5 ? 'bg-indigo-300 text-indigo-900' : 'bg-slate-100 text-slate-500';

                        return (
                            <div key={hour} className={`p-2 rounded-xl text-center text-[10px] font-bold ${opacityClass}`}>
                                <div>{hour}h</div>
                                <div className="font-mono">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GeoHeatmapCard;
