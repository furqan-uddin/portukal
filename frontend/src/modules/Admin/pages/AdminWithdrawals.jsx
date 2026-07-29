import { useState, useEffect } from 'react';
import {
    FiDollarSign,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiDownload,
    FiPlay,
    FiSearch,
    FiFilter,
    FiCheckSquare,
    FiCheck,
    FiX,
    FiSend,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
    getAdminWithdrawalRequests,
    updateAdminWithdrawalStatus,
    bulkUpdateAdminWithdrawals,
    triggerAdminSettlementRun,
    exportAdminWithdrawalsCSV,
} from '../../Influencer/services/influencerWalletService';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

    // Selection & Bulk State
    const [selectedIds, setSelectedIds] = useState([]);
    const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject'|'paid'|'settlement', withdrawalId?: string }
    const [remarks, setRemarks] = useState('');
    const [bankTransactionId, setBankTransactionId] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 15,
                status: statusFilter,
            };
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const res = await getAdminWithdrawalRequests(params);
            const data = res?.data || res;
            setWithdrawals(data.withdrawals || []);
            if (data.stats) setStats(data.stats);
            if (data.pagination) setPagination(data.pagination);
        } catch (err) {
            toast.error('Failed to fetch withdrawal requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, pagination.page]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(withdrawals.map((w) => w._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSingleStatusUpdate = (id, targetStatus) => {
        setActionModal({ type: targetStatus, withdrawalId: id });
    };

    const handleConfirmModalAction = async () => {
        if (!actionModal) return;
        setProcessingAction(true);

        try {
            if (actionModal.type === 'settlement') {
                const res = await triggerAdminSettlementRun();
                toast.success('Manual Settlement Engine batch triggered successfully!');
            } else if (actionModal.withdrawalId) {
                await updateAdminWithdrawalStatus(actionModal.withdrawalId, {
                    status: actionModal.type,
                    remarks,
                    bankTransactionId,
                });
                toast.success(`Withdrawal request marked as ${actionModal.type}!`);
            } else if (selectedIds.length > 0) {
                await bulkUpdateAdminWithdrawals({
                    ids: selectedIds,
                    status: actionModal.type,
                    remarks,
                });
                toast.success(`Bulk updated ${selectedIds.length} withdrawals to ${actionModal.type}!`);
                setSelectedIds([]);
            }

            setActionModal(null);
            setRemarks('');
            setBankTransactionId('');
            fetchData();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed.');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const blob = await exportAdminWithdrawalsCSV();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'influencer_withdrawals.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Withdrawals CSV exported successfully!');
        } catch (err) {
            toast.error('Failed to export CSV.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiDollarSign className="text-purple-600" />
                        Influencer Withdrawal & Settlement Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review payout requests, approve/reject withdrawals, record transaction IDs, and trigger manual settlements.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActionModal({ type: 'settlement' })}
                        className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-2 transition-all"
                    >
                        <FiPlay className="w-4 h-4" /> Trigger Settlement Run
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
                    >
                        <FiDownload className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold uppercase text-slate-500 block">Pending Payout Amount</span>
                    <div className="text-2xl font-black text-amber-600">₹{(stats.pendingAmount || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-amber-700 font-bold block">{stats.pendingCount || 0} requests pending</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold uppercase text-slate-500 block">Approved Payouts</span>
                    <div className="text-2xl font-black text-indigo-600">₹{(stats.approvedAmount || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-indigo-700 font-bold block">{stats.approvedCount || 0} approved for payment</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold uppercase text-slate-500 block">Total Paid Out</span>
                    <div className="text-2xl font-black text-emerald-600">₹{(stats.paidAmount || 0).toLocaleString()}</div>
                    <span className="text-[11px] text-emerald-700 font-bold block">{stats.paidCount || 0} completed payouts</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold uppercase text-slate-500 block">Rejected Requests</span>
                    <div className="text-2xl font-black text-rose-600">{stats.rejectedCount || 0}</div>
                    <span className="text-[11px] text-rose-700 font-bold block">Refunded to available balance</span>
                </div>
            </div>

            {/* Filter Bar & Bulk Actions */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                    {['all', 'pending', 'approved', 'paid', 'rejected'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                                statusFilter === st
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>

                {/* Bulk Actions if Selected */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-xl border border-purple-200">
                        <span className="text-xs font-bold text-purple-900 px-2">{selectedIds.length} Selected</span>
                        <button
                            onClick={() => setActionModal({ type: 'approved' })}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
                        >
                            Bulk Approve
                        </button>
                        <button
                            onClick={() => setActionModal({ type: 'paid' })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                        >
                            Bulk Mark Paid
                        </button>
                        <button
                            onClick={() => setActionModal({ type: 'rejected' })}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                        >
                            Bulk Reject
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                                <th className="py-4 px-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length > 0 && selectedIds.length === withdrawals.length}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                                <th className="py-4 px-4 font-bold">Influencer</th>
                                <th className="py-4 px-4 font-bold text-right">Requested Amount</th>
                                <th className="py-4 px-4 font-bold">Payment Details</th>
                                <th className="py-4 px-4 font-bold text-center">Status</th>
                                <th className="py-4 px-4 font-bold">Requested At</th>
                                <th className="py-4 px-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading withdrawal requests...</td></tr>
                            ) : withdrawals.length === 0 ? (
                                <tr><td colSpan={7} className="py-8 text-center text-slate-500 font-medium">No withdrawal requests found matching criteria.</td></tr>
                            ) : (
                                withdrawals.map((w) => {
                                    const inf = w.influencerId || {};
                                    const isSelected = selectedIds.includes(w._id);

                                    return (
                                        <tr key={w._id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50/40' : ''}`}>
                                            <td className="py-4 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(w._id)}
                                                    className="rounded border-slate-300"
                                                />
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                                                        {inf.name ? inf.name.charAt(0) : 'I'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-xs">{inf.name || 'Influencer'}</h4>
                                                        <span className="text-[10px] text-purple-600 font-mono">@{inf.referralCode}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                                                ₹{w.amount?.toLocaleString()}
                                            </td>

                                            <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                                                {w.upiId ? (
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">UPI: {w.upiId}</span>
                                                ) : (
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        A/C: {w.bankDetails?.accountNumber} ({w.bankDetails?.ifsc})
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                    w.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                                    w.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                    w.status === 'approved' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4 text-slate-500 text-xs">{new Date(w.requestedAt).toLocaleString()}</td>

                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {w.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleSingleStatusUpdate(w._id, 'approved')}
                                                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}

                                                    {['pending', 'approved'].includes(w.status) && (
                                                        <button
                                                            onClick={() => handleSingleStatusUpdate(w._id, 'paid')}
                                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}

                                                    {['pending', 'approved'].includes(w.status) && (
                                                        <button
                                                            onClick={() => handleSingleStatusUpdate(w._id, 'rejected')}
                                                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Modal */}
            {actionModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base capitalize">
                                Confirm Action: {actionModal.type}
                            </h3>
                            <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {actionModal.type === 'paid' && (
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Bank Transaction Reference / UTR</label>
                                <input
                                    type="text"
                                    placeholder="e.g. UTR9823471092384"
                                    value={bankTransactionId}
                                    onChange={(e) => setBankTransactionId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                                />
                            </div>
                        )}

                        {actionModal.type !== 'settlement' && (
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Remarks / Audit Note</label>
                                <textarea
                                    placeholder="Enter optional remark or rejection reason..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={3}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50"
                                />
                            </div>
                        )}

                        {actionModal.type === 'settlement' && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                                This will execute the <strong>Settlement Engine Batch Process</strong> to automatically release commission for all eligible delivered orders past the 7-day return window.
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setActionModal(null)}
                                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmModalAction}
                                disabled={processingAction}
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 disabled:opacity-50"
                            >
                                {processingAction ? 'Processing...' : 'Confirm Action'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
