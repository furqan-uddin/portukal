import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilm, FiUpload, FiBarChart2, FiEye, FiClock, FiCheckCircle, FiXCircle, FiArchive, FiRefreshCw, FiMoreVertical, FiExternalLink, FiCheck, FiX } from 'react-icons/fi';
import api from '../../../../shared/utils/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    vendor_pending: { label: 'Influencer Review', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: FiClock },
    draft:    { label: 'Draft',     color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FiClock },
    preview:  { label: 'Preview',   color: 'bg-blue-50 text-blue-700 border-blue-200',   icon: FiEye },
    pending:  { label: 'Admin Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
    approved: { label: 'Live',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiCheckCircle },
    rejected: { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',     icon: FiXCircle },
    archived: { label: 'Archived',  color: 'bg-gray-100 text-gray-500 border-gray-200',   icon: FiArchive },
    hidden:   { label: 'Hidden',    color: 'bg-orange-50 text-orange-700 border-orange-200', icon: FiEye },
};

const VendorReelsList = () => {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState('');
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchReels = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12, sort: '-createdAt' };
            if (statusFilter) params.status = statusFilter;
            const data = await api.get('/vendor/reels', { params });
            setReels(data.reels || []);
            setTotal(data.total || 0);
        } catch {
            toast.error('Failed to load reels.');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    const fetchOverview = useCallback(async () => {
        try {
            const data = await api.get('/vendor/reels/analytics/overview');
            setOverview(data);
        } catch {}
    }, []);

    useEffect(() => { fetchReels(); fetchOverview(); }, [fetchReels, fetchOverview]);

    const handleAction = async (reelId, action, label, payload = {}) => {
        setActionLoading(reelId + action);
        try {
            await api.patch(`/vendor/reels/${reelId}/${action}`, payload);
            toast.success(`Reel ${label} successfully.`);
            fetchReels();
        } catch {
        } finally {
            setActionLoading('');
        }
    };

    const handleRejectInfluencer = async () => {
        if (!rejectReason || rejectReason.trim().length < 5) {
            toast.error('Please provide a reason (min 5 characters).');
            return;
        }
        await handleAction(rejectModal._id, 'reject-influencer', 'rejected', { reason: rejectReason.trim() });
        setRejectModal(null);
        setRejectReason('');
    };

    const statusTabs = ['', 'vendor_pending', 'draft', 'preview', 'pending', 'approved', 'rejected', 'archived'];

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <FiFilm className="text-blue-600" /> My Shoppable Reels
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Upload and manage product videos or approve influencer submissions</p>
                </div>
                <button
                    onClick={() => navigate('/vendor/reels/upload')}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md shadow-blue-500/20"
                >
                    <FiUpload size={18} /> Upload New Reel
                </button>
            </div>

            {/* Overview Stats */}
            {overview && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Views', value: overview.analytics?.totalViews?.toLocaleString() || '0', bg: 'bg-blue-50/70 border-blue-100 text-blue-900', labelColor: 'text-blue-600' },
                        { label: 'Product Clicks', value: overview.analytics?.productClicks?.toLocaleString() || '0', bg: 'bg-purple-50/70 border-purple-100 text-purple-900', labelColor: 'text-purple-600' },
                        { label: 'Orders Made', value: overview.analytics?.orders?.toLocaleString() || '0', bg: 'bg-emerald-50/70 border-emerald-100 text-emerald-900', labelColor: 'text-emerald-600' },
                        { label: 'Total Revenue', value: `₹${(overview.analytics?.revenue || 0).toLocaleString()}`, bg: 'bg-amber-50/70 border-amber-100 text-amber-900', labelColor: 'text-amber-600' },
                    ].map((stat) => (
                        <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} shadow-sm`}>
                            <p className={`text-xs font-semibold ${stat.labelColor}`}>{stat.label}</p>
                            <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100/80 shadow-sm flex gap-2 flex-wrap">
                {statusTabs.map((s) => (
                    <button
                        key={s || 'all'}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === s
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {s ? STATUS_CONFIG[s]?.label : 'All Reels'}
                        {s && overview?.statusCounts?.[s] ? ` (${overview.statusCounts[s]})` : ''}
                    </button>
                ))}
            </div>

            {/* Reels Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
                    ))}
                </div>
            ) : reels.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100/80 p-12 text-center text-gray-500 shadow-sm">
                    <FiFilm size={54} className="mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No reels found</h3>
                    <p className="text-sm text-gray-500 mb-6">Upload your first product video to engage customers across the marketplace.</p>
                    <button
                        onClick={() => navigate('/vendor/reels/upload')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
                    >
                        Upload First Reel
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {reels.map((reel) => {
                        const statusCfg = STATUS_CONFIG[reel.status] || STATUS_CONFIG.draft;
                        const StatusIcon = statusCfg.icon;
                        const isInfluencerReel = reel.uploadedByModel === 'Influencer';

                        return (
                            <div key={reel._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
                                {/* Thumbnail */}
                                <div className="relative aspect-[9/16] bg-slate-950 max-h-48 overflow-hidden">
                                    {reel.thumbnailUrl ? (
                                        <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FiFilm size={32} className="text-slate-600" />
                                        </div>
                                    )}
                                    {/* Status badge */}
                                    <span className={`absolute top-2 left-2 flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.color}`}>
                                        <StatusIcon size={11} /> {statusCfg.label}
                                    </span>
                                    {isInfluencerReel && (
                                        <span className="absolute top-2 right-2 text-[10px] bg-purple-600 text-white font-extrabold px-2 py-0.5 rounded-full">⭐ Influencer Reel</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{reel.title}</h3>
                                        {reel.productId && (
                                            <p className="text-xs text-blue-600 font-medium line-clamp-1 mt-0.5">{reel.productId.name}</p>
                                        )}
                                        
                                        {/* Real-time Views & Clicks Stats Badge */}
                                        <div className="flex items-center justify-between text-xs font-bold bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 mt-2.5">
                                            <span className="flex items-center gap-1.5 text-blue-600">
                                                <FiEye size={13} /> {(reel.viewsCount || 0).toLocaleString()} Views
                                            </span>
                                            <span className="flex items-center gap-1.5 text-purple-600">
                                                <FiBarChart2 size={13} /> {(reel.clicksCount || 0).toLocaleString()} Clicks
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-gray-400 mt-2">{new Date(reel.createdAt).toLocaleDateString()}</p>

                                        {/* Rejection reason */}
                                        {reel.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-2 line-clamp-2 bg-red-50 border border-red-100 rounded-lg p-2 font-medium">{reel.rejectionReason}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                                        {reel.status === 'vendor_pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(reel._id, 'approve-influencer', 'approved for admin review')}
                                                    disabled={actionLoading === reel._id + 'approve-influencer'}
                                                    className="flex-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                                                ><FiCheck size={14} /> Approve</button>
                                                <button
                                                    onClick={() => setRejectModal(reel)}
                                                    className="flex-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                                                ><FiX size={14} /> Reject</button>
                                            </>
                                        )}
                                        {reel.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(reel._id, 'preview', 'moved to preview')}
                                                    disabled={actionLoading === reel._id + 'preview'}
                                                    className="flex-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-xl transition-all"
                                                >Preview</button>
                                                <button
                                                    onClick={() => handleAction(reel._id, 'submit', 'submitted for review')}
                                                    disabled={actionLoading === reel._id + 'submit'}
                                                    className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-all shadow-sm"
                                                >Submit</button>
                                            </>
                                        )}
                                        {reel.status === 'preview' && (
                                            <button
                                                onClick={() => handleAction(reel._id, 'submit', 'submitted for review')}
                                                disabled={actionLoading === reel._id + 'submit'}
                                                className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-all shadow-sm"
                                            >Submit for Review</button>
                                        )}
                                        {reel.status === 'rejected' && !isInfluencerReel && (
                                            <button
                                                onClick={() => navigate(`/vendor/reels/upload?edit=${reel._id}`)}
                                                className="flex-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl transition-all shadow-sm"
                                            >Edit &amp; Resubmit</button>
                                        )}
                                        {reel.status === 'approved' && (
                                            <button
                                                onClick={() => navigate(`/vendor/reels/${reel._id}/analytics`)}
                                                className="flex-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm"
                                            ><FiBarChart2 size={13} /> Analytics</button>
                                        )}
                                        {!['archived'].includes(reel.status) && (
                                            <button
                                                onClick={() => handleAction(reel._id, 'delete', 'archived')}
                                                className="text-xs bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 p-2 rounded-xl transition-all"
                                                title="Archive Reel"
                                            ><FiArchive size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {total > 12 && (
                <div className="flex justify-center items-center gap-3">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold transition-all shadow-sm">Previous</button>
                    <span className="text-gray-500 text-xs font-medium">Page {page} of {Math.ceil(total / 12)}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold transition-all shadow-sm">Next</button>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Reject Influencer Reel</h3>
                        <p className="text-xs text-gray-500 mb-4">Please specify why you are rejecting this influencer reel for <span className="font-semibold text-gray-800">{rejectModal.title}</span>:</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            placeholder="Reason for rejection (sent to influencer)..."
                            className="w-full bg-gray-50 border border-gray-200 focus:border-red-500 focus:bg-white rounded-xl p-3 text-xs text-gray-900 outline-none resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                            <button onClick={handleRejectInfluencer} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-semibold shadow-sm">Reject Reel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorReelsList;
