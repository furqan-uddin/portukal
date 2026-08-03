import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiSend, FiShoppingBag, FiPercent, FiMessageSquare, FiCheckCircle, FiClock, FiXCircle, FiSearch, FiCheck, FiX, FiFilm, FiEye, FiPlay, FiHeart, FiEye as FiViews } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const SAMPLE_REELS = [
    {
        id: 'r1',
        title: 'Summer Fashion Styling & OOTD Review ✨',
        views: '2.4K',
        likes: '342',
        videoUrl: 'https://cdn.pixabay.com/video/2025/03/25/267242_large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'r2',
        title: 'Trendy Ethnic Outfit Haul & Try-On 🛍️',
        views: '1.8K',
        likes: '219',
        videoUrl: 'https://cdn.pixabay.com/video/2025/03/25/267241_large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'r3',
        title: 'Luxury Accessories & Watch Unboxing ⌚',
        views: '3.1K',
        likes: '512',
        videoUrl: 'https://cdn.pixabay.com/video/2024/03/29/206029_large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'r4',
        title: 'Streetwear Styling Hacks for Autumn 🍂',
        views: '1.4K',
        likes: '188',
        videoUrl: 'https://cdn.pixabay.com/video/2024/05/06/210846_large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'r5',
        title: 'Shoppable Footwear & Sneakers Showcase 👟',
        views: '4.2K',
        likes: '740',
        videoUrl: 'https://cdn.pixabay.com/video/2023/03/07/153579-805688725_large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'r6',
        title: 'Minimalist Festive Wear Lookbook ✨',
        views: '2.9K',
        likes: '410',
        videoUrl: 'https://cdn.pixabay.com/video/2025/03/25/267242_large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80'
    }
];

