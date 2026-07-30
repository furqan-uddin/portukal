import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiFilm, FiLink, FiHeart, FiTrendingUp, FiStar, FiFilter, FiSearch, FiShoppingBag, FiBarChart2, FiPlay, FiPause, FiX, FiCheck, FiCopy, FiUpload } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
    { value: 'trending', label: '🔥 Trending' },
    { value: 'newest', label: '🆕 Newest' },
    { value: 'featured', label: '⭐ Featured' },
];

const VideoPreview = ({ src, thumbnail }) => {
    const [playing, setPlaying] = useState(false);
    const videoRef = useRef();
    const toggle = (e) => {
        e.stopPropagation();
        if (playing) { 
            videoRef.current?.pause(); 
            setPlaying(false); 
        } else { 
            videoRef.current?.play().catch(() => setPlaying(false)); 
            setPlaying(true); 
        }
    };
    return (
        <div className="relative cursor-pointer w-full h-full bg-slate-950" onClick={toggle}>
            <video ref={videoRef} src={src} poster={thumbnail} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <div className="bg-black/50 text-white rounded-full p-3 backdrop-blur-sm">
                    {playing ? <FiPause size={20} /> : <FiPlay size={20} />}
                </div>
            </div>
        </div>
    );
};

const UploadReelModal = ({ onClose, onSuccess, initialProductId = '' }) => {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(initialProductId || '');
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef();

    useEffect(() => {
        if (initialProductId) {
            setSelectedProduct(initialProductId);
        }
    }, [initialProductId]);

    useEffect(() => {
        setLoadingProducts(true);
        api.get('/influencer/marketplace', { params: { limit: 50 } })
            .then((res) => setProducts(res.products || res.data?.products || []))
            .catch(() => {})
            .finally(() => setLoadingProducts(false));
    }, []);


    const handleVideoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 200 * 1024 * 1024) { toast.error('Video size must be under 200MB.'); return; }
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!videoFile) { toast.error('Please select a video file.'); return; }
        if (!title.trim()) { toast.error('Please provide a reel title.'); return; }

        setUploading(true);
        setProgress(0);
        try {
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('title', title.trim());
            formData.append('caption', caption.trim());
            if (selectedProduct) formData.append('productId', selectedProduct);

            await api.post('/influencer/reels/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (evt) => setProgress(Math.round((evt.loaded / evt.total) * 100)),
            });

            toast.success('Reel uploaded and submitted for admin review!');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to upload reel.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                        <FiUpload className="text-purple-600" /> Upload Influencer Reel
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                    {/* Video File Input */}
                    {!videoFile ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-200 hover:border-purple-600 rounded-2xl p-8 flex flex-col items-center gap-2 bg-slate-50 hover:bg-purple-50/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <FiUpload size={22} />
                            </div>
                            <span className="text-sm font-bold text-slate-800">Click to select video</span>
                            <span className="text-xs text-slate-400">MP4, MOV, AVI up to 200MB</span>
                        </button>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-48 flex items-center justify-center">
                            <video src={videoPreview} controls className="max-h-48 w-auto rounded-xl" />
                            <button
                                type="button"
                                onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700"
                            ><FiX size={14} /></button>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo" className="hidden" onChange={handleVideoSelect} />

                    {/* Title */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Reel Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Unboxing & Review of Summer Dress"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2 text-sm outline-none transition-all"
                        />
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Caption / Description</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={2}
                            placeholder="Short caption shown on the reel..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl p-3 text-sm outline-none resize-none transition-all"
                        />
                    </div>

                    {/* Product Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Attach Product (for Affiliate Commission)</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 rounded-xl px-3.5 py-2 text-sm outline-none transition-all"
                        >
                            <option value="">Select a product to promote (Optional)</option>
                            {products.map((p) => (
                                <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                            ))}
                        </select>
                    </div>

                    {uploading && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>Uploading…</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} disabled={uploading} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                        <button type="submit" disabled={uploading || !videoFile} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
                            {uploading ? `Uploading ${progress}%...` : 'Submit Reel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GenerateLinkModal = ({ reel, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(reel.productId?._id || '');

    const generate = async () => {
        setLoading(true);
        try {
            const data = await api.post(`/influencer/reels/${reel._id}/generate-link`, { productId: selectedProduct });
            setLink(data.link || data);
            toast.success('Affiliate link ready!');
        } catch { } finally { setLoading(false); }
    };

    const copy = () => {
        navigator.clipboard.writeText(link?.affiliateUrl || '');
        toast.success('Link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                        <FiLink className="text-purple-600" /> Generate Affiliate Link
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <FiX size={18} />
                    </button>
                </div>

                <p className="text-slate-500 text-sm mb-4">Reel: <span className="text-slate-900 font-semibold">{reel.title}</span></p>

                {/* Products selection */}
                {reel.taggedProducts?.length > 1 && (
                    <div className="mb-4">
                        <p className="text-slate-600 text-xs font-semibold mb-2">Select product to promote:</p>
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                            {[reel.productId, ...(reel.taggedProducts || [])].filter(Boolean).map((p) => {
                                const id = p._id || p.productId;
                                const name = p.name || p.label || 'Product';
                                return (
                                    <button key={id} onClick={() => setSelectedProduct(id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all border ${selectedProduct === id ? 'bg-purple-50 border-purple-300 text-purple-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Commission info */}
                <div className="bg-purple-50 border border-purple-200/80 rounded-xl p-3.5 mb-5 flex items-center justify-between">
                    <span className="text-xs text-purple-700 font-medium">Earn Commission:</span>
                    <span className="text-sm font-bold text-purple-900">{reel.commissionPercent || 5}% Per Sale</span>
                </div>

                {link ? (
                    <div className="space-y-3">
                        <div className="bg-slate-50 border border-emerald-300 rounded-xl p-3">
                            <p className="text-emerald-700 text-xs font-semibold mb-1 flex items-center gap-1">
                                <FiCheck size={14} /> Your Unique Link
                            </p>
                            <p className="text-slate-800 text-xs break-all font-mono bg-white p-2 rounded-lg border border-slate-200">{link.affiliateUrl}</p>
                        </div>
                        <button onClick={copy}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
                            <FiCopy size={16} /> Copy Affiliate Link
                        </button>
                        <button onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-medium transition-all text-sm">Close</button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                        <button onClick={generate} disabled={loading}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
                            {loading ? 'Generating…' : 'Generate Link'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const VendorInvitationsModal = ({ onClose, onAcceptProduct }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState('');

    const fetchInvites = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/influencer/reels/invitations/my-requests');
            setInvitations(data.invitations || []);
        } catch {
            toast.error('Failed to load invitations.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvites(); }, [fetchInvites]);

    const handleRespond = async (invId, action, productId) => {
        setActionId(invId + action);
        try {
            const data = await api.patch(`/influencer/reels/invitations/${invId}/respond`, { action });
            toast.success(action === 'accept' ? 'Invitation accepted! Affiliate link activated.' : 'Invitation declined.');
            fetchInvites();
            if (action === 'accept' && onAcceptProduct) {
                onAcceptProduct(productId);
            }
        } catch {
            toast.error('Failed to update invitation.');
        } finally {
            setActionId('');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                        🎁 Vendor Product Promotion Requests
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <FiX size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-3 py-8">
                        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                    </div>
                ) : invitations.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p className="font-bold text-slate-800">No promotion invitations received yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Vendors can invite you directly to review their products for bonus commission.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {invitations.map((inv) => (
                            <div key={inv._id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-sm">{inv.vendorId?.storeName || 'Vendor'}</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                                            {inv.offeredCommissionPercent}% Commission
                                        </span>
                                    </div>
                                    <p className="text-xs text-purple-600 font-semibold mt-0.5">Product: {inv.productId?.name}</p>
                                    {inv.message && <p className="text-xs text-slate-500 italic mt-1 font-normal">"{inv.message}"</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {inv.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleRespond(inv._id, 'accept', inv.productId?._id)}
                                                disabled={actionId === inv._id + 'accept'}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                            >
                                                Accept &amp; Create Reel
                                            </button>
                                            <button
                                                onClick={() => handleRespond(inv._id, 'decline')}
                                                disabled={actionId === inv._id + 'decline'}
                                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                            >
                                                Decline
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
        </div>
    );
};

const RequestCollaborationModal = ({ onClose }) => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [commissionPercent, setCommissionPercent] = useState('15');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/influencer/marketplace', { params: { limit: 50 } })
            .then((res) => setProducts(res.products || res.data?.products || []))
            .catch(() => {});
    }, []);

    const handleSubmit = async () => {
        if (!selectedProduct) { toast.error('Please select a product to promote.'); return; }
        setSubmitting(true);
        try {
            await api.post('/influencer/reels/request-collaboration', {
                productId: selectedProduct,
                requestedCommissionPercent: Number(commissionPercent) || 10,
                message: message.trim(),
            });
            toast.success('Collaboration request sent to the product vendor!');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-slate-900 font-bold text-lg">Request Product Collaboration</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><FiX size={18} /></button>
                </div>
                <p className="text-xs text-slate-500 mb-4">Request a vendor for a custom product promotion deal or sample review.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Marketplace Product *</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                        >
                            <option value="">-- Choose Product to Promote --</option>
                            {products.map((p) => (
                                <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Requested Commission %</label>
                        <input
                            type="number"
                            value={commissionPercent}
                            onChange={(e) => setCommissionPercent(e.target.value)}
                            placeholder="15"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pitch / Message for Vendor</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Describe your audience and how you plan to feature this product..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl p-2.5 text-xs text-slate-900 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60">
                        {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReelsMarketplace = () => {
    const [searchParams] = useSearchParams();
    const urlProductId = searchParams.get('productId');
    const autoUpload = searchParams.get('autoUpload');
    const [preselectedProductId, setPreselectedProductId] = useState(urlProductId || '');

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('trending');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [generateModal, setGenerateModal] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showInvitationsModal, setShowInvitationsModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [favouriting, setFavouriting] = useState('');

    useEffect(() => {
        if (urlProductId && autoUpload === 'true') {
            setPreselectedProductId(urlProductId);
            setShowUploadModal(true);
        }
    }, [urlProductId, autoUpload]);


    const fetchReels = useCallback(async () => {
        setLoading(true);
        try {
            const params = { sort, page, limit: 12 };
            if (category) params.category = category;
            if (search) params.search = search;
            const data = await api.get('/influencer/reels', { params });
            setReels(data.reels || []);
            setTotal(data.total || 0);
        } catch { toast.error('Failed to load reels.'); } finally { setLoading(false); }
    }, [sort, page, category, search]);

    useEffect(() => {
        api.get('/influencer/reels/categories').then(setCategories).catch(() => { });
    }, []);

    useEffect(() => { fetchReels(); }, [fetchReels]);

    const handleFavourite = async (reelId) => {
        setFavouriting(reelId);
        try {
            const data = await api.post(`/influencer/reels/${reelId}/favourite`);
            setReels((prev) => prev.map((r) => r._id === reelId ? { ...r, isFavourited: data.isFavourited } : r));
            toast.success(data.isFavourited ? 'Added to favourites' : 'Removed from favourites');
        } catch { } finally { setFavouriting(''); }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <FiFilm className="text-purple-600" /> Shoppable Reels Marketplace
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Promote high-converting video reels uploaded by approved vendors or upload your own promotional reels!
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowInvitationsModal(true)}
                        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0 text-sm"
                    >
                        🎁 Vendor Offers
                    </button>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0 text-sm"
                    >
                        💬 Request Product Collaboration
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 text-sm"
                    >
                        <FiUpload size={18} /> Upload My Reel
                    </button>
                </div>
            </div>

            {/* Vendor Requests Modal */}
            {showInvitationsModal && (
                <VendorInvitationsModal
                    onClose={() => setShowInvitationsModal(false)}
                    onAcceptProduct={(prodId) => {
                        setShowInvitationsModal(false);
                        setShowUploadModal(true);
                    }}
                />
            )}

            {/* Request Collaboration Modal */}
            {showRequestModal && (
                <RequestCollaborationModal onClose={() => setShowRequestModal(false)} />
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search reels or vendors..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2 text-sm outline-none transition-all"
                    />
                </div>
                {/* Sort */}
                <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="bg-slate-50 border border-slate-200 focus:border-purple-600 text-slate-700 rounded-xl px-3.5 py-2 text-sm outline-none font-medium transition-all"
                >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* Category */}
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="bg-slate-50 border border-slate-200 focus:border-purple-600 text-slate-700 rounded-xl px-3.5 py-2 text-sm outline-none font-medium transition-all"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Reels Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="bg-slate-100 rounded-2xl aspect-[9/16] animate-pulse" />
                    ))}
                </div>
            ) : reels.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 shadow-sm">
                    <FiFilm size={48} className="mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No reels available right now</h3>
                    <p className="text-sm text-slate-500 mb-4">Check back later or click &quot;Upload My Reel&quot; to share your product video!</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-all shadow-sm"
                    >
                        <FiUpload size={16} /> Upload First Reel
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {reels.map((reel) => (
                        <div key={reel._id} className="group bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                            {/* Reel Video / Thumbnail */}
                            <div className="aspect-[9/16] bg-slate-950 relative overflow-hidden">
                                {reel.videoUrl || reel.video?.secureUrl ? (
                                    <VideoPreview src={reel.video?.secureUrl || reel.videoUrl} thumbnail={reel.thumbnailUrl} />
                                ) : reel.thumbnailUrl ? (
                                    <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><FiFilm size={28} className="text-slate-600" /></div>
                                )}

                                {/* Badges */}
                                {reel.isFeatured && (
                                    <span className="absolute top-2.5 left-2.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">⭐ FEATURED</span>
                                )}

                                <button
                                    onClick={() => handleFavourite(reel._id)}
                                    disabled={favouriting === reel._id}
                                    className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${reel.isFavourited ? 'bg-red-500 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
                                >
                                    <FiHeart size={13} fill={reel.isFavourited ? 'currentColor' : 'none'} />
                                </button>

                                <div className="absolute bottom-2.5 left-2.5 bg-purple-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                    {reel.commissionPercent || 5}% Commission
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                    <h3 className="text-slate-900 text-xs font-bold line-clamp-1">{reel.title}</h3>
                                    <p className="text-slate-500 text-[11px] line-clamp-1">{reel.vendorId?.storeName || 'Vendor'}</p>
                                    {reel.productId && (
                                        <p className="text-purple-600 text-[11px] font-medium line-clamp-1 mt-0.5 flex items-center gap-1">
                                            <FiShoppingBag size={10} /> {reel.productId.name}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setGenerateModal(reel)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <FiLink size={13} /> {reel.hasAffiliateLink ? 'Get Link Again' : 'Get Affiliate Link'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {total > 12 && (
                <div className="flex justify-center items-center gap-3 pt-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 text-sm font-medium transition-all shadow-sm">Previous</button>
                    <span className="text-slate-500 text-sm font-medium">Page {page} of {Math.ceil(total / 12)}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-50 text-sm font-medium transition-all shadow-sm">Next</button>
                </div>
            )}

            {/* Modals */}
            {generateModal && (
                <GenerateLinkModal reel={generateModal} onClose={() => setGenerateModal(null)} />
            )}

            {showUploadModal && (
                <UploadReelModal
                    initialProductId={preselectedProductId}
                    onClose={() => {
                        setShowUploadModal(false);
                        setPreselectedProductId('');
                    }}
                    onSuccess={fetchReels}
                />
            )}

        </div>
    );
};

export default ReelsMarketplace;
