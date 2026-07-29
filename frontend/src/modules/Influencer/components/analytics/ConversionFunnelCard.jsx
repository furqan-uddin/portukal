import { FiFilter, FiCheckCircle } from 'react-icons/fi';

const ConversionFunnelCard = ({ stages = [] }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FiFilter className="text-purple-600" /> Full Attribution Conversion Funnel
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Stage-by-stage progression from initial click to settled creator commission.
                    </p>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                {stages.map((st, idx) => {
                    const widthPercent = Math.max(12, st.percent || 0);

                    return (
                        <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-700 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    {st.stage}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-900 font-mono">{st.count?.toLocaleString()}</span>
                                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                        {st.percent}%
                                    </span>
                                </div>
                            </div>

                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${widthPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConversionFunnelCard;
