import { useState, useEffect } from 'react';
import { FiFileText, FiSearch, FiFilter, FiRefreshCw, FiCode } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getAuditLogs } from '../services/auditService';

const AuditDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [correlationId, setCorrelationId] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getAuditLogs({ correlationId: correlationId.trim() });
            const data = res?.data || res;
            setLogs(data.logs || []);
        } catch (err) {
            toast.error('Failed to fetch audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiFileText className="text-indigo-600" />
                        Immutable Audit Log Trail
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Read-only system audit trail tracking financial transfers, withdrawal approvals, and administrative actions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Filter by Correlation ID..."
                            value={correlationId}
                            onChange={(e) => setCorrelationId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                            className="pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    </div>

                    <button
                        onClick={fetchLogs}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="py-3 px-4 font-bold">Timestamp</th>
                                <th className="py-3 px-4 font-bold">Correlation ID</th>
                                <th className="py-3 px-4 font-bold">Actor Role</th>
                                <th className="py-3 px-4 font-bold">Action</th>
                                <th className="py-3 px-4 font-bold">Resource</th>
                                <th className="py-3 px-4 font-bold text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading audit records...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No audit logs recorded.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/60">
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{log.correlationId}</td>
                                        <td className="py-3.5 px-4 uppercase font-bold text-slate-700">{log.actorRole}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{log.action}</td>
                                        <td className="py-3.5 px-4 text-slate-600 font-mono">{log.resource}</td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 ml-auto"
                                            >
                                                <FiCode /> View Payload Diff
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payload Diff Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Audit Payload Diff</h3>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto">
                                <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">Old Value</div>
                                <pre className="font-mono text-[11px]">{JSON.stringify(selectedLog.oldValue, null, 2)}</pre>
                            </div>
                            <div className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto">
                                <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">New Value</div>
                                <pre className="font-mono text-[11px]">{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditDashboard;
