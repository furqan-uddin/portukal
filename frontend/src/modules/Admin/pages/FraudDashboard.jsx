import { useState, useEffect } from 'react';
import {
    FiShield,
    FiAlertTriangle,
    FiCheckCircle,
    FiUserX,
    FiSliders,
    FiEye,
    FiRefreshCw,
    FiFilter,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getFraudRules, updateFraudRule, getFraudCases, updateFraudCase } from '../services/fraudService';

const FraudDashboard = () => {
    const [cases, setCases] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, rRes] = await Promise.all([getFraudCases(), getFraudRules()]);
            setCases(cRes?.data?.cases || cRes?.cases || []);
            setRules(rRes?.data || rRes || []);
        } catch (err) {
            toast.error('Failed to fetch fraud detection metrics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (caseId, status) => {
        try {
            await updateFraudCase(caseId, { status, actionTaken: `Status set to ${status}` });
            toast.success(`Fraud case status set to ${status}.`);
            fetchData();
            if (selectedCase?._id === caseId) setSelectedCase(null);
        } catch (err) {
            toast.error('Failed to update case status.');
        }
    };

    const handleToggleRule = async (rule) => {
        try {
            await updateFraudRule(rule._id, { enabled: !rule.enabled });
            toast.success(`Rule "${rule.name}" ${!rule.enabled ? 'enabled' : 'disabled'}.`);
            fetchData();
        } catch (err) {
            toast.error('Failed to update rule.');
        }
    };

    const getLevelBadge = (level) => {
        if (level === 'critical') return 'bg-rose-600 text-white font-black';
        if (level === 'high') return 'bg-amber-500 text-white font-bold';
        if (level === 'medium') return 'bg-indigo-600 text-white font-medium';
        return 'bg-slate-200 text-slate-700 font-medium';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiShield className="text-rose-600" />
                        Fraud Detection & Risk Rule Engine
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Automated risk scoring, self-referral detection, velocity abuse checks, and investigation workflows.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsRulesModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                        <FiSliders /> Rule Config
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Cases Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
                <h3 className="font-bold text-slate-900 text-sm">Recorded Suspicious Activity Cases</h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="py-3 px-4 font-bold">Creator</th>
                                <th className="py-3 px-4 font-bold">Risk Type</th>
                                <th className="py-3 px-4 font-bold">Risk Score</th>
                                <th className="py-3 px-4 font-bold">Level</th>
                                <th className="py-3 px-4 font-bold">Status</th>
                                <th className="py-3 px-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cases.length === 0 ? (
                                <tr><td colSpan={6} className="py-6 text-center text-slate-400">No suspicious fraud cases recorded.</td></tr>
                            ) : (
                                cases.map((c) => (
                                    <tr key={c._id} className="hover:bg-slate-50/60">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.influencerId?.name || 'Creator'}</td>
                                        <td className="py-3.5 px-4 font-medium text-slate-700">{c.fraudType}</td>
                                        <td className="py-3.5 px-4 font-black text-rose-600">{c.fraudScore} / 100</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getLevelBadge(c.fraudLevel)}`}>
                                                {c.fraudLevel}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-500">{c.status}</td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            <button
                                                onClick={() => setSelectedCase(c)}
                                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                                            >
                                                Inspect
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(c._id, 'safe')}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
                                            >
                                                Mark Safe
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(c._id, 'blocked')}
                                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px]"
                                            >
                                                Block
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Case Inspection Drawer / Modal */}
            {selectedCase && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Fraud Score Breakdown</h3>
                            <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Case ID:</span>
                                <span className="font-mono font-bold text-slate-900">{selectedCase._id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Fraud Score:</span>
                                <span className="font-black text-rose-600 text-sm">{selectedCase.fraudScore}</span>
                            </div>

                            <div className="border-t border-slate-100 pt-3 space-y-2">
                                <span className="font-bold text-slate-900">Score Breakdown:</span>
                                {selectedCase.breakdown?.map((b, idx) => (
                                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between border border-slate-200">
                                        <div>
                                            <div className="font-bold text-slate-800">{b.rule}</div>
                                            <div className="text-[11px] text-slate-500">{b.reason}</div>
                                        </div>
                                        <span className="font-black text-rose-600">+{b.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Configurable Rules Modal */}
            {isRulesModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Configurable Fraud Rules</h3>
                            <button onClick={() => setIsRulesModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <div className="space-y-3">
                            {rules.map((rule) => (
                                <div key={rule._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-slate-900 text-xs">{rule.name}</div>
                                        <div className="text-[11px] text-slate-500">{rule.description}</div>
                                        <div className="text-[10px] text-purple-700 font-semibold mt-1">Weight: +{rule.weight} points | Action: {rule.action}</div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleRule(rule)}
                                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                                            rule.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {rule.enabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FraudDashboard;
