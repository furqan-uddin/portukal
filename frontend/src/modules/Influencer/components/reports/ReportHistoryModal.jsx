import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiFileText, FiRefreshCw, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getReportHistory, downloadReport } from '../../services/reportService';

const ReportHistoryModal = ({ isOpen, onClose }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await getReportHistory();
            const data = res?.data || res;
            setReports(data.reports || []);
        } catch (err) {
            toast.error('Failed to fetch report history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
                {/* Header */}
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FiFileText className="text-purple-400 w-5 h-5" />
                        <div>
                            <h2 className="font-bold text-base">Generated Reports History</h2>
                            <p className="text-xs text-slate-400">Download previously requested exports & monitor progress</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchHistory}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Refresh"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Table Body */}
                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 font-medium">Fetching export history...</div>
                    ) : reports.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">No reports generated yet.</div>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                    <th className="py-3 px-4 font-bold">Report Name</th>
                                    <th className="py-3 px-4 font-bold">Type</th>
                                    <th className="py-3 px-4 font-bold">Format</th>
                                    <th className="py-3 px-4 font-bold">Status</th>
                                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.map((rep) => (
                                    <tr key={rep._id} className="hover:bg-slate-50/60">
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            {rep.reportName}
                                            <div className="text-[10px] text-slate-400 font-normal">
                                                {new Date(rep.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 uppercase text-slate-700 font-semibold">{rep.reportType}</td>
                                        <td className="py-3.5 px-4 font-bold uppercase text-purple-700">{rep.format}</td>
                                        <td className="py-3.5 px-4">
                                            {rep.status === 'completed' ? (
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                                    <FiCheckCircle /> Ready
                                                </span>
                                            ) : rep.status === 'processing' ? (
                                                <div className="space-y-1">
                                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        Building ({rep.progress}%)
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    {rep.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {rep.status === 'completed' ? (
                                                <button
                                                    onClick={() => downloadReport(rep._id)}
                                                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 ml-auto shadow-sm"
                                                >
                                                    <FiDownload /> Download
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportHistoryModal;
