import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiSend, FiShoppingBag, FiPercent, FiMessageSquare, FiCheckCircle, FiClock, FiXCircle, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const VendorInfluencerInvite = () => {
    const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'sent' | 'received'
    const [influencers, setInfluencers] = useState([]);
    const [products, setProducts] = useState([]);
    const [sentInvitations, setSentInvitations] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    // Modal state
    const [inviteModal, setInviteModal] = useState(null); // target influencer
    const [selectedProduct, setSelectedProduct] = useState('');
    const [commissionPercent, setCommissionPercent] = useState('15');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchInfluencers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/vendor/influencers/list', { params: { search } });
            setInfluencers(data.influencers || []);
        } catch {
            toast.error('Failed to load influencers.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    const fetchVendorProducts = useCallback(async () => {
        try {
            const data = await api.get('/vendor/products');
            setProducts(data.products || data || []);
        } catch {}
    }, []);

    const fetchSentInvitations = useCallback(async () => {
        try {
            const data = await api.get('/vendor/influencers/invitations');
            const all = data.invitations || [];
            setSentInvitations(all.filter((i) => i.initiatorModel !== 'Influencer'));
            setReceivedRequests(all.filter((i) => i.initiatorModel === 'Influencer'));
        } catch {}
    }, []);

    useEffect(() => {
        if (activeTab === 'browse') fetchInfluencers();
        fetchSentInvitations();
        fetchVendorProducts();
    }, [activeTab, fetchInfluencers, fetchSentInvitations, fetchVendorProducts]);

    const handleSendInvitation = async () => {
        if (!selectedProduct) {
            toast.error('Please select a product to promote.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/vendor/influencers/invite', {
                influencerId: inviteModal._id,
                productId: selectedProduct,
                offeredCommissionPercent: Number(commissionPercent) || 10,
                message: message.trim(),
            });
            toast.success(`Invitation sent to ${inviteModal.name}!`);
            setInviteModal(null);
            setSelectedProduct('');
            setMessage('');
            fetchSentInvitations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send invitation.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRespondToRequest = async (requestId, action) => {
        setActionLoading(requestId + action);
        try {
            await api.patch(`/vendor/influencers/requests/${requestId}/respond`, { action });
            toast.success(`Request ${action === 'accept' ? 'approved' : 'declined'} successfully.`);
            fetchSentInvitations();
        } catch {
            toast.error('Failed to update request.');
        } finally {
            setActionLoading('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiUsers className="text-purple-600" /> Influencer Product Collaborations
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Invite creators to promote your products or review pitches sent by influencers</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'browse' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Browse Influencers
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'sent' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Sent Invites ({sentInvitations.length})
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'received' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Received Influencer Pitches ({receivedRequests.length})
                </button>
            </div>

            {activeTab === 'browse' && (
                <>
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search influencer name, bio, or category..."
                            className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none text-xs shadow-sm"
                        />
                    </div>

                    {/* Influencers List */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-200" />
                            ))}
                        </div>
                    ) : influencers.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-sm">
                            <FiUsers size={48} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-800">No influencers found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {influencers.map((inf) => (
                                <div key={inf._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-100 overflow-hidden shrink-0 border border-purple-200">
                                            {inf.profileImage ? (
                                                <img src={inf.profileImage} alt={inf.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-purple-700 font-bold text-xl">
                                                    {inf.name?.charAt(0) || 'I'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{inf.name}</h3>
                                            <p className="text-xs text-purple-600 font-semibold">@{inf.slug || 'influencer'}</p>
                                            <span className="inline-block mt-1 text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                                                {inf.category || 'General Creator'}
                                            </span>
                                        </div>
                                    </div>

                                    {inf.bio && <p className="text-xs text-slate-500 line-clamp-2 mt-3 italic">"{inf.bio}"</p>}

                                    <button
                                        onClick={() => setInviteModal(inf)}
                                        className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <FiSend size={14} /> Request Product Promotion
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'sent' && (
                <div className="space-y-4">
                    {sentInvitations.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-sm">
                            <FiSend size={48} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-800">No promotion requests sent yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-sm">
                            {sentInvitations.map((inv) => (
                                <div key={inv._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center font-bold text-purple-700 shrink-0">
                                            {inv.influencerId?.name?.charAt(0) || 'I'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{inv.influencerId?.name} (@{inv.influencerId?.slug})</p>
                                            <p className="text-xs text-slate-500">Product: <span className="font-semibold text-slate-800">{inv.productId?.name}</span> • Offered: <span className="text-emerald-600 font-bold">{inv.offeredCommissionPercent}% Commission</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {inv.status === 'pending' && <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200"><FiClock size={12} /> Pending Response</span>}
                                        {inv.status === 'accepted' && <span className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200"><FiCheckCircle size={12} /> Accepted &amp; Active</span>}
                                        {inv.status === 'declined' && <span className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200"><FiXCircle size={12} /> Declined</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'received' && (
                <div className="space-y-4">
                    {receivedRequests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-sm">
                            <FiMessageSquare size={48} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-800">No influencer pitches received yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Influencers can request to promote specific products from your catalog.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-sm">
                            {receivedRequests.map((inv) => (
                                <div key={inv._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-sm">{inv.influencerId?.name || 'Influencer'} (@{inv.influencerId?.slug})</span>
                                            <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full">
                                                Requested {inv.offeredCommissionPercent}% Commission
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 font-semibold mt-0.5">Product Requested: {inv.productId?.name}</p>
                                        {inv.message && <p className="text-xs text-slate-500 italic mt-1 font-normal">"{inv.message}"</p>}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {inv.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleRespondToRequest(inv._id, 'accept')}
                                                    disabled={actionLoading === inv._id + 'accept'}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                                >
                                                    <FiCheck size={14} /> Approve Request
                                                </button>
                                                <button
                                                    onClick={() => handleRespondToRequest(inv._id, 'decline')}
                                                    disabled={actionLoading === inv._id + 'decline'}
                                                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                                >
                                                    <FiX size={14} /> Decline
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {inv.status.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Send Invitation Modal */}
            {inviteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Invite {inviteModal.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">Request this influencer to create a shoppable reel review for one of your products.</p>

                        <div className="space-y-4">
                            {/* Product Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                                >
                                    <option value="">-- Select Product from Store --</option>
                                    {products.map((p) => (
                                        <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Offered Commission */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Offered Bonus Commission %</label>
                                <input
                                    type="number"
                                    value={commissionPercent}
                                    onChange={(e) => setCommissionPercent(e.target.value)}
                                    placeholder="15"
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                                />
                            </div>

                            {/* Requirements Message */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Requirements / Message for Creator</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. Hi! Please create an unboxing and styling video reel for this outfit..."
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setInviteModal(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendInvitation}
                                disabled={submitting}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                            >
                                {submitting ? 'Sending...' : 'Send Promotion Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorInfluencerInvite;
