import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const KPICard = ({ title, value, prefix = '', suffix = '', trendData, icon: Icon, color = 'emerald', subtext }) => {
    const { percent = 0, trend = 'neutral', previousValue } = trendData || {};

    const isUp = trend === 'up';
    const isDown = trend === 'down';

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
                {Icon && (
                    <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div>
                <div className="text-2xl font-black text-slate-900">
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                </div>

                {trendData && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold">
                        <span
                            className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                isUp
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isDown
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {isUp && <FiTrendingUp className="w-3 h-3" />}
                            {isDown && <FiTrendingDown className="w-3 h-3" />}
                            {!isUp && !isDown && <FiMinus className="w-3 h-3" />}
                            <span>{percent > 0 ? `+${percent}%` : `${percent}%`}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">vs prev period ({prefix}{previousValue?.toLocaleString()})</span>
                    </div>
                )}
            </div>

            {subtext && <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">{subtext}</p>}
        </div>
    );
};

export default KPICard;