const VendorInfluencerInvite = () => {
    const navigate = useNavigate();
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
    const [viewProfileModal, setViewProfileModal] = useState(null); // profile preview modal
    const [modalReels, setModalReels] = useState([]); // real reels for profile modal
    const [loadingModalReels, setLoadingModalReels] = useState(false);
    const [activeReelModal, setActiveReelModal] = useState(null); // active reel video modal
    const [selectedProduct, setSelectedProduct] = useState('');
    const [commissionPercent, setCommissionPercent] = useState('15');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch real reels when profile modal opens
    useEffect(() => {
        if (!viewProfileModal) {
            setModalReels([]);
            return;
        }
        let isMounted = true;
        const fetchModalReels = async () => {
            setLoadingModalReels(true);
            try {
                const data = await api.get('/reels/feed', { params: { limit: 12, influencerId: viewProfileModal._id } });
                const list = data.reels || data.data?.reels || [];
                if (isMounted) setModalReels(list);
            } catch {
                if (isMounted) setModalReels([]);
            } finally {
                if (isMounted) setLoadingModalReels(false);
            }
        };
        fetchModalReels();
        return () => { isMounted = false; };
    }, [viewProfileModal]);

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
                                <div key={inf._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                                    <div className="flex items-start gap-3.5 cursor-pointer" onClick={() => setViewProfileModal(inf)}>
                                        <div className="w-14 h-14 rounded-2xl bg-purple-100 overflow-hidden shrink-0 border border-purple-200 group-hover:scale-105 transition-transform">
                                            {inf.profileImage ? (
                                                <img src={inf.profileImage} alt={inf.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-purple-700 font-bold text-xl">
                                                    {inf.name?.charAt(0) || 'I'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-purple-600 transition-colors">{inf.name}</h3>
                                            <p className="text-xs text-purple-600 font-semibold">@{inf.slug || 'influencer'}</p>
                                            <span className="inline-block mt-1 text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                                                {inf.category || 'General Creator'}
                                            </span>
                                        </div>
                                    </div>

                                    {inf.bio && <p className="text-xs text-slate-500 line-clamp-2 mt-3 italic cursor-pointer" onClick={() => setViewProfileModal(inf)}>"{inf.bio}"</p>}

                                    <div className="flex items-center gap-2 mt-4">
                                        <button
                                            onClick={() => setViewProfileModal(inf)}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                                            title="View Influencer Profile"
                                        >
                                            <FiEye size={14} /> Profile
                                        </button>
                                        <button
                                            onClick={() => navigate(`/vendor/creator-collaborations?influencer=${inf._id || inf.slug}`)}
                                            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                                            title="Message / Chat with Influencer"
                                        >
                                            <FiMessageSquare size={14} /> Chat
                                        </button>
                                        <button
                                            onClick={() => setInviteModal(inf)}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            <FiSend size={13} /> Invite
                                        </button>
                                    </div>
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
            {/* View Influencer Profile Modal (Vendor Side) */}
            {viewProfileModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[88vh] flex flex-col my-auto">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Influencer Profile Preview</span>
                            </div>
                            <button 
                                onClick={() => setViewProfileModal(null)}
                                className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Profile Content Body (Scrollable) */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {/* Profile Info Header */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
                                <div className="w-24 h-24 rounded-full bg-purple-100 border-2 border-purple-300 overflow-hidden shrink-0 shadow-md">
                                    {viewProfileModal.profileImage ? (
                                        <img src={viewProfileModal.profileImage} alt={viewProfileModal.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold">
                                            {viewProfileModal.name?.charAt(0) || 'I'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <h2 className="text-xl font-bold text-slate-900">{viewProfileModal.name}</h2>
                                        <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                            Verified Creator
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-purple-600">@{viewProfileModal.slug || 'creator'}</p>
                                    <span className="inline-block text-[11px] font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                                        ✨ {viewProfileModal.category || 'General Creator'}
                                    </span>
                                    <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                                        {viewProfileModal.bio || 'Official Creator & Brand Ambassador on Porutkal Marketplace ✨'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center justify-around py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-center">
                                    <span className="block font-black text-base text-slate-900">{modalReels.length > 0 ? modalReels.length : 12}</span>
                                    <span className="text-[11px] font-medium text-slate-500">Reels</span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="text-center">
                                    <span className="block font-black text-base text-slate-900">{viewProfileModal.followersCount || '10.5K'}</span>
                                    <span className="text-[11px] font-medium text-slate-500">Followers</span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div className="text-center">
                                    <span className="block font-black text-base text-slate-900">482</span>
                                    <span className="text-[11px] font-medium text-slate-500">Following</span>
                                </div>
                            </div>

                            {/* Action Buttons: Message & Request Promotion */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => {
                                        const infId = viewProfileModal._id || viewProfileModal.slug;
                                        setViewProfileModal(null);
                                        navigate(`/vendor/creator-collaborations?influencer=${infId}`);
                                    }}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                >
                                    <FiMessageSquare size={16} /> Send Direct Message 💬
                                </button>
                                <button
                                    onClick={() => {
                                        const inf = viewProfileModal;
                                        setViewProfileModal(null);
                                        setInviteModal(inf);
                                    }}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-slate-200"
                                >
                                    <FiSend size={15} /> Request Promotion
                                </button>
                            </div>

                            {/* Reels Section Header & Grid */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-2">
                                        <FiFilm size={16} className="text-purple-600" />
                                        <span>Creator Reels Feed ({(modalReels.length > 0 ? modalReels : SAMPLE_REELS).length})</span>
                                    </span>
                                    <span className="text-[10px] text-purple-600 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full">
                                        Click reel to watch 🎬
                                    </span>
                                </div>

                                {loadingModalReels ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div key={i} className="aspect-[9/16] bg-slate-100 animate-pulse rounded-xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {(modalReels.length > 0 ? modalReels : SAMPLE_REELS).map((reel, idx) => {
                                            const thumb = reel.thumbnailUrl || reel.thumbnail || reel.video?.thumbnailUrl || reel.image || `https://picsum.photos/seed/reel-${idx + 50}/300/533`;
                                            const videoSrc = reel.video?.secureUrl || reel.videoUrl || 'https://cdn.pixabay.com/video/2025/03/25/267242_large.mp4';
                                            const titleStr = reel.title || reel.caption || 'Shoppable Reel Review';
                                            const viewsStr = reel.viewsCount ? `${reel.viewsCount} views` : (reel.views || '1.4K');

                                            return (
                                                <div 
                                                    key={reel._id || reel.id || idx} 
                                                    onClick={() => setActiveReelModal({
                                                        title: titleStr,
                                                        videoUrl: videoSrc,
                                                        views: viewsStr,
                                                        likes: reel.likesCount || reel.likes || '342',
                                                        creatorName: viewProfileModal.name,
                                                        creatorAvatar: viewProfileModal.profileImage
                                                    })}
                                                    className="aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden relative group cursor-pointer border border-slate-800 hover:border-purple-500 transition-all shadow-sm"
                                                >
                                                    <img 
                                                        src={thumb} 
                                                        alt={titleStr} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { e.target.src = `https://picsum.photos/seed/reel-${idx + 88}/300/533`; }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                            <FiPlay size={18} className="ml-0.5 fill-white" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2">
                                                        <span className="text-white text-[10px] font-extrabold flex items-center gap-1 drop-shadow">
                                                            <FiFilm size={11} /> {viewsStr}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Reel Player Popup Modal */}
            {activeReelModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="relative w-full max-w-sm aspect-[9/16] max-h-[85vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
                        {/* Video Player Header overlay */}
                        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-purple-600 overflow-hidden border border-white/40 font-bold flex items-center justify-center text-sm">
                                    {activeReelModal.creatorAvatar ? (
                                        <img src={activeReelModal.creatorAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        activeReelModal.creatorName?.charAt(0) || 'C'
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs leading-none">{activeReelModal.creatorName || 'Creator'}</h4>
                                    <span className="text-[10px] text-purple-300 font-semibold">{activeReelModal.views} views</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveReelModal(null)}
                                className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Video Element */}
                        <video
                            src={activeReelModal.videoUrl}
                            autoPlay
                            loop
                            controls
                            className="w-full h-full object-cover"
                        />

                        {/* Video Caption Bottom overlay */}
                        <div className="absolute bottom-12 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 text-white space-y-1 pointer-events-none">
                            <p className="text-xs font-bold leading-snug drop-shadow">{activeReelModal.title}</p>
                            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1"><FiHeart size={13} className="text-red-500 fill-red-500" /> {activeReelModal.likes}</span>
                                <span className="flex items-center gap-1"><FiFilm size={13} className="text-purple-400" /> {activeReelModal.views}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorInfluencerInvite;
