import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiFilm, FiCheck, FiX, FiEdit, FiStar, FiEyeOff, FiArchive, FiRefreshCw, FiFilter, FiSearch, FiPlay, FiPause, FiTrash2, FiUser } from 'react-icons/fi';
import api from '../../../../shared/utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    vendor_pending: 'bg-purple-50 text-purple-700 border-purple-200',
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    hidden:   'bg-orange-50 text-orange-700 border-orange-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ActionButton = ({ onClick, icon: Icon, label, className, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm ${className}`}
    >
        <Icon size={13} /> {label}
    </button>
);

const VideoPlayer = ({ src, thumbnail }) => {
    const [playing, setPlaying] = useState(false);
    const videoRef = useRef();
    const toggle = () => {
        if (playing) { videoRef.current?.pause(); setPlaying(false); }
        else { videoRef.current?.play(); setPlaying(true); }
    };
    return (
        <div className="relative rounded-t-2xl overflow-hidden bg-slate-950 cursor-pointer" onClick={toggle}>
            <video ref={videoRef} src={src} poster={thumbnail} className="w-full aspect-[9/16] object-cover max-h-72" />
            <div className={`absolute inset-0 flex items-center justify-center transition-all ${playing ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <div className="bg-black/50 text-white rounded-full p-3 backdrop-blur-sm">
                    {playing ? <FiPause size={22} /> : <FiPlay size={22} />}
                </div>
            </div>
        </div>
    );
};

const RejectModal = ({ reel, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [type, setType] = useState('reject');
    const [loading, setLoading] = useState(false);
    const handle = async () => {
        if (reason.trim().length < 5) { toast.error('Please provide a reason (min 5 chars).'); return; }
        setLoading(true);
        await onConfirm(reel._id, type === 'reject' ? 'reject' : 'request-changes', reason);
        setLoading(false);
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900 font-bold text-lg">{type === 'reject' ? 'Reject Reel' : 'Request Changes'}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><FiX size={18} /></button>
                </div>
                <div className="flex gap-2 mb-4">
                    <button onClick={() => setType('reject')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${type === 'reject' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Reject Reel</button>
                    <button onClick={() => setType('changes')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${type === 'changes' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Request Changes</button>
                </div>
                <textarea
                    value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                    placeholder={type === 'reject' ? 'Reason for rejection...' : 'Describe the specific edits required...'}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white rounded-xl p-3 text-slate-900 placeholder-slate-400 outline-none resize-none text-xs"
                />
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all">Cancel</button>
                    <button onClick={handle} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 text-white shadow-sm ${type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                        {loading ? 'Sending…' : type === 'reject' ? 'Confirm Reject' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminReelModeration = () => {
    const [reels, setReels] = useState([]);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusCounts, setStatusCounts] = useState({});
    const [actionLoading, setActionLoading] = useState('');
    const [rejectModal, setRejectModal] = useState(null);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);

    const fetchReels = useCallback(async () => {
        setLoading(true);
        try {
            const params = { status: statusFilter || 'all', page, limit: 9 };
            if (search) params.search = search;
            const data = await api.get('/admin/reels', { params });
            setReels(data.reels || []);
            setTotal(data.total || 0);
            setStatusCounts(data.statusCounts || {});
        } catch { toast.error('Failed to load reels.'); } finally { setLoading(false); }
    }, [statusFilter, page, search]);

    useEffect(() => { fetchReels(); }, [fetchReels]);

    const doAction = async (reelId, action, payload = {}) => {
        setActionLoading(reelId + action);
        try {
            await api.patch(`/admin/reels/${reelId}/${action}`, payload);
            toast.success(`Reel ${action}d successfully.`);
            fetchReels();
        } catch {} finally { setActionLoading(''); }
    };

    const handleDeleteReel = async (reelId) => {
        setActionLoading(reelId + 'delete');
        try {
            await api.delete(`/admin/reels/${reelId}`);
            toast.success('Reel permanently deleted from database & Cloudinary.');
            setDeleteConfirmModal(null);
            fetchReels();
        } catch {
            toast.error('Failed to delete reel.');
        } finally {
            setActionLoading('');
        }
    };

    const handleRejectConfirm = async (reelId, action, reason) => {
        const key = action === 'reject' ? 'reason' : 'changes';
        await doAction(reelId, action, { [key]: reason });
    };

    const STATUS_TABS = ['pending', 'vendor_pending', 'approved', 'rejected', 'hidden', 'archived', ''];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiFilm className="text-purple-600" /> Admin Reel Moderation
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Review vendor and influencer uploaded reels, approve live feeds, or permanently delete inappropriate content</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 flex-wrap">
                {STATUS_TABS.map((s) => {
                    const count = s ? statusCounts[s] : Object.values(statusCounts).reduce((a, b) => a + b, 0);
                    const label = s === 'vendor_pending' ? 'Vendor Review' : s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Reels';
                    return (
                        <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                            {label} {count ? `(${count})` : ''}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by reel title or uploader..."
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none text-xs transition-all shadow-sm" />
            </div>

            {/* Reels Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-200" />)}
                </div>
            ) : reels.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-sm">
                    <FiFilm size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-800">No reels found for this filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {reels.map((reel) => {
                        const isInfluencerReel = reel.uploadedByModel === 'Influencer' || reel.influencerId;
                        return (
                            <div key={reel._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                                {/* Video */}
                                {reel.videoUrl && (
                                    <VideoPlayer src={reel.video?.secureUrl || reel.videoUrl} thumbnail={reel.thumbnailUrl} />
                                )}

                                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        {/* Status & Uploader Badge */}
                                        <div className="flex items-center justify-between flex-wrap gap-1">
                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[reel.status] || STATUS_COLORS.pending}`}>
                                                {reel.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            {isInfluencerReel ? (
                                                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <FiUser size={10} /> Influencer
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">Vendor</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{reel.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{reel.vendorId?.storeName || 'Vendor'}</p>
                                            {reel.productId && <p className="text-xs text-purple-600 font-semibold mt-0.5">{reel.productId.name}</p>}
                                            <p className="text-[11px] text-slate-400 mt-1">{new Date(reel.createdAt).toLocaleString()}</p>
                                        </div>

                                        {/* Rejection reason */}
                                        {reel.rejectionReason && (
                                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 font-medium line-clamp-2">{reel.rejectionReason}</p>
                                        )}

                                        {reel.caption && <p className="text-xs text-slate-500 line-clamp-2 italic">"{reel.caption}"</p>}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                        {reel.status === 'pending' && (
                                            <>
                                                <ActionButton onClick={() => doAction(reel._id, 'approve')} icon={FiCheck} label="Approve"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={actionLoading === reel._id + 'approve'} />
                                                <ActionButton onClick={() => setRejectModal(reel)} icon={FiX} label="Reject / Changes"
                                                    className="bg-red-600 hover:bg-red-700 text-white" />
                                            </>
                                        )}
                                        {reel.status === 'approved' && (
                                            <>
                                                <ActionButton onClick={() => doAction(reel._id, 'feature')} icon={FiStar}
                                                    label={reel.isFeatured ? 'Unfeature' : 'Feature'}
                                                    className="bg-amber-500 hover:bg-amber-600 text-white" disabled={actionLoading === reel._id + 'feature'} />
                                                <ActionButton onClick={() => doAction(reel._id, 'hide')} icon={FiEyeOff} label="Hide / Remove"
                                                    className="bg-orange-600 hover:bg-orange-700 text-white" disabled={actionLoading === reel._id + 'hide'} />
                                            </>
                                        )}
                                        {['hidden', 'archived'].includes(reel.status) && (
                                            <ActionButton onClick={() => doAction(reel._id, 'restore')} icon={FiRefreshCw} label="Restore"
                                                className="bg-blue-600 hover:bg-blue-700 text-white" disabled={actionLoading === reel._id + 'restore'} />
                                        )}
                                        {!['archived'].includes(reel.status) && (
                                            <ActionButton onClick={() => doAction(reel._id, 'archive')} icon={FiArchive} label="Archive"
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700" />
                                        )}

                                        {/* Hard Delete Option for Admin */}
                                        <button
                                            onClick={() => setDeleteConfirmModal(reel)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 transition-all shadow-sm ml-auto"
                                            title="Permanently Delete Reel"
                                        >
                                            <FiTrash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {total > 9 && (
                <div className="flex justify-center items-center gap-3">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm">← Prev</button>
                    <span className="text-slate-500 text-xs font-medium">Page {page} of {Math.ceil(total / 9)}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 9)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm">Next →</button>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <RejectModal reel={rejectModal} onClose={() => setRejectModal(null)} onConfirm={handleRejectConfirm} />
            )}

            {/* Hard Delete Confirmation Modal */}
            {deleteConfirmModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mb-3">
                            <FiTrash2 size={24} />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-1">Delete Reel Permanently?</h3>
                        <p className="text-slate-500 text-xs mb-4">Are you sure you want to permanently delete <span className="font-semibold text-slate-900">"{deleteConfirmModal.title}"</span>? This will erase the video from Cloudinary storage and database permanently.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all">Cancel</button>
                            <button onClick={() => handleDeleteReel(deleteConfirmModal._id)} disabled={actionLoading === deleteConfirmModal._id + 'delete'} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60">
                                {actionLoading === deleteConfirmModal._id + 'delete' ? 'Deleting…' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReelModeration;
